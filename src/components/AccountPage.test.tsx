import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const state = vi.hoisted(() => ({
  callback: false,
  setup: undefined as string | undefined,
  account: {
    ready: true,
    isSignedIn: false,
    isMember: false,
    isGuest: true,
    profileReady: true,
    profileError: false,
    handle: null as string | null,
  },
}));
vi.mock("@tanstack/react-router", () => ({
  useSearch: () => ({ setup: state.setup }),
  useMatchRoute: () => () => state.callback,
  useNavigate: () => vi.fn(),
  Outlet: () => <p>Callback outlet</p>,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
vi.mock("@/lib/account", () => ({ useAccount: () => state.account }));
vi.mock("@/integrations/lovable", () => ({ lovable: {} }));
vi.mock("@/lib/account-actions", () => ({
  createEmailAccount: vi.fn(),
  prepareGuestSignIn: vi.fn(),
}));
import { AccountPage } from "./AccountPage";

beforeEach(() => {
  state.callback = false;
  state.setup = undefined;
  Object.assign(state.account, {
    ready: true,
    isSignedIn: false,
    isMember: false,
    isGuest: true,
    profileReady: true,
    profileError: false,
    handle: null,
  });
});
const render = () => {
  return renderToString(<AccountPage />);
};

describe("account routes", () => {
  it("renders the nested callback rather than swallowing it in the account page", () => {
    state.callback = true;
    expect(render()).toContain("Callback outlet");
  });
  it("waits for session initialisation instead of offering a competing signup", () => {
    state.account.ready = false;
    expect(render()).toContain("Checking your account");
  });
  it("offers email-first guest conversion with no password persisted before verification", () => {
    const html = render();
    expect(html).toContain("Send confirmation email");
    expect(html).not.toContain('type="password"');
    expect(html).toContain("Continue with Google");
  });
  it("shows password setup only after membership is confirmed", () => {
    Object.assign(state.account, { isSignedIn: true, isMember: true, isGuest: false });
    state.setup = "password";
    const html = render();
    expect(html).toContain("Finish creating your account");
    expect(html).toContain("Confirm password");
  });
  it("does not flash the choose-name form while the existing profile loads", () => {
    Object.assign(state.account, { isSignedIn: true, isMember: true, profileReady: false });
    expect(render()).toContain("Checking your account");
  });
});
