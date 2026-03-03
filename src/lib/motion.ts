import { Variants } from 'framer-motion'

// Single element: fade + slight slide-up
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0 },
}

// Container for staggered children
export const staggerContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } },
}

// Badge/chip: mini pop
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.75 },
  show:   { opacity: 1, scale: 1 },
}

// Spring transition for layout animations
export const spring = { type: 'spring', bounce: 0.2, duration: 0.4 } as const
