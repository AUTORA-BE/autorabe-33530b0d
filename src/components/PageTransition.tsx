import { ReactNode, useState } from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  duration: 0.28,
};

const PageTransition = ({ children }: PageTransitionProps) => {
  // Le filet CSS de rattrapage n'est armé que tant que l'animation d'entrée
  // n'a pas abouti. Une fois jouée, l'attribut disparaît : l'animation de
  // sortie (AnimatePresence) n'est jamais figée à opacity: 1.
  const [entered, setEntered] = useState(false);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      onAnimationComplete={(definition) => {
        if (definition === "animate") setEntered(true);
      }}
      {...(entered ? {} : { "data-page-reveal": "" })}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
