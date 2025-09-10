/**
 * Performance optimization utilities for the enhanced form system
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'

// Debounce utility for performance optimization
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

// Throttle utility for performance optimization
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0)
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now
      callback(...args)
    }
  }, [callback, delay]) as T
}

// Memoized validation to prevent unnecessary re-computations
export const useMemoizedValidation = (
  validationFn: (data: any) => any,
  dependencies: any[]
) => {
  return useMemo(() => validationFn, dependencies)
}

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback()
        observer.disconnect()
      }
    }, options)
    
    observer.observe(target)
    
    return () => observer.disconnect()
  }, [callback, options])
  
  return targetRef
}

// Virtual scrolling for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, containerHeight, scrollTop])
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  return {
    ...visibleItems,
    handleScroll
  }
}

// Image optimization utilities
export const optimizeImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(optimizedFile)
        } else {
          resolve(file)
        }
      }, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Bundle size analysis utilities
export const getBundleInfo = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize
    }
  }
  
  return null
}

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        })
      }
    }
    
    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return memoryInfo
}

// Component render optimization
export const useRenderOptimization = () => {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef(Date.now())
  
  useEffect(() => {
    renderCountRef.current++
    lastRenderTimeRef.current = Date.now()
  })
  
  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current
  }
}

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalCSS = [
    '/styles/forms.css',
    '/styles/animations.css'
  ]
  
  criticalCSS.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = href
    document.head.appendChild(link)
  })
  
  // Preload critical fonts
  const criticalFonts = [
    '/fonts/inter-regular.woff2',
    '/fonts/inter-medium.woff2'
  ]
  
  criticalFonts.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = href
    document.head.appendChild(link)
  })
}

// Tree shaking helper
export const createTreeShakableExports = <T extends Record<string, any>>(exports: T): T => {
  // This function helps with tree shaking by ensuring each export is used individually
  return exports
}