import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { DEFAULT_STATE, DRAFT_KEY, parseDraft, type TankDraft } from "@/lib/tank-draft";
import type { TankState } from "@/lib/types";
interface DraftContext {
  state: TankState; setState: Dispatch<SetStateAction<TankState>>;
  savedId?: string; setSavedId: Dispatch<SetStateAction<string | undefined>>;
  source?: string; setSource: Dispatch<SetStateAction<string | undefined>>;
  hydrated: boolean; storageStatus: string;
}
const Context = createContext<DraftContext | null>(null);
export function TankDraftProvider({children}: {children: ReactNode}) {
  const [state,setState] = useState<TankState>(DEFAULT_STATE);
  const [savedId,setSavedId] = useState<string>();
  const [source,setSource] = useState<string>();
  const [hydrated,setHydrated] = useState(false);
  const [savedSnapshot,setSavedSnapshot] = useState("");
  const [storageFailed,setStorageFailed] = useState(false);
  const snapshot = JSON.stringify({version: 1,state,savedId,source} satisfies TankDraft);
  useEffect(() => {
    try {
      const draft = parseDraft(localStorage.getItem(DRAFT_KEY));
      if (draft) { setState(draft.state); setSavedId(draft.savedId); setSource(draft.source); }
    } catch { setStorageFailed(true); }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    // Synchronous storage avoids losing a final edit when navigating or refreshing.
    try { localStorage.setItem(DRAFT_KEY,snapshot); setSavedSnapshot(snapshot); setStorageFailed(false); }
    catch { setStorageFailed(true); }
  }, [snapshot,hydrated]);
  const storageStatus = storageFailed ? "Device storage unavailable" : hydrated && savedSnapshot === snapshot ? "Saved on this device" : "Saving draft…";
  return <Context.Provider value={{state,setState,savedId,setSavedId,source,setSource,hydrated,storageStatus}}>{children}</Context.Provider>;
}
export function useTankDraft() {
  const value = useContext(Context);
  if (!value) throw new Error("TankDraftProvider is required");
  return value;
}
