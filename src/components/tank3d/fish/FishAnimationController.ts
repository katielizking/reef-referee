import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { FishAssetDefinition, FishAnimationState } from "@/lib/fish3d/types";

/**
 * Priority chain used when a clip for the current state is not available.
 * Follows the plan's dart → fast → cruise → idle degradation.
 */
const FALLBACK_CHAIN: Record<FishAnimationState, FishAnimationState[]> = {
  dart: ["dart", "fast", "cruise", "idle"],
  fast: ["fast", "cruise", "idle"],
  cruise: ["cruise", "idle"],
  hover: ["hover", "idle"],
  idle: ["idle"],
  forage: ["forage", "idle"],
  surface: ["surface", "cruise", "idle"],
  turnLeft: ["turnLeft", "cruise", "idle"],
  turnRight: ["turnRight", "cruise", "idle"],
  patrol: ["patrol", "cruise", "idle"],
  display: ["display", "idle"],
};

const SPEED_SCALE: Record<FishAnimationState, number> = {
  dart: 1.6,
  fast: 1.25,
  cruise: 1.0,
  hover: 0.5,
  idle: 1.0,
  forage: 0.7,
  surface: 1.0,
  turnLeft: 1.0,
  turnRight: 1.0,
  patrol: 1.0,
  display: 1.0,
};

const CROSSFADE_SECONDS = 0.25;

export function useFishAnimationController(params: {
  root: THREE.Object3D | null;
  clips: THREE.AnimationClip[];
  asset: FishAssetDefinition;
}) {
  const { root, clips, asset } = params;
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentRef = useRef<{ state: FishAnimationState; action: THREE.AnimationAction } | null>(
    null,
  );

  const actionsByState = useMemo(() => {
    if (!root || clips.length === 0) return new Map<FishAnimationState, THREE.AnimationAction>();
    const mixer = new THREE.AnimationMixer(root);
    mixerRef.current = mixer;
    const map = new Map<FishAnimationState, THREE.AnimationAction>();
    const anims = asset.animations ?? {};
    (Object.keys(anims) as FishAnimationState[]).forEach((state) => {
      const clipName = anims[state];
      const clip = clipName ? clips.find((c) => c.name === clipName) : undefined;
      if (clip) map.set(state, mixer.clipAction(clip));
    });
    return map;
  }, [root, clips, asset]);

  useEffect(() => {
    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
    };
  }, []);

  const resolveAction = (state: FishAnimationState): {
    state: FishAnimationState;
    action: THREE.AnimationAction;
  } | null => {
    for (const candidate of FALLBACK_CHAIN[state]) {
      const action = actionsByState.get(candidate);
      if (action) return { state: candidate, action };
    }
    return null;
  };

  return {
    /** Advance the mixer. Speed is the instantaneous cruise multiplier. */
    tick(delta: number, speedMul: number) {
      const mixer = mixerRef.current;
      if (!mixer) return;
      mixer.update(delta);
      const cur = currentRef.current;
      if (cur) mixer.timeScale = SPEED_SCALE[cur.state] * speedMul;
    },

    /** Blend to the clip for the given behavioural state. No-op if already active. */
    setState(state: FishAnimationState) {
      const next = resolveAction(state);
      if (!next) return;
      const cur = currentRef.current;
      if (cur && cur.action === next.action) {
        currentRef.current = { state: next.state, action: next.action };
        return;
      }
      next.action.reset().fadeIn(CROSSFADE_SECONDS).play();
      if (cur) cur.action.fadeOut(CROSSFADE_SECONDS);
      currentRef.current = { state: next.state, action: next.action };
    },

    /** Halt animation entirely (reduced motion). */
    freeze() {
      const mixer = mixerRef.current;
      if (mixer) mixer.timeScale = 0;
    },
  };
}
