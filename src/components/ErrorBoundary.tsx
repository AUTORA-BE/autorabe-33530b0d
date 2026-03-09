/**
 * Error Boundary global pour capturer les erreurs React
 * Affiche un fallback convivial et permet de retry
 *
 * @module components/ErrorBoundary
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Composant fallback personnalisé */
  fallback?: ReactNode;
  /** Callback appelé lors d'une erreur */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Oups, quelque chose s'est mal passé
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md">
            Une erreur inattendue est survenue. Essayez de recharger cette section.
          </p>
          {this.state.error && (
            <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 mb-4 max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <Button onClick={this.handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
