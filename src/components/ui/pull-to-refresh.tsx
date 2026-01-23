import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  className = '',
  disabled = false 
}: PullToRefreshProps) {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    shouldTrigger,
  } = usePullToRefresh({ onRefresh, disabled });

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && pullDistance > 10 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: Math.min(1, pullProgress * 2), 
              y: Math.min(pullDistance - 30, 30) 
            }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div 
              className={`
                flex items-center justify-center w-10 h-10 rounded-full 
                bg-background/95 backdrop-blur-sm border border-border shadow-lg
                transition-colors duration-200
                ${shouldTrigger ? 'border-primary bg-primary/10' : ''}
              `}
            >
              {isRefreshing ? (
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <motion.div
                  animate={{ rotate: shouldTrigger ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <ArrowDown 
                    className={`w-5 h-5 transition-colors ${
                      shouldTrigger ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{
          y: isPulling || isRefreshing ? pullDistance * 0.3 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
