import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Eye, FishSymbol, Loader2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteTank,
  duplicateTank,
  renameTank as renameTankRecord,
  useSessionTanks,
} from "@/lib/data";
import { PRESET_KEY, TANK_PRESETS } from "@/lib/presets";
import type { TankRow } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WaitlistSignup } from "@/components/WaitlistSignup";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "My tanks — FishTankr" },
      { name: "description", content: "Tanks you've saved in this browser." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedTanks,
});

function SavedTanks() {
  const { data, isLoading } = useSessionTanks();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<TankRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TankRow | null>(null);

  function loadPreset(id: string) {
    sessionStorage.setItem(PRESET_KEY, id);
    navigate({ to: "/" });
  }

  async function refreshTanks() {
    await queryClient.invalidateQueries({ queryKey: ["tanks", "session"] });
  }

  async function handleDuplicate(tank: TankRow) {
    try {
      setBusyId(tank.id);
      const copy = await duplicateTank(tank.share_slug);
      await refreshTanks();
      toast.success("Tank duplicated", {
        description: `Created ${copy.name}.`,
      });
      navigate({ to: "/", search: { tank: copy.share_slug } });
    } catch (error) {
      console.error(error);
      toast.error("Couldn't duplicate this tank", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename() {
    if (!renameTarget) return;
    try {
      setBusyId(renameTarget.id);
      await renameTankRecord(renameTarget.id, renameValue);
      await refreshTanks();
      setRenameTarget(null);
      toast.success("Tank renamed");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't rename this tank", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      setBusyId(target.id);
      await deleteTank(target.id);
      await refreshTanks();
      toast.success("Tank deleted");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete this tank", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setBusyId(null);
    }
  }

  function openRename(tank: TankRow) {
    setRenameTarget(tank);
    setRenameValue(tank.name);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        My tanks
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reopen, edit, copy or share the tanks saved in this browser.
      </p>
      <div className="mt-4 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-foreground">
        <strong>Anonymous save:</strong> clearing browser data can disconnect these tanks from you,
        and there is currently no account recovery path. Keep important share links somewhere safe.
      </div>
      <div className="mt-4">
        <WaitlistSignup />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-3xl border bg-card p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FishSymbol className="h-6 w-6" aria-hidden />
            </div>
            <p className="font-display text-base font-semibold text-foreground">
              No saved tanks yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Build a tank and hit Save — it'll appear here.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
            >
              Open the builder
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((tank) => {
              const litres = Math.round((tank.length_cm * tank.width_cm * tank.height_cm) / 1000);
              const busy = busyId === tank.id;
              return (
                <li key={tank.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-display font-semibold text-foreground">{tank.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tank.length_cm}×{tank.width_cm}×{tank.height_cm} cm · {litres} L ·{" "}
                        {new Date(tank.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to="/"
                      search={{ tank: tank.share_slug }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-95"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </Link>
                    <Link
                      to="/t/$slug"
                      params={{ slug: tank.share_slug }}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDuplicate(tank)}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openRename(tank)}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleteTarget(tank)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-coral/30 px-3 py-2 text-xs font-semibold text-coral transition-colors hover:bg-coral/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Start from a template
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            One-click starters. They open the builder pre-filled — tweak as you go.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {TANK_PRESETS.map((preset) => {
              const litres =
                ((preset.base.length_cm ?? 0) *
                  (preset.base.width_cm ?? 0) *
                  (preset.base.height_cm ?? 0)) /
                1000;
              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    onClick={() => loadPreset(preset.id)}
                    className="group flex h-full w-full flex-col rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display font-semibold text-foreground group-hover:text-primary">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {preset.region}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{preset.blurb}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {preset.base.length_cm}×{preset.base.width_cm}×{preset.base.height_cm} cm · ~
                      {Math.round(litres)} L
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename tank</DialogTitle>
          </DialogHeader>
          <label className="text-sm font-medium text-foreground" htmlFor="tank-name">
            Tank name
          </label>
          <input
            id="tank-name"
            autoFocus
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && renameValue.trim()) void handleRename();
            }}
            className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!renameValue.trim() || busyId === renameTarget?.id}
              onClick={() => void handleRename()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Save name
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the saved tank and its share link. This action cannot be
              undone from FishTankr.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep tank</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-coral text-white hover:bg-coral/90"
            >
              Delete tank
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
