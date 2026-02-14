import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Lightweight page transition wrapper using CSS animation.
 * Replaces framer-motion to reduce main-thread style/layout cost.
 */
const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <div className="animate-fade-in" style={{ animationDuration: "0.35s" }}>
      {children}
    </div>
  );
};

export default PageTransition;
