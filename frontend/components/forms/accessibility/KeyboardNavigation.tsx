import React, { useEffect, useRef, useCallback } from 'react'
import { useAccessibility } from './AccessibilityProvider'

interface KeyboardNavigationProps {
  children: React.ReactNode
  trapFocus?: boolean
  autoFocus?: boolean
  restoreFocus?: boolean
  onEscape?: () => void
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  trapFocus = false,
  autoFocus = false,
  restoreFocus = false,
  onEscape
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const { settings, announce } = useAccessibility()

  // Get focusable elements
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }, [])

  // Focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!settings.keyboardNavigation) return

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          e.preventDefault()
          onEscape()
        }
        break

      case 'Tab':
        if (trapFocus && focusableElements.length > 0) {
          if (e.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
              e.preventDefault()
              lastElement?.focus()
            }
          } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
              e.preventDefault()
              firstElement?.focus()
            }
          }
        }
        break

      case 'ArrowDown':
      case 'ArrowUp':
        // Arrow key navigation for form elements
        if (e.target instanceof HTMLElement && 
            (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) {
          e.preventDefault()
          
          const currentIndex = focusableElements.indexOf(e.target)
          let nextIndex: number

          if (e.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % focusableElements.length
          } else {
            nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
          }

          focusableElements[nextIndex]?.focus()
          announce(`Focused on ${focusableElements[nextIndex]?.getAttribute('aria-label') || 'element'}`)
        }
        break

      case 'Home':
        if (e.ctrlKey && focusableElements.length > 0) {
          e.preventDefault()
          firstElement?.focus()
          announce('Focused on first element')
        }
        break

      case 'End':
        if (e.ctrlKey && focusableElements.length > 0) {
          e.preventDefault()
          lastElement?.focus()
          announce('Focused on last element')
        }
        break
    }
  }, [settings.keyboardNavigation, trapFocus, onEscape, getFocusableElements, announce])

  // Set up keyboard event listeners
  useEffect(() => {
    if (!settings.keyboardNavigation) return

    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, settings.keyboardNavigation])

  // Auto focus and focus restoration
  useEffect(() => {
    if (!settings.keyboardNavigation) return

    const container = containerRef.current
    if (!container) return

    // Store previous focus
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }

    // Auto focus first element
    if (autoFocus) {
      const focusableElements = getFocusableElements()
      const firstElement = focusableElements[0]
      if (firstElement) {
        setTimeout(() => firstElement.focus(), 0)
      }
    }

    return () => {
      // Restore focus when component unmounts
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [autoFocus, restoreFocus, settings.keyboardNavigation, getFocusableElements])

  return (
    <div
      ref={containerRef}
      className={`keyboard-navigation-container ${settings.focusVisible ? 'focus-visible' : ''}`}
    >
      {children}
    </div>
  )
}

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  const { settings } = useAccessibility()

  useEffect(() => {
    if (!settings.keyboardNavigation) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'ctrl',
        e.altKey && 'alt',
        e.shiftKey && 'shift',
        e.key.toLowerCase()
      ].filter(Boolean).join('+')

      const action = shortcuts[key]
      if (action) {
        e.preventDefault()
        action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, settings.keyboardNavigation])
}

// Focus management utilities
export const useFocusManagement = () => {
  const { announce } = useAccessibility()

  const focusFirst = useCallback((container?: HTMLElement) => {
    const root = container || document.body
    const firstFocusable = root.querySelector(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (firstFocusable) {
      firstFocusable.focus()
      announce(`Focused on ${firstFocusable.getAttribute('aria-label') || 'first element'}`)
    }
  }, [announce])

  const focusLast = useCallback((container?: HTMLElement) => {
    const root = container || document.body
    const focusableElements = Array.from(root.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[]
    
    const lastFocusable = focusableElements[focusableElements.length - 1]
    if (lastFocusable) {
      lastFocusable.focus()
      announce(`Focused on ${lastFocusable.getAttribute('aria-label') || 'last element'}`)
    }
  }, [announce])

  const focusById = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.focus()
      announce(`Focused on ${element.getAttribute('aria-label') || element.textContent || 'element'}`)
    }
  }, [announce])

  return {
    focusFirst,
    focusLast,
    focusById
  }
}

export default KeyboardNavigation