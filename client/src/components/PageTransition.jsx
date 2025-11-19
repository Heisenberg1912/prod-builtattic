import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const springyEase = [0.25, 1, 0.5, 1];

const livelyVariants = {
  initial: {
    opacity: 0,
    y: 28,
    scale: 0.985,
    rotateX: -3,
    filter: "blur(10px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -28,
    scale: 0.985,
    rotateX: 3,
    filter: "blur(8px)",
  },
};

const reducedVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const PageTransition = ({ children }) => {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className="page-transition"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={prefersReduced ? reducedVariants : livelyVariants}
      transition={{ duration: 0.32, ease: springyEase }}
      style={{
        width: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        perspective: "1200px",
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
