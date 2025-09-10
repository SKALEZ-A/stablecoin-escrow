import { Variants, Transition } from 'framer-motion'

// Common animation variants
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: -20
  }
}

export const fadeInDown: Variants = {
  initial: {
    opacity: 0,
    y: -20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: 20
  }
}

export const fadeInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: 20
  }
}

export const fadeInRight: Variants = {
  initial: {
    opacity: 0,
    x: 20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: -20
  }
}

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    scale: 1
  },
  exit: {
    opacity: 0,
    scale: 0.9
  }
}

export const slideInFromBottom: Variants = {
  initial: {
    opacity: 0,
    y: 50
  },
  animate: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: 50
  }
}

// Form step animations
export const stepTransition: Variants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    x: -100,
    scale: 0.95
  }
}

export const stepTransitionReverse: Variants = {
  initial: {
    opacity: 0,
    x: -100,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.95
  }
}

// Form field animations
export const fieldFocus: Variants = {
  initial: {
    scale: 1,
    borderColor: 'rgb(209, 213, 219)' // gray-300
  },
  focus: {
    scale: 1.02,
    borderColor: 'rgb(59, 130, 246)', // blue-500
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  blur: {
    scale: 1,
    borderColor: 'rgb(209, 213, 219)',
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
}

export const fieldError: Variants = {
  initial: {
    x: 0
  },
  error: {
    x: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
}

export const fieldSuccess: Variants = {
  initial: {
    scale: 1
  },
  success: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  }
}

// Loading animations
export const loadingSpinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

export const loadingPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

export const loadingDots: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Progress animations
export const progressBar: Variants = {
  initial: {
    scaleX: 0,
    originX: 0
  },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  })
}

export const progressStep: Variants = {
  inactive: {
    scale: 1,
    backgroundColor: 'rgb(229, 231, 235)', // gray-200
    color: 'rgb(107, 114, 128)' // gray-500
  },
  active: {
    scale: 1.1,
    backgroundColor: 'rgb(59, 130, 246)', // blue-500
    color: 'rgb(255, 255, 255)', // white
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  completed: {
    scale: 1,
    backgroundColor: 'rgb(34, 197, 94)', // green-500
    color: 'rgb(255, 255, 255)', // white
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

// Button animations
export const buttonHover: Variants = {
  initial: {
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: 0.1,
      ease: 'easeOut'
    }
  }
}

export const buttonLoading: Variants = {
  initial: {
    opacity: 1
  },
  loading: {
    opacity: 0.7,
    transition: {
      duration: 0.2
    }
  }
}

// Modal/Dialog animations
export const modalOverlay: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

export const modalContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

// Toast/Notification animations
export const toastSlideIn: Variants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

// Stagger animations for lists
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

// Validation animations
export const validationSuccess: Variants = {
  initial: {
    scale: 1,
    borderColor: 'rgb(209, 213, 219)' // gray-300
  },
  success: {
    scale: [1, 1.02, 1],
    borderColor: 'rgb(34, 197, 94)', // green-500
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
}

export const validationError: Variants = {
  initial: {
    x: 0,
    borderColor: 'rgb(209, 213, 219)' // gray-300
  },
  error: {
    x: [-3, 3, -3, 3, 0],
    borderColor: 'rgb(239, 68, 68)', // red-500
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
}

// Common transition presets
export const transitions = {
  smooth: {
    duration: 0.3,
    ease: 'easeOut'
  } as Transition,
  
  quick: {
    duration: 0.15,
    ease: 'easeOut'
  } as Transition,
  
  slow: {
    duration: 0.6,
    ease: 'easeOut'
  } as Transition,
  
  bounce: {
    duration: 0.4,
    ease: [0.68, -0.55, 0.265, 1.55]
  } as Transition,
  
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30
  } as Transition,
  
  springBouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10
  } as Transition
}

// Animation utilities
export const createStaggerAnimation = (
  itemVariants: Variants,
  staggerDelay: number = 0.1,
  delayChildren: number = 0
) => ({
  container: {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren
      }
    }
  },
  item: itemVariants
})

export const createSlideAnimation = (
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 20
) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -distance, y: 0 }
      case 'right': return { x: distance, y: 0 }
      case 'up': return { x: 0, y: -distance }
      case 'down': return { x: 0, y: distance }
    }
  }

  const getExitPosition = () => {
    switch (direction) {
      case 'left': return { x: distance, y: 0 }
      case 'right': return { x: -distance, y: 0 }
      case 'up': return { x: 0, y: distance }
      case 'down': return { x: 0, y: -distance }
    }
  }

  return {
    initial: {
      opacity: 0,
      ...getInitialPosition()
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0
    },
    exit: {
      opacity: 0,
      ...getExitPosition()
    }
  }
}

export const createScaleAnimation = (
  initialScale: number = 0.9,
  animateScale: number = 1,
  exitScale: number = 0.9
) => ({
  initial: {
    opacity: 0,
    scale: initialScale
  },
  animate: {
    opacity: 1,
    scale: animateScale
  },
  exit: {
    opacity: 0,
    scale: exitScale
  }
})

// Form-specific animation presets
export const formAnimations = {
  // Step transitions
  stepForward: stepTransition,
  stepBackward: stepTransitionReverse,
  
  // Field interactions
  fieldFocus,
  fieldError,
  fieldSuccess,
  validationSuccess,
  validationError,
  
  // Loading states
  loadingSpinner,
  loadingPulse,
  loadingDots,
  
  // Progress indicators
  progressBar,
  progressStep,
  
  // Buttons
  buttonHover,
  buttonLoading,
  
  // General animations
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInFromBottom,
  
  // Stagger animations
  staggerContainer,
  staggerItem
}

// Export all animations as default
export default formAnimations