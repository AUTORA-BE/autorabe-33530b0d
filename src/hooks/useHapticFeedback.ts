import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/**
 * Hook for haptic feedback on mobile devices
 * Uses Vibration API with fallback patterns
 */
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration not supported or blocked
      }
    }
  }, []);

  const trigger = useCallback((type: HapticPattern = 'light') => {
    const patterns: Record<HapticPattern, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 20],
      warning: [20, 30, 20, 30, 20],
      error: [50, 30, 50],
      selection: 5,
    };

    vibrate(patterns[type]);
  }, [vibrate]);

  const impactLight = useCallback(() => trigger('light'), [trigger]);
  const impactMedium = useCallback(() => trigger('medium'), [trigger]);
  const impactHeavy = useCallback(() => trigger('heavy'), [trigger]);
  const notificationSuccess = useCallback(() => trigger('success'), [trigger]);
  const notificationWarning = useCallback(() => trigger('warning'), [trigger]);
  const notificationError = useCallback(() => trigger('error'), [trigger]);
  const selectionChanged = useCallback(() => trigger('selection'), [trigger]);

  return {
    trigger,
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationWarning,
    notificationError,
    selectionChanged,
  };
}
