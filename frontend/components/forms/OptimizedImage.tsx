import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ImageIcon, Loader } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  lazy?: boolean
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  onLoad?: () => void
  onError?: (error: Error) => void
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  lazy = true,
  quality = 80,
  format = 'webp',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(!lazy)
  const [error, setError] = useState<string | null>(null)
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, isInView])

  // Image optimization
  useEffect(() => {
    if (!isInView) return

    const optimizeImage = async () => {
      try {
        // For File objects (uploaded images), optimize them
        if (src.startsWith('blob:') || src.startsWith('data:')) {
          const optimized = await compressImage(src, quality, format)
          setOptimizedSrc(optimized)
        } else {
          // For URLs, use query parameters for optimization (if supported by CDN)
          const url = new URL(src, window.location.origin)
          if (width) url.searchParams.set('w', width.toString())
          if (height) url.searchParams.set('h', height.toString())
          url.searchParams.set('q', quality.toString())
          url.searchParams.set('f', format)
          setOptimizedSrc(url.toString())
        }
      } catch (err) {
        console.warn('Image optimization failed, using original:', err)
        setOptimizedSrc(src)
      }
    }

    optimizeImage()
  }, [src, isInView, width, height, quality, format])

  const compressImage = (imageSrc: string, quality: number, format: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Calculate dimensions
        let { width: imgWidth, height: imgHeight } = img
        
        if (width || height) {
          const aspectRatio = imgWidth / imgHeight
          
          if (width && height) {
            imgWidth = width
            imgHeight = height
          } else if (width) {
            imgWidth = width
            imgHeight = width / aspectRatio
          } else if (height) {
            imgHeight = height
            imgWidth = height * aspectRatio
          }
        }
        
        canvas.width = imgWidth
        canvas.height = imgHeight
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight)
        
        const mimeType = format === 'webp' ? 'image/webp' : 
                        format === 'png' ? 'image/png' : 'image/jpeg'
        
        const compressedDataUrl = canvas.toDataURL(mimeType, quality / 100)
        resolve(compressedDataUrl)
      }
      
      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = imageSrc
    })
  }

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    const errorMsg = 'Failed to load image'
    setError(errorMsg)
    onError?.(new Error(errorMsg))
  }

  const aspectRatio = width && height ? (height / width) * 100 : undefined

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined
      }}
    >
      {/* Placeholder */}
      {(!isInView || !isLoaded) && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              {!isInView ? (
                <ImageIcon className="w-8 h-8 mb-2" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader className="w-8 h-8 mb-2" />
                </motion.div>
              )}
              <span className="text-sm">
                {!isInView ? 'Image' : 'Loading...'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center text-red-600">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">Failed to load</span>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Loading overlay */}
      {isInView && !isLoaded && !error && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader className="w-6 h-6 text-blue-600" />
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Higher-order component for automatic optimization
export const withImageOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    return <Component {...props} ref={ref} />
  })
}

// Preload utility for critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Batch preload utility
export const preloadImages = async (sources: string[]): Promise<void> => {
  const promises = sources.map(preloadImage)
  await Promise.all(promises)
}

export default OptimizedImage