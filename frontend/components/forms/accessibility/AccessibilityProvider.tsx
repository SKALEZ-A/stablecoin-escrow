import React, { createContext, useContext, useState, useEffect } from 'react'

interface AccessibilitySettings {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusVisible: boolean
  announcements: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  focusElement: (selector: string) => void
  skipToContent: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: true,
    focusVisible: true,
    announcements: true
  })

  // Detect user preferences
  useEffect(() => {
    const detectPreferences = () => {
      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      // Detect screen reader
      const hasScreenReader = window.navigator.userAgent.includes('NVDA') ||
                             window.navigator.userAgent.includes('JAWS') ||
                             window.speechSynthesis?.getVoices().length > 0

      setSettings(prev => ({
        ...prev,
        reduceMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
        screenReader: hasScreenReader
      }))
    }

    detectPreferences()

    // Listen for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)')
    ]

    const handleChange = () => detectPreferences()
    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange))

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange))
    }
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement

    // Apply CSS custom properties for accessibility
    root.style.setProperty('--motion-duration', settings.reduceMotion ? '0ms' : '300ms')
    root.style.setProperty('--motion-easing', settings.reduceMotion ? 'linear' : 'ease-out')
    
    // Apply classes for styling
    root.classList.toggle('reduce-motion', settings.reduceMotion)
    root.classList.toggle('high-contrast', settings.highContrast)
    root.classList.toggle('large-text', settings.largeText)
    root.classList.toggle('keyboard-navigation', settings.keyboardNavigation)
    root.classList.toggle('focus-visible', settings.focusVisible)

    // Set font size for large text
    if (settings.largeText) {
      root.style.fontSize = '1.2em'
    } else {
      root.style.fontSize = ''
    }
  }, [settings])

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Screen reader announcements
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements) return

    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Focus management
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Skip to main content
  const skipToContent = () => {
    const mainContent = document.querySelector('main, [role="main"], #main-content') as HTMLElement
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    announce,
    focusElement,
    skipToContent
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
        onClick={(e) => {
          e.preventDefault()
          skipToContent()
        }}
      >
        Skip to main content
      </a>
      
      {children}
      
      {/* Live region for announcements */}
      <div
        id="accessibility-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  )
}

export default AccessibilityProvider