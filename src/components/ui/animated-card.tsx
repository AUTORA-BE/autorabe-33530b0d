import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'hover-lift' | 'hover-glow' | 'hover-scale' | 'press';
  delay?: number;
  className?: string;
}

const cardVariants: Record<string, Variants> = {
  default: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  'hover-lift': {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  'hover-glow': {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  'hover-scale': {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  press: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  },
};

const hoverVariants: Record<string, any> = {
  default: {},
  'hover-lift': { y: -4, transition: { type: 'spring', stiffness: 400 } },
  'hover-glow': { boxShadow: '0 0 30px rgba(var(--primary), 0.2)' },
  'hover-scale': { scale: 1.02, transition: { type: 'spring', stiffness: 400 } },
  press: {},
};

const tapVariants: Record<string, any> = {
  default: { scale: 0.98 },
  'hover-lift': { scale: 0.98, y: 0 },
  'hover-glow': { scale: 0.98 },
  'hover-scale': { scale: 0.98 },
  press: { scale: 0.95 },
};

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, variant = 'default', delay = 0, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={cardVariants[variant]}
        whileHover={hoverVariants[variant]}
        whileTap={tapVariants[variant]}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay,
        }}
        className={cn(
          'rounded-2xl bg-card border border-border/50 overflow-hidden transition-shadow',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
