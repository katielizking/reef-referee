import { useCallback, useEffect, useRef, useState } from "react";
import type { TankState } from "@/lib/types";

const LIMIT = 50;

/**
 * Snapshot-based undo/redo for the builder. `commit(state)` should be called
 * after a discrete edit; continuous drags call `commit` once on pointer up.
 */
export function useTankHistory(state: TankState, setState: (s: TankState) => void) {
  const past = useRef<TankState[]>([]);
  const future = useRef<TankState[]>([]);
  const [, force] = useState(0);
  const lastCommitted = useRef<TankState>(state);

  useEffect(() => {
    lastCommitted.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = useCallback(() => {
    if (lastCommitted.current === state) return;
    past.current.push(lastCommitted.current);
    if (past.current.length > LIMIT) past.current.shift();
    future.current = [];
    lastCommitted.current = state;
    force((n) => n + 1);
  }, [state]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(lastCommitted.current);
    lastCommitted.current = prev;
    setState(prev);
    force((n) => n + 1);
  }, [setState]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(lastCommitted.current);
    lastCommitted.current = next;
    setState(next);
    force((n) => n + 1);
  }, [setState]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return {
    commit,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
