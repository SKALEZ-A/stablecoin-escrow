import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Breakpoint definitions
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

export type Breakpoint = keyof typeof breakpoints

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

interface ResponsiveContextType {
  breakpoint: Breakpoint
  deviceType: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  touchDevice: boolean
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined)

interface ResponsiveProviderProps {
  children: React.ReactNode
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  const [touchDevice, setTouchDevice] = useState(false)

  // Detect touch device
  useEffect(() => {
    setTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate current breakpoint
  const getCurrentBreakpoint = (width: number): Breakpoint => {
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  }

  // Calculate device type
  const getDeviceType = (width: number): DeviceType => {
    if (width < breakpoints.md) return 'mobile'
    if (width < breakpoints.lg) return 'tablet'
    return 'desktop'
  }

  const breakpoint = getCurrentBreakpoint(dimensions.width)
  const deviceType = getDeviceType(dimensions.width)
  const orientation = dimensions.width > dimensions.height ? 'landscape' : 'portrait'

  const contextValue: ResponsiveContextType = {
    breakpoint,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    width: dimensions.width,
    height: dimensions.height,
    orientation,
    touchDevice
  }

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  )
}

// Hook to use responsive context
export const useResponsive = () => {
  const context = useContext(ResponsiveContext)
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveProvider')
  }
  return context
}

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode
  maxWidth?: Breakpoint | 'full'
  padding?: boolean
  className?: string
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = true,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive()

  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const paddingClass = padding ? (isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8') : ''

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClass} ${className}`}>
      {children}
    </div>
  )
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number
  className?: string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = ''
}) => {
  const { breakpoint } = useResponsive()

  // Get current column count based on breakpoint
  const getCurrentCols = () => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    
    for (const bp of breakpointOrder) {
      if (breakpoints[breakpoint] >= breakpoints[bp] && cols[bp]) {
        return cols[bp]
      }
    }
    return cols.xs || 1
  }

  const currentCols = getCurrentCols()
  const gridColsClass = `grid-cols-${currentCols}`
  const gapClass = `gap-${gap}`

  return (
    <div className={`grid ${gridColsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  )
}

