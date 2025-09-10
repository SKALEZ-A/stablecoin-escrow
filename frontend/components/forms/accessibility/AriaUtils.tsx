import React, { useId, useEffect, useRef } from 'react'
import { useAccessibility } from './AccessibilityProvider'

// ARIA live region component
interface LiveRegionProps {
  children: React.ReactNode
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all'
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Form field with comprehensive ARIA support
interface AriaFormFieldProps {
  label: string
  children: React.ReactElement
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export const AriaFormField: React.FC<AriaFormFieldProps> = ({
  label,
  children,
  description,
  error,
  required = false,
  disabled = false
}) => {
  const fieldId = useId()
  const descriptionId = useId()
  const errorId = useId()

  // Clone child element with ARIA attributes
  const childWithAria = React.cloneElement(children, {
    id: fieldId,
    'aria-labelledby': `${fieldId}-label`,
    'aria-describedby': [
      description && `${descriptionId}`,
      error && `${errorId}`
    ].filter(Boolean).join(' ') || undefined,
    'aria-required': required,
    'aria-invalid': !!error,
    disabled
  })

  return (
    <div className="form-field">
      <label
        id={`${fieldId}-label`}
        htmlFor={fieldId}
        className={`form-label ${required ? 'required' : ''}`}
      >
        {label}
        {required && (
          <span aria-label="required" className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>
      
      {description && (
        <div
          id={descriptionId}
          className="form-description text-sm text-gray-600 mt-1"
        >
          {description}
        </div>
      )}
      
      {childWithAria}
      
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="form-error text-sm text-red-600 mt-1"
        >
          {error}
        </div>
      )}
    </div>
  )
}

// Progress indicator with ARIA support
interface AriaProgressProps {
  value: number
  max: number
  label?: string
  description?: string
}

export const AriaProgress: React.FC<AriaProgressProps> = ({
  value,
  max,
  label,
  description
}) => {
  const progressId = useId()
  const percentage = Math.round((value / max) * 100)

  return (
    <div className="progress-container">
      {label && (
        <label htmlFor={progressId} className="progress-label">
          {label}
        </label>
      )}
      
      <div
        id={progressId}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={`${percentage}% complete`}
        aria-describedby={description ? `${progressId}-desc` : undefined}
        className="progress-bar"
      >
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {description && (
        <div id={`${progressId}-desc`} className="progress-description">
          {description}
        </div>
      )}
      
      <div className="sr-only" aria-live="polite">
        Progress: {percentage}% complete
      </div>
    </div>
  )
}

// Modal with ARIA support
interface AriaModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}

export const AriaModal: React.FC<AriaModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children
}) => {
  const modalId = useId()
  const titleId = useId()
  const descId = useId()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus trap and initial focus
      const modal = modalRef.current
      if (modal) {
        const firstFocusable = modal.querySelector(
          'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        firstFocusable?.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <div
        ref={modalRef}
        id={modalId}
        className="modal-content"
      >
        <header className="modal-header">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close"
          >
            ×
          </button>
        </header>
        
        {description && (
          <div id={descId} className="modal-description">
            {description}
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Tooltip with ARIA support
interface AriaTooltipProps {
  content: string
  children: React.ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export const AriaTooltip: React.FC<AriaTooltipProps> = ({
  content,
  children,
  placement = 'top'
}) => {
  const tooltipId = useId()
  const [isVisible, setIsVisible] = React.useState(false)

  const childWithAria = React.cloneElement(children, {
    'aria-describedby': isVisible ? tooltipId : undefined,
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => setIsVisible(false),
    onFocus: () => setIsVisible(true),
    onBlur: () => setIsVisible(false)
  })

  return (
    <div className="tooltip-container">
      {childWithAria}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`tooltip tooltip-${placement}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Breadcrumb navigation with ARIA
interface AriaBreadcrumbProps {
  items: Array<{
    label: string
    href?: string
    current?: boolean
  }>
}

export const AriaBreadcrumb: React.FC<AriaBreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {item.current ? (
              <span aria-current="page" className="breadcrumb-current">
                {item.label}
              </span>
            ) : item.href ? (
              <a href={item.href} className="breadcrumb-link">
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
            {index < items.length - 1 && (
              <span aria-hidden="true" className="breadcrumb-separator">
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Screen reader only text
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="sr-only">{children}</span>
}

// Announcement hook for screen readers
export const useAnnouncement = () => {
  const { announce } = useAccessibility()

  const announceFormError = (fieldName: string, error: string) => {
    announce(`Error in ${fieldName}: ${error}`, 'assertive')
  }

  const announceFormSuccess = (message: string) => {
    announce(message, 'polite')
  }

  const announceStepChange = (currentStep: number, totalSteps: number, stepName?: string) => {
    const message = stepName 
      ? `Step ${currentStep} of ${totalSteps}: ${stepName}`
      : `Step ${currentStep} of ${totalSteps}`
    announce(message, 'polite')
  }

  const announceValidation = (isValid: boolean, fieldName: string) => {
    const message = isValid 
      ? `${fieldName} is valid`
      : `${fieldName} has errors`
    announce(message, 'polite')
  }

  return {
    announceFormError,
    announceFormSuccess,
    announceStepChange,
    announceValidation,
    announce
  }
}

// ARIA attributes helper
export const getAriaAttributes = (props: {
  label?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  expanded?: boolean
  selected?: boolean
  checked?: boolean
}) => {
  const attributes: Record<string, any> = {}

  if (props.label) attributes['aria-label'] = props.label
  if (props.description) attributes['aria-describedby'] = props.description
  if (props.error) attributes['aria-invalid'] = true
  if (props.required) attributes['aria-required'] = true
  if (props.disabled) attributes['aria-disabled'] = true
  if (props.expanded !== undefined) attributes['aria-expanded'] = props.expanded
  if (props.selected !== undefined) attributes['aria-selected'] = props.selected
  if (props.checked !== undefined) attributes['aria-checked'] = props.checked

  return attributes
}

export default {
  LiveRegion,
  AriaFormField,
  AriaProgress,
  AriaModal,
  AriaTooltip,
  AriaBreadcrumb,
  ScreenReaderOnly,
  useAnnouncement,
  getAriaAttributes
}