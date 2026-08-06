import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, ShieldAlert } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React Component Tree:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetStorage = () => {
    if (
      window.confirm(
        "Are you sure you want to clear local cached preferences to restore the app? Your environment data will be safely re-initialized from defaults."
      )
    ) {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
      }
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Emergency Recovery Mode
                </h1>
                <p className="text-xs text-slate-400">
                  CEO Lifestyle Management System — Automatic Fault Isolation
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                The application encountered an unexpected runtime error during rendering. This is usually caused by corrupted cached data in your browser's local storage or a missing component state.
              </p>

              {this.state.error && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-rose-300 overflow-x-auto space-y-2">
                  <div className="font-bold text-rose-400 border-b border-rose-900/40 pb-1 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Error: {this.state.error.name}
                  </div>
                  <p className="whitespace-pre-wrap">{this.state.error.message}</p>
                  {this.state.error.stack && (
                    <details className="mt-2 text-[10px] text-slate-500 cursor-pointer">
                      <summary className="hover:text-slate-300 transition-colors font-sans font-semibold">
                        View Technical Stack Trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-slate-400 font-mono text-[10px] max-h-48 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full sm:w-auto flex-1 bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-rose-300 font-bold py-3 px-5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear Local Cache & Reset Defaults
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