// Responsive stack component
interface ResponsiveStackProps {
  children: React.ReactNode
  direction?: {
    xs?: 'row' | 'col'
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
    xl?: 'row' | 'col'
    '2xl'?: 'row' | 'col'
  }
  spacing?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  className?: string
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { xs: 'col', md: 'row' },
  spacing = 4,
  align = 'start',
  justify = 'start',
  className = ''
}) => {
  const { breakpoint } = useResponsive()

  // Get current direction based on breakpoint
  const getCurrentDirection = () => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    
    for (const bp of breakpointOrder) {
      if (breakpoints[breakpoint] >= breakpoints[bp] && direction[bp]) {
        return direction[bp]
      }
    }
    return direction.xs || 'col'
  }

  const currentDirection = getCurrentDirection()
  const flexDirection = currentDirection === 'row' ? 'flex-row' : 'flex-col'
  const spacingClass = currentDirection === 'row' ? `space-x-${spacing}` : `space-y-${spacing}`
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  return (
    <div className={`flex ${flexDirection} ${spacingClass} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}>
      {children}
    </div>
  )
}

// Responsive show/hide component
interface ResponsiveShowProps {
  children: React.ReactNode
  on?: Breakpoint[]
  above?: Breakpoint
  below?: Breakpoint
  only?: Breakpoint
}

export const ResponsiveShow: React.FC<ResponsiveShowProps> = ({
  children,
  on,
  above,
  below,
  only
}) => {
  const { breakpoint, width } = useResponsive()

  const shouldShow = () => {
    if (only) {
      return breakpoint === only
    }

    if (on) {
      return on.includes(breakpoint)
    }

    if (above && below) {
      return width >= breakpoints[above] && width < breakpoints[below]
    }

    if (above) {
      return width >= breakpoints[above]
    }

    if (below) {
      return width < breakpoints[below]
    }

    return true
  }

  if (!shouldShow()) {
    return null
  }

  return <>{children}</>
}

// Responsive text sizing
interface ResponsiveTextProps {
  children: React.ReactNode
  size?: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }
  className?: string
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl' },
  className = ''
}) => {
  const { breakpoint } = useResponsive()

  // Get current text size based on breakpoint
  const getCurrentSize = () => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    
    for (const bp of breakpointOrder) {
      if (breakpoints[breakpoint] >= breakpoints[bp] && size[bp]) {
        return size[bp]
      }
    }
    return size.xs || 'text-base'
  }

  const currentSize = getCurrentSize()

  return (
    <span className={`${currentSize} ${className}`}>
      {children}
    </span>
  )
}

// Touch-friendly component wrapper
interface TouchFriendlyProps {
  children: React.ReactNode
  minTouchTarget?: number
  className?: string
}

export const TouchFriendly: React.FC<TouchFriendlyProps> = ({
  children,
  minTouchTarget = 44, // 44px is the recommended minimum touch target size
  className = ''
}) => {
  const { touchDevice } = useResponsive()

  const touchStyles = touchDevice ? {
    minHeight: `${minTouchTarget}px`,
    minWidth: `${minTouchTarget}px`
  } : {}

  return (
    <div 
      className={`${touchDevice ? 'touch-manipulation' : ''} ${className}`}
      style={touchStyles}
    >
      {children}
    </div>
  )
}

// Responsive form layout
interface ResponsiveFormLayoutProps {
  children: React.ReactNode
  variant?: 'single-column' | 'two-column' | 'adaptive'
  className?: string
}

export const ResponsiveFormLayout: React.FC<ResponsiveFormLayoutProps> = ({
  children,
  variant = 'adaptive',
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive()

  const getLayoutClass = () => {
    switch (variant) {
      case 'single-column':
        return 'grid grid-cols-1 gap-6'
      case 'two-column':
        return isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-6'
      case 'adaptive':
        return isMobile 
          ? 'grid grid-cols-1 gap-4' 
          : isTablet 
            ? 'grid grid-cols-1 gap-5' 
            : 'grid grid-cols-2 gap-6'
      default:
        return 'grid grid-cols-1 gap-6'
    }
  }

  return (
    <div className={`${getLayoutClass()} ${className}`}>
      {children}
    </div>
  )
}

// Responsive modal/dialog
interface ResponsiveModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  isOpen,
  onClose,
  size = 'md',
  className = ''
}) => {
  const { isMobile, width, height } = useResponsive()

  if (!isOpen) return null

  const sizeClasses = {
    sm: isMobile ? 'w-full h-full' : 'max-w-sm',
    md: isMobile ? 'w-full h-full' : 'max-w-md',
    lg: isMobile ? 'w-full h-full' : 'max-w-lg',
    xl: isMobile ? 'w-full h-full' : 'max-w-xl',
    full: 'w-full h-full'
  }

  const modalClass = isMobile 
    ? 'fixed inset-0 z-50 bg-white overflow-auto'
    : 'fixed inset-0 z-50 flex items-center justify-center p-4'

  const contentClass = isMobile
    ? 'w-full h-full'
    : `bg-white rounded-lg shadow-xl ${sizeClasses[size]} max-h-[90vh] overflow-auto`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={modalClass}
      onClick={isMobile ? undefined : onClose}
    >
      {!isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50" />
      )}
      
      <motion.div
        initial={isMobile ? { y: height } : { scale: 0.9, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: height } : { scale: 0.9, opacity: 0 }}
        className={`${contentClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// Utility hooks
export const useBreakpoint = (breakpoint: Breakpoint) => {
  const { width } = useResponsive()
  return width >= breakpoints[breakpoint]
}

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Responsive utilities
export const responsiveUtils = {
  // Get responsive class based on breakpoint
  getResponsiveClass: (
    classes: Partial<Record<Breakpoint, string>>,
    currentBreakpoint: Breakpoint
  ) => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    
    for (const bp of breakpointOrder) {
      if (breakpoints[currentBreakpoint] >= breakpoints[bp] && classes[bp]) {
        return classes[bp]
      }
    }
    return classes.xs || ''
  },

  // Check if current breakpoint is above given breakpoint
  isAbove: (current: Breakpoint, target: Breakpoint) => {
    return breakpoints[current] >= breakpoints[target]
  },

  // Check if current breakpoint is below given breakpoint
  isBelow: (current: Breakpoint, target: Breakpoint) => {
    return breakpoints[current] < breakpoints[target]
  },

  // Get optimal column count for grid based on screen size
  getOptimalColumns: (width: number, minColumnWidth: number = 300) => {
    return Math.max(1, Math.floor(width / minColumnWidth))
  }
}

export default {
  ResponsiveProvider,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveShow,
  ResponsiveText,
  TouchFriendly,
  ResponsiveFormLayout,
  ResponsiveModal,
  useResponsive,
  useBreakpoint,
  useMediaQuery,
  responsiveUtils,
  breakpoints
}