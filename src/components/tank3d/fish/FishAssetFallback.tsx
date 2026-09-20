import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  errored: boolean;
}

/**
 * Isolates a GLB rendering subtree so a bad model, a decoder failure, or a
 * mid-flight WebGL context loss can never take down the aquarium — the
 * boundary swaps in the procedural fish and logs once.
 */
export class FishAssetErrorBoundary extends Component<Props, State> {
  state: State = { errored: false };

  static getDerivedStateFromError(): State {
    return { errored: true };
  }

  componentDidCatch(error: unknown): void {
    console.warn("[fish3d] GLB render failed, falling back to procedural:", error);
  }

  render() {
    if (this.state.errored) return this.props.fallback;
    return this.props.children;
  }
}
