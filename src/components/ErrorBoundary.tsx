import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

/**
 * ErrorBoundary — catches render-time errors in any child so a single panel crash
 * can never blank the entire app (there was no boundary before, so any route crash
 * produced a full black screen). Falls back to a styled, traceable card.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  componentDidCatch(error: unknown) {
    console.error("[ErrorBoundary] Caught render error:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[60vh] p-6">
          <div className="glass rounded-xl border border-white/8 p-6 max-w-md text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm text-white/70 font-display mb-1">
              Something went wrong
            </div>
            <div className="text-xs text-white/30 mb-4 break-words">
              {this.state.message}
            </div>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
            >
              RELOAD PANEL
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}