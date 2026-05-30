'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}