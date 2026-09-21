import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  updateUser: vi.fn(),
  signUp: vi.fn(),
  readGuestClaim: vi.fn(),
  rememberGuest: vi.fn(),
  forgetGuestClaim: vi.fn(),
  claimGuestData: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: mocks } }));
vi.mock("./account", () => mocks);
vi.mock("./claim.functions", () => mocks);
import { createEmailAccount, finishGuestSignIn, prepareGuestSignIn } from "./account-actions";

const session = (id: string, guest = false) => ({
  data: { session: { user: { id, is_anonymous: guest }, access_token: "test-proof" } },
  error: null,
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.getSession.mockResolvedValue(session("member"));
});

describe("email account creation", () => {
  it("upgrades the same guest identity, verifying email before setting a password", async () => {
    mocks.getSession.mockResolvedValue(session("guest", true));
    expect(
      await createEmailAccount(" fish@example.test ", "not-stored", "https://fishtankr.com"),
    ).toEqual({ needsVerification: true, guestUpgrade: true });
    expect(mocks.updateUser).toHaveBeenCalledWith(
      { email: "fish@example.test" },
      { emailRedirectTo: "https://fishtankr.com/auth?setup=password" },
    );
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.forgetGuestClaim).not.toHaveBeenCalled();
  });
  it("does not assume a session after ordinary signup with confirmation enabled", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    expect(
      await createEmailAccount("fish@example.test", "password", "https://fishtankr.com"),
    ).toEqual({ needsVerification: true, guestUpgrade: false });
  });
  it("surfaces upgrade failures without creating a second account", async () => {
    mocks.getSession.mockResolvedValue(session("guest", true));
    mocks.updateUser.mockResolvedValue({ error: new Error("Email unavailable") });
    await expect(
      createEmailAccount("fish@example.test", "", "https://fishtankr.com"),
    ).rejects.toThrow("Email unavailable");
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
});

describe("guest session transfer", () => {
  it("captures the current guest proof before sign-in", async () => {
    mocks.getSession.mockResolvedValue(session("guest", true));
    mocks.readGuestClaim.mockReturnValue({ guestId: "guest", guestToken: "test-proof" });
    await prepareGuestSignIn();
    expect(mocks.rememberGuest).toHaveBeenCalledWith(
      { id: "guest", is_anonymous: true },
      "test-proof",
    );
  });
  it("does not silently discard guest data when storage is blocked", async () => {
    mocks.getSession.mockResolvedValue(session("guest", true));
    await expect(prepareGuestSignIn()).rejects.toThrow("session storage");
  });
  it("deduplicates callback remounts and clears proof after success", async () => {
    const claim = { guestId: "guest", guestToken: "test-proof" };
    mocks.readGuestClaim.mockReturnValue(claim);
    mocks.claimGuestData.mockResolvedValue({ claimed: 3, status: "complete" });
    const results = await Promise.all([finishGuestSignIn(), finishGuestSignIn()]);
    expect(results[0].claimed).toBe(3);
    expect(mocks.claimGuestData).toHaveBeenCalledTimes(1);
    expect(mocks.claimGuestData).toHaveBeenCalledWith({ data: claim });
    expect(mocks.forgetGuestClaim).toHaveBeenCalledTimes(1);
  });
  it("preserves proof after transfer failure so the member can retry", async () => {
    mocks.readGuestClaim.mockReturnValue({ guestId: "guest", guestToken: "test-proof" });
    mocks.claimGuestData.mockRejectedValue(new Error("Offline"));
    await expect(finishGuestSignIn()).rejects.toThrow("Offline");
    expect(mocks.forgetGuestClaim).not.toHaveBeenCalled();
    mocks.claimGuestData.mockResolvedValue({ claimed: 3, status: "complete" });
    expect((await finishGuestSignIn()).claimed).toBe(3);
  });
  it("does not discard proof if the destination already has data", async () => {
    mocks.readGuestClaim.mockReturnValue({ guestId: "guest", guestToken: "test-proof" });
    mocks.claimGuestData.mockResolvedValue({ claimed: 0, status: "account_has_data" });
    expect((await finishGuestSignIn()).status).toBe("account_has_data");
    expect(mocks.forgetGuestClaim).not.toHaveBeenCalled();
  });
  it("does not transfer data to an anonymous or absent session", async () => {
    mocks.getSession.mockResolvedValue(session("guest", true));
    await expect(finishGuestSignIn()).rejects.toThrow("Sign-in did not finish");
    expect(mocks.claimGuestData).not.toHaveBeenCalled();
  });
  it("does not copy data after an in-place email upgrade", async () => {
    mocks.readGuestClaim.mockReturnValue({ guestId: "member", guestToken: "old-proof" });
    expect((await finishGuestSignIn()).claimed).toBe(0);
    expect(mocks.claimGuestData).not.toHaveBeenCalled();
    expect(mocks.forgetGuestClaim).toHaveBeenCalled();
  });
});
