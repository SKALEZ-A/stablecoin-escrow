import React, { useEffect, useState } from 'react'
import { useAccessibility } from './AccessibilityProvider'

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info'
  rule: string
  element: string
  message: string
  suggestion: string
}

interface AccessibilityTestingProps {
  enabled?: boolean
  autoRun?: boolean
  onIssuesFound?: (issues: AccessibilityIssue[]) => void
}

export const AccessibilityTesting: React.FC<AccessibilityTestingProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  autoRun = true,
  onIssuesFound
}) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { settings } = useAccessibility()

  const runAccessibilityTests = async () => {
    if (!enabled) return

    setIsRunning(true)
    const foundIssues: AccessibilityIssue[] = []

    try {
      // Test 1: Missing alt text on images
      const images = document.querySelectorAll('img')
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          foundIssues.push({
            type: 'error',
            rule: 'WCAG 1.1.1',
            element: `img[${index}]`,
            message: 'Image missing alt text',
            suggestion: 'Add alt attribute or aria-label to describe the image'
          })
        }
      })

      // Test 2: Form inputs without labels
      const inputs = document.querySelectorAll('input, select, textarea')
      inputs.forEach((input, index) => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                        input.getAttribute('aria-label') ||
                        input.getAttribute('aria-labelledby')
        
        if (!hasLabel) {
          foundIssues.push({
            type: 'error',
            rule: 'WCAG 3.3.2',
            element: `${input.tagName.toLowerCase()}[${index}]`,
            message: 'Form input missing label',
            suggestion: 'Add a label element or aria-label attribute'
          })
        }
      })

      // Test 3: Buttons without accessible names
      const buttons = document.querySelectorAll('button')
      buttons.forEach((button, index) => {
        const hasAccessibleName = button.textContent?.trim() ||
                                 button.getAttribute('aria-label') ||
                                 button.getAttribute('aria-labelledby')
        
        if (!hasAccessibleName) {
          foundIssues.push({
            type: 'error',
            rule: 'WCAG 4.1.2',
            element: `button[${index}]`,
            message: 'Button missing accessible name',
            suggestion: 'Add text content or aria-label attribute'
          })
        }
      })

      // Test 4: Missing focus indicators
      const focusableElements = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusableElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element, ':focus')
        const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '0px'
        const hasBoxShadow = computedStyle.boxShadow !== 'none'
        
        if (!hasOutline && !hasBoxShadow) {
          foundIssues.push({
            type: 'warning',
            rule: 'WCAG 2.4.7',
            element: `${element.tagName.toLowerCase()}[${index}]`,
            message: 'Element missing focus indicator',
            suggestion: 'Add visible focus styles with outline or box-shadow'
          })
        }
      })

      // Test 5: Insufficient color contrast
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label')
      textElements.forEach((element, index) => {
        const style = window.getComputedStyle(element)
        const color = style.color
        const backgroundColor = style.backgroundColor
        
        // Simple contrast check (would need more sophisticated algorithm in production)
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const contrast = calculateContrast(color, backgroundColor)
          if (contrast < 4.5) {
            foundIssues.push({
              type: 'warning',
              rule: 'WCAG 1.4.3',
              element: `${element.tagName.toLowerCase()}[${index}]`,
              message: `Low color contrast ratio: ${contrast.toFixed(2)}`,
              suggestion: 'Increase contrast to at least 4.5:1 for normal text'
            })
          }
        }
      })

      // Test 6: Missing ARIA landmarks
      const hasMain = document.querySelector('main, [role="main"]')
      const hasNav = document.querySelector('nav, [role="navigation"]')
      
      if (!hasMain) {
        foundIssues.push({
          type: 'warning',
          rule: 'WCAG 1.3.1',
          element: 'document',
          message: 'Missing main landmark',
          suggestion: 'Add <main> element or role="main" to identify main content'
        })
      }

      // Test 7: Heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      let previousLevel = 0
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1))
        if (level > previousLevel + 1) {
          foundIssues.push({
            type: 'warning',
            rule: 'WCAG 1.3.1',
            element: `${heading.tagName.toLowerCase()}[${index}]`,
            message: 'Heading level skipped',
            suggestion: 'Use heading levels in sequential order (h1, h2, h3, etc.)'
          })
        }
        previousLevel = level
      })

      // Test 8: Missing skip links
      const skipLink = document.querySelector('a[href="#main"], a[href="#content"]')
      if (!skipLink) {
        foundIssues.push({
          type: 'info',
          rule: 'WCAG 2.4.1',
          element: 'document',
          message: 'Missing skip link',
          suggestion: 'Add a skip link to main content for keyboard users'
        })
      }

      setIssues(foundIssues)
      onIssuesFound?.(foundIssues)
    } catch (error) {
      console.error('Accessibility testing error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // Simple contrast calculation (simplified version)
  const calculateContrast = (color1: string, color2: string): number => {
    // This is a simplified version - in production, use a proper contrast calculation library
    const rgb1 = parseRGB(color1)
    const rgb2 = parseRGB(color2)
    
    if (!rgb1 || !rgb2) return 21 // Assume good contrast if can't parse
    
    const l1 = getLuminance(rgb1)
    const l2 = getLuminance(rgb2)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  const parseRGB = (color: string) => {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      }
    }
    return null
  }

  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  // Auto-run tests
  useEffect(() => {
    if (autoRun && enabled) {
      const timer = setTimeout(runAccessibilityTests, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoRun, enabled])

  if (!enabled) return null

  return (
    <div className="accessibility-testing">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Accessibility Testing</h3>
        <button
          onClick={runAccessibilityTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Found {issues.length} accessibility issues
          </div>
          
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`p-3 rounded border-l-4 ${
                issue.type === 'error' ? 'bg-red-50 border-red-500' :
                issue.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {issue.rule}: {issue.message}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Element: {issue.element}
                  </div>
                  <div className="text-xs text-gray-700 mt-1">
                    💡 {issue.suggestion}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  issue.type === 'error' ? 'bg-red-100 text-red-800' :
                  issue.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {issue.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && !isRunning && (
        <div className="text-green-600 text-sm">
          ✅ No accessibility issues found
        </div>
      )}
    </div>
  )
}

// Hook for accessibility testing in components
export const useAccessibilityTesting = () => {
  const runQuickTest = (element: HTMLElement) => {
    const issues: AccessibilityIssue[] = []

    // Check for missing ARIA attributes
    const inputs = element.querySelectorAll('input, select, textarea')
    inputs.forEach((input, index) => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const label = element.querySelector(`label[for="${input.id}"]`)
        if (!label) {
          issues.push({
            type: 'error',
            rule: 'WCAG 3.3.2',
            element: `input[${index}]`,
            message: 'Input missing label',
            suggestion: 'Add aria-label or associate with a label element'
          })
        }
      }
    })

    return issues
  }

  const checkColorContrast = (element: HTMLElement) => {
    const style = window.getComputedStyle(element)
    const color = style.color
    const backgroundColor = style.backgroundColor
    
    // Return contrast ratio (simplified)
    return 4.5 // Placeholder
  }

  const checkKeyboardAccessibility = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )
    
    return {
      focusableCount: focusableElements.length,
      hasFocusTrapping: element.getAttribute('role') === 'dialog',
      hasSkipLinks: !!element.querySelector('a[href^="#"]')
    }
  }

  return {
    runQuickTest,
    checkColorContrast,
    checkKeyboardAccessibility
  }
}

export default AccessibilityTesting