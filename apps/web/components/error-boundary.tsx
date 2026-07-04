'use client';

import React, { Component, type ReactNode } from 'react';
import { Button } from '@workspace/ui/button';

interface Props {
  children?: ReactNode;
  fallback?:
    ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error!,
            reset: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-xl font-bold text-destructive">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button onClick={this.handleReset} className="cursor-pointer">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
