export const animation = {
  duration: {
    micro: 180,
    fast: 220,
    normal: 300,
    slow: 450,
    onboarding: 550,
  },
  easing: {
    standard: [0.2, 0.0, 0.0, 1.0] as const,
    decelerate: [0.0, 0.0, 0.2, 1.0] as const,
    accelerate: [0.4, 0.0, 1.0, 1.0] as const,
    spring: {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    },
  },
} as const;
