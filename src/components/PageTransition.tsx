import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
  isReady?: boolean;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, isReady = true }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className="w-full min-h-full flex-grow flex flex-col">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.38,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ willChange: 'opacity, transform' }}
      className="w-full min-h-full flex-grow flex flex-col"
    >
      {children}
    </motion.div>
  );
};

