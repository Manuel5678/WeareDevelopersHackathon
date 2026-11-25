import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-neutral-600 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
