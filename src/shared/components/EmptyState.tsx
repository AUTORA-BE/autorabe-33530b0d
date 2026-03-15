/**
 * Premium empty state component
 * @module shared/components/EmptyState
 */

import { type LucideIcon, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Heading text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Callback for the action button */
  onAction?: () => void;
}

/**
 * Reusable empty state with icon, text, and optional CTA
 */
export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 sm:py-20">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
