import { motion, type Variants } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

/** Smooth cubic-bezier for natural page transitions */
const ease = [0.22, 1, 0.36, 1] as const;

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    filter: "blur(2px)",
    transition: {
      duration: 0.25,
      ease,
    },
  },
};

/**
 * Page transition wrapper using framer-motion.
 * Provides a smooth fade + slide + scale + blur effect between route changes.
 */
const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
