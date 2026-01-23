import { ReactNode, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  const { impactMedium, notificationSuccess } = useHapticFeedback();

  // Transform for action backgrounds
  const leftActionOpacity = useTransform(x, [-threshold * 2, -threshold, 0], [1, 0.8, 0]);
  const rightActionOpacity = useTransform(x, [0, threshold, threshold * 2], [0, 0.8, 1]);
  
  // Scale effect for actions
  const leftActionScale = useTransform(x, [-threshold * 1.5, -threshold, 0], [1, 0.9, 0.5]);
  const rightActionScale = useTransform(x, [0, threshold, threshold * 1.5], [0.5, 0.9, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -threshold || velocity < -500) {
      if (onSwipeLeft) {
        impactMedium();
        onSwipeLeft();
        notificationSuccess();
      }
      setIsRevealed('left');
    } else if (offset > threshold || velocity > 500) {
      if (onSwipeRight) {
        impactMedium();
        onSwipeRight();
        notificationSuccess();
      }
      setIsRevealed('right');
    } else {
      setIsRevealed(null);
    }
  };

  const resetPosition = () => {
    setIsRevealed(null);
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Left action background */}
      {leftAction && (
        <motion.div
          style={{ opacity: leftActionOpacity, scale: leftActionScale }}
          className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-destructive text-destructive-foreground"
        >
          {leftAction}
        </motion.div>
      )}

      {/* Right action background */}
      {rightAction && (
        <motion.div
          style={{ opacity: rightActionOpacity, scale: rightActionScale }}
          className="absolute inset-y-0 left-0 w-24 flex items-center justify-center bg-primary text-primary-foreground"
        >
          {rightAction}
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={isRevealed ? resetPosition : undefined}
        style={{ x }}
        animate={
          isRevealed === 'left'
            ? { x: -80 }
            : isRevealed === 'right'
            ? { x: 80 }
            : { x: 0 }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative bg-card z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
