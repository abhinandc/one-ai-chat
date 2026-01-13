import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Type guard for custom error reporting function on window
 */
function hasReportError(
  win: Window & typeof globalThis
): win is Window & typeof globalThis & { reportError: (error: Error, errorInfo: React.ErrorInfo) => void } {
  return typeof (win as Window & { reportError?: unknown }).reportError === 'function';
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application Error:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Report to error tracking service if available
    if (typeof window !== "undefined" && hasReportError(window)) {
      window.reportError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-full flex items-center justify-center bg-background p-lg">
          <GlassCard className="max-w-md w-full p-xl text-center">
            <div className="space-y-lg">
              <div className="space-y-md">
                <AlertTriangle className="h-16 w-16 text-accent-red mx-auto" />
                <h2 className="text-xl font-semibold text-text-primary">Something went wrong</h2>
                <p className="text-text-secondary">
                  An unexpected error occurred. This has been logged for investigation.
                </p>
              </div>

              {this.props.showDetails && this.state.error && (
                <div className="bg-surface-graphite p-md rounded-lg text-left">
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap overflow-auto">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              <div className="flex gap-sm">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-sm" />
                  Reload
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1">
                  <Home className="h-4 w-4 mr-sm" />
                  Home
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
