/**
 * Native-feel pull-to-refresh for mobile
 * Uses Framer Motion + Vibration API for haptic feedback
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  /** Pull distance in px to trigger refresh */
  threshold?: number;
  /** Whether refresh is currently disabled */
  disabled?: boolean;
}

const PULL_MAX = 120;

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 70,
  disabled = false,
}: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const { impactMedium, notificationSuccess } = useHapticFeedback();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const pullY = useMotionValue(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  // Transforms
  const indicatorOpacity = useTransform(pullY, [0, threshold * 0.4, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullY, [0, threshold], [0.5, 1]);
  const indicatorRotate = useTransform(pullY, [0, PULL_MAX], [0, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isMobile) return;
    // Only allow pull if scrolled to top
    const el = e.currentTarget;
    if (el.scrollTop > 5) return;
    touchStartY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [disabled, isRefreshing, isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const el = e.currentTarget;
    if (el.scrollTop > 5) {
      isPulling.current = false;
      pullY.set(0);
      return;
    }

    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY <= 0) {
      pullY.set(0);
      return;
    }

    // Rubber-band effect
    const dampened = Math.min(deltaY * 0.45, PULL_MAX);
    pullY.set(dampened);

    // Haptic on threshold cross
    if (dampened >= threshold && !triggered) {
      setTriggered(true);
      impactMedium();
    } else if (dampened < threshold && triggered) {
      setTriggered(false);
    }
  }, [pullY, threshold, triggered, impactMedium, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    const currentPull = pullY.get();

    if (currentPull >= threshold && !isRefreshing) {
      // Snap to loading position
      animate(pullY, 50, { type: 'spring', stiffness: 300, damping: 25 });
      setIsRefreshing(true);
      setTriggered(false);

      try {
        await onRefresh();
        notificationSuccess();
      } finally {
        setIsRefreshing(false);
        animate(pullY, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }
    } else {
      setTriggered(false);
      animate(pullY, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }, [pullY, threshold, isRefreshing, onRefresh, notificationSuccess]);

  // Desktop: just render children
  if (!isMobile) return <>{children}</>;

  return (
    <div
      className="relative overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center z-30 pointer-events-none"
        style={{ top: -8, y: pullY }}
      >
        <motion.div
          className="w-9 h-9 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center shadow-sm"
          style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        >
          <motion.div style={{ rotate: isRefreshing ? undefined : indicatorRotate }}>
            <RefreshCw
              className={`h-4 w-4 text-primary ${isRefreshing ? 'animate-spin' : ''} ${triggered ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content pushed down */}
      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
