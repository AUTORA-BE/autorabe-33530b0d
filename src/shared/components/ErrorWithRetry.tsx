/**
 * Error state with retry button
 * @module shared/components/ErrorWithRetry
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorWithRetryProps {
  /** Error message to display */
  message?: string;
  /** Retry callback */
  onRetry: () => void;
}

/**
 * Inline error state with retry — use inside sections, not full pages
 */
export function ErrorWithRetry({
  message = 'Une erreur est survenue. Veuillez réessayer.',
  onRetry,
}: ErrorWithRetryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}

export default ErrorWithRetry;
