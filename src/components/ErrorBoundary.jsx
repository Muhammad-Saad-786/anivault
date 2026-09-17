// src/components/ErrorBoundary.jsx
import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-black">Something broke</h1>
          <p className="mt-2 text-sm text-text-secondary">
            The page hit an unexpected error. You can retry or go back home.
          </p>

          {isDev && this.state.error && (
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-border-dark bg-surface-dark p-3 text-left text-[11px] text-brand">
              {this.state.error.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={this.handleReload} className="btn-brand">
              <RefreshCw className="h-4 w-4" /> Reload
            </button>
            <button onClick={this.handleReset} className="btn-ghost">
              Try again
            </button>
            <Link to="/" onClick={this.handleReset} className="btn-ghost">
              <Home className="h-4 w-4" /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
