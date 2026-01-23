import { useState, useCallback, useRef, useEffect } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { impactMedium, notificationSuccess } = useHapticFeedback();

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, (currentY.current - startY.current) * 0.5);
    
    setPullDistance(Math.min(distance, threshold * 1.5));
    
    // Haptic feedback when reaching threshold
    if (distance >= threshold && pullDistance < threshold) {
      impactMedium();
    }
  }, [isPulling, disabled, isRefreshing, threshold, pullDistance, impactMedium]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
        notificationSuccess();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [isPulling, disabled, pullDistance, threshold, isRefreshing, onRefresh, notificationSuccess]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullProgress = Math.min(1, pullDistance / threshold);
  const shouldTrigger = pullDistance >= threshold;

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    shouldTrigger,
  };
}
