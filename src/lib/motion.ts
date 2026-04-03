import type { TargetAndTransition, Variants } from 'framer-motion'

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_SOFT = [0.16, 1, 0.3, 1] as const

export const motionDurations = {
  fast: 0.18,
  normal: 0.28,
  slow: 0.4,
} as const

export const fast = { duration: motionDurations.fast, ease: EASE_OUT } as const
export const normal = { duration: motionDurations.normal, ease: EASE_OUT } as const

export const gentleSpring = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.8,
} as const

export const layoutSpring = {
  type: 'spring',
  stiffness: 360,
  damping: 32,
  mass: 0.72,
} as const

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDurations.slow, ease: EASE_SOFT },
  },
}

export const panelEnter: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: motionDurations.normal, ease: EASE_OUT },
  },
}

export const listStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.02 },
  },
}

export const overlayEnter: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: motionDurations.fast, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.985,
    transition: { duration: 0.14, ease: EASE_OUT },
  },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: gentleSpring,
  },
}

export const microHover = {
  y: -1,
  transition: fast,
} as const

export const microPress = {
  scale: 0.985,
  transition: { duration: 0.12, ease: EASE_OUT },
} as const

export const statusPulse: TargetAndTransition = {
  scale: [1, 1.04, 1],
  opacity: [0.9, 1, 0.9],
  transition: {
    duration: 1.6,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

// Backwards-compatible aliases for existing call sites
export const fadeUp = panelEnter
export const staggerContainer = listStagger
export const spring = layoutSpring
