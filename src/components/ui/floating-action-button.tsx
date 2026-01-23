import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  variant?: 'primary' | 'secondary' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  badge?: number;
  className?: string;
  children?: ReactNode;
  expandable?: boolean;
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  variant = 'primary',
  size = 'md',
  pulse = false,
  badge,
  className,
  children,
  expandable = false,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { impactLight, selectionChanged } = useHapticFeedback();

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
    secondary: 'bg-secondary text-secondary-foreground shadow-lg',
    glass: 'bg-background/80 backdrop-blur-xl text-foreground border border-border shadow-xl',
  };

  const handleClick = () => {
    impactLight();
    if (expandable) {
      setIsExpanded(!isExpanded);
      selectionChanged();
    }
    onClick?.();
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Expanded menu */}
      <AnimatePresence>
        {isExpanded && children && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-full mb-3 right-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'rounded-full flex items-center justify-center relative',
          'transition-all duration-200 active:outline-none focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-label={label}
      >
        {/* Pulse animation */}
        {pulse && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
        )}

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center px-1"
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}

        {/* Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {icon}
        </motion.div>
      </motion.button>
    </div>
  );
}
