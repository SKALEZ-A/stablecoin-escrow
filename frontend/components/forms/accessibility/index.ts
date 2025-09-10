/**
 * Accessibility utilities and components for the enhanced form system
 * 
 * This module provides comprehensive accessibility support including:
 * - ARIA utilities and components
 * - Keyboard navigation management
 * - Screen reader support
 * - Accessibility testing tools
 * - High contrast and reduced motion support
 */

// Core accessibility provider
export { AccessibilityProvider, useAccessibility } from './AccessibilityProvider'

// Keyboard navigation
export { 
  default as KeyboardNavigation,
  useKeyboardShortcuts,
  useFocusManagement
} from './KeyboardNavigation'

// ARIA utilities and components
export {
  LiveRegion,
  AriaFormField,
  AriaProgress,
  AriaModal,
  AriaTooltip,
  AriaBreadcrumb,
  ScreenReaderOnly,
  useAnnouncement,
  getAriaAttributes
} from './AriaUtils'

// Accessibility testing
export {
  default as AccessibilityTesting,
  useAccessibilityTesting
} from './AccessibilityTesting'

// Re-export default components
export { default as AriaUtils } from './AriaUtils'

// Accessibility constants and helpers
export const ACCESSIBILITY_CONSTANTS = {
  // WCAG compliance levels
  WCAG_LEVELS: {
    A: 'A',
    AA: 'AA',
    AAA: 'AAA'
  },
  
  // Minimum contrast ratios
  CONTRAST_RATIOS: {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3,
    NON_TEXT: 3
  },
  
  // Minimum touch target sizes (in pixels)
  TOUCH_TARGETS: {
    MINIMUM: 44,
    RECOMMENDED: 48
  },
  
  // Keyboard keys
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown'
  },
  
  // ARIA roles
  ROLES: {
    BUTTON: 'button',
    DIALOG: 'dialog',
    ALERT: 'alert',
    ALERTDIALOG: 'alertdialog',
    APPLICATION: 'application',
    BANNER: 'banner',
    COMPLEMENTARY: 'complementary',
    CONTENTINFO: 'contentinfo',
    FORM: 'form',
    MAIN: 'main',
    NAVIGATION: 'navigation',
    REGION: 'region',
    SEARCH: 'search',
    TABLIST: 'tablist',
    TAB: 'tab',
    TABPANEL: 'tabpanel',
    PROGRESSBAR: 'progressbar',
    SLIDER: 'slider',
    SPINBUTTON: 'spinbutton',
    TEXTBOX: 'textbox',
    COMBOBOX: 'combobox',
    LISTBOX: 'listbox',
    OPTION: 'option',
    MENU: 'menu',
    MENUBAR: 'menubar',
    MENUITEM: 'menuitem',
    TREE: 'tree',
    TREEITEM: 'treeitem',
    GRID: 'grid',
    GRIDCELL: 'gridcell',
    ROW: 'row',
    ROWGROUP: 'rowgroup',
    COLUMNHEADER: 'columnheader',
    ROWHEADER: 'rowheader'
  }
}

// Accessibility helper functions
export const accessibilityHelpers = {
  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ]
    
    return focusableSelectors.some(selector => element.matches(selector))
  },
  
  // Get all focusable elements within a container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')
    
    return Array.from(container.querySelectorAll(focusableSelectors))
  },
  
  // Generate unique ID for accessibility
  generateId: (prefix = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  
  // Check if user prefers high contrast
  prefersHighContrast: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches
  },
  
  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  },
  
  // Focus element with smooth scrolling
  focusElement: (element: HTMLElement, smooth = true): void => {
    element.focus()
    if (smooth) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },
  
  // Trap focus within container
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = accessibilityHelpers.getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }
    
    container.addEventListener('keydown', handleKeyDown)
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }
}

// Accessibility validation rules
export const accessibilityRules = {
  // WCAG 1.1.1 - Non-text Content
  checkAltText: (element: HTMLImageElement): boolean => {
    return !!(element.alt || element.getAttribute('aria-label') || element.getAttribute('role') === 'presentation')
  },
  
  // WCAG 1.3.1 - Info and Relationships
  checkFormLabels: (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
    const hasLabel = !!(
      document.querySelector(`label[for="${element.id}"]`) ||
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby')
    )
    return hasLabel
  },
  
  // WCAG 2.4.7 - Focus Visible
  checkFocusVisible: (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element, ':focus')
    return style.outline !== 'none' && style.outline !== '0px'
  },
  
  // WCAG 4.1.2 - Name, Role, Value
  checkAccessibleName: (element: HTMLElement): boolean => {
    return !!(
      element.textContent?.trim() ||
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title')
    )
  }
}

export default {
  AccessibilityProvider,
  KeyboardNavigation,
  AriaUtils,
  AccessibilityTesting,
  ACCESSIBILITY_CONSTANTS,
  accessibilityHelpers,
  accessibilityRules
}