// src/lib/animations.ts — Shared Framer Motion variants

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
}

export const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]
