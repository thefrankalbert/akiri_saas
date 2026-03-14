'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
            <h2 className="mb-2 text-xl font-semibold">Une erreur est survenue</h2>
            <p className="mb-4 text-neutral-500">
              Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-primary rounded-lg px-4 py-2 text-white transition hover:opacity-90"
            >
              Réessayer
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
