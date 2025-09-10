import React, { createContext, useContext, useState, useEffect } from 'react'
import { MotionConfig, Transition } from 'framer-motion'
import { transitions } from './animations'

interface AnimationSettings {
  enabled: boolean
  reducedMotion: boolean
  transitionDuration: number
  defaultTransition: Transition
}

interface AnimationContextType {
  settings: AnimationSettings
  updateSettings: (newSettings: Partial<AnimationSettings>) => void
  isAnimationEnabled: boolean
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

interface AnimationProviderProps {
  children: React.ReactNode
  defaultSettings?: Partial<AnimationSettings>
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children,
  defaultSettings = {}
}) => {
  const [settings, setSettings] = useState<AnimationSettings>({
    enabled: true,
    reducedMotion: false,
    transitionDuration: 0.3,
    defaultTransition: transitions.smooth,
    ...defaultSettings
  })

  // Check for user's motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: e.matches,
        enabled: !e.matches // Disable animations if user prefers reduced motion
      }))
    }

    // Set initial value
    setSettings(prev => ({
      ...prev,
      reducedMotion: mediaQuery.matches,
      enabled: !mediaQuery.matches
    }))

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const isAnimationEnabled = settings.enabled && !settings.reducedMotion

  // Create transition based on current settings
  const currentTransition: Transition = {
    ...settings.defaultTransition,
    duration: settings.transitionDuration
  }

  const contextValue: AnimationContextType = {
    settings,
    updateSettings,
    isAnimationEnabled
  }

  return (
    <AnimationContext.Provider value={contextValue}>
      <MotionConfig
        transition={isAnimationEnabled ? currentTransition : { duration: 0 }}
        reducedMotion={settings.reducedMotion ? 'always' : 'never'}
      >
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  )
}

// Hook to use animation context
export const useAnimation = () => {
  const context = useContext(AnimationContext)
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider')
  }
  return context
}

// Hook to get animation variants based on settings
export const useAnimationVariants = () => {
  const { isAnimationEnabled } = useAnimation()
  
  return {
    // Return empty variants if animations are disabled
    getVariants: (variants: any) => isAnimationEnabled ? variants : {},
    
    // Return appropriate transition
    getTransition: (transition?: Transition) => 
      isAnimationEnabled ? transition : { duration: 0 },
    
    // Check if animations should be applied
    shouldAnimate: isAnimationEnabled
  }
}

// Hook for conditional animation props
export const useConditionalAnimation = () => {
  const { isAnimationEnabled } = useAnimation()
  
  return {
    // Conditionally apply animation props
    animate: isAnimationEnabled,
    
    // Get motion props only if animations are enabled
    getMotionProps: (props: any) => isAnimationEnabled ? props : {},
    
    // Get duration based on animation settings
    getDuration: (duration: number) => isAnimationEnabled ? duration : 0
  }
}

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageFrameTime: 0,
    droppedFrames: 0,
    isPerformanceGood: true
  })

  useEffect(() => {
    let frameCount = 0
    let totalFrameTime = 0
    let lastFrameTime = performance.now()
    let animationId: number

    const measurePerformance = () => {
      const currentTime = performance.now()
      const frameTime = currentTime - lastFrameTime
      
      frameCount++
      totalFrameTime += frameTime
      
      // Update metrics every 60 frames (roughly 1 second at 60fps)
      if (frameCount >= 60) {
        const averageFrameTime = totalFrameTime / frameCount
        const droppedFrames = frameCount - Math.floor(1000 / averageFrameTime)
        const isPerformanceGood = averageFrameTime < 20 // Less than 20ms per frame
        
        setPerformanceMetrics({
          averageFrameTime,
          droppedFrames: Math.max(0, droppedFrames),
          isPerformanceGood
        })
        
        // Reset counters
        frameCount = 0
        totalFrameTime = 0
      }
      
      lastFrameTime = currentTime
      animationId = requestAnimationFrame(measurePerformance)
    }

    animationId = requestAnimationFrame(measurePerformance)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return performanceMetrics
}

// Animation debugging hook (development only)
export const useAnimationDebug = () => {
  const { settings, isAnimationEnabled } = useAnimation()
  const performance = useAnimationPerformance()
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Animation Settings:', settings)
      console.log('Animation Enabled:', isAnimationEnabled)
      console.log('Performance Metrics:', performance)
    }
  }, [settings, isAnimationEnabled, performance])

  return {
    settings,
    isAnimationEnabled,
    performance,
    logAnimation: (name: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Animation: ${name}`, data)
      }
    }
  }
}

export default AnimationProvider