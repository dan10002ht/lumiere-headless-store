"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const EASE = [0.25, 0.46, 0.45, 0.94];

const DIR_OFFSETS = {
  up: { y: 30, x: 0 },
  down: { y: -30, x: 0 },
  left: { x: 30, y: 0 },
  right: { x: -30, y: 0 },
  none: { x: 0, y: 0 },
};

export function FadeIn({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  threshold = 0.15,
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const prefersReduced = useReducedMotion();
  const offset = DIR_OFFSETS[direction] || DIR_OFFSETS.up;

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? {} : { opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease: EASE }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  once = true,
  threshold = 0.1,
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
        hidden: {},
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, direction = "up", ...props }) {
  const prefersReduced = useReducedMotion();
  const offset = DIR_OFFSETS[direction] || DIR_OFFSETS.up;

  return (
    <motion.div
      variants={{
        hidden: prefersReduced
          ? {}
          : { opacity: 0, y: offset.y * 0.67, x: offset.x * 0.67 },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.5, ease: EASE },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
