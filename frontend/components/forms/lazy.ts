/**
 * Lazy-loaded form components for code splitting and performance optimization
 * 
 * This module provides lazy-loaded versions of heavy form components
 * to reduce initial bundle size and improve loading performance.
 */

import { lazy } from 'react'

// Lazy load heavy form components
export const LazyListItemWizard = lazy(() => 
  import('./ListItemWizard').then(module => ({ default: module.default }))
)

export const LazyPurchaseCheckout = lazy(() => 
  import('./PurchaseCheckout').then(module => ({ default: module.default }))
)

// Lazy load demo components (not needed for production)
export const LazyListItemWizardDemo = lazy(() => 
  import('./ListItemWizardDemo').then(module => ({ default: module.default }))
)

export const LazyFormValidationDemo = lazy(() => 
  import('./FormValidationDemo').then(module => ({ default: module.default }))
)

export const LazyFormFieldsDemo = lazy(() => 
  import('./FormFieldsDemo').then(module => ({ default: module.default }))
)

export const LazyFormWizardDemo = lazy(() => 
  import('./FormWizardDemo').then(module => ({ default: module.default }))
)

export const LazyFormStepDemo = lazy(() => 
  import('./FormStepDemo').then(module => ({ default: module.default }))
)

// Lazy load heavy field components
export const LazyImageUpload = lazy(() => 
  import('./fields/ImageUpload').then(module => ({ default: module.default }))
)

export const LazyTagsInput = lazy(() => 
  import('./fields/TagsInput').then(module => ({ default: module.default }))
)

// Lazy load animation provider (heavy due to framer-motion)
export const LazyAnimationProvider = lazy(() => 
  import('./AnimationProvider').then(module => ({ default: module.default }))
)

// Lazy load success screens
export const LazyListingSuccessScreen = lazy(() => 
  import('./SuccessScreens').then(module => ({ ListingSuccessScreen: module.ListingSuccessScreen }))
    .then(module => ({ default: module.ListingSuccessScreen }))
)

export const LazyPurchaseSuccessScreen = lazy(() => 
  import('./SuccessScreens').then(module => ({ PurchaseSuccessScreen: module.PurchaseSuccessScreen }))
    .then(module => ({ default: module.PurchaseSuccessScreen }))
)

// Preload functions for better UX
export const preloadFormComponents = () => {
  // Preload commonly used components
  import('./ListItemWizard')
  import('./PurchaseCheckout')
  import('./fields/ImageUpload')
  import('./fields/TagsInput')
}

export const preloadDemoComponents = () => {
  // Preload demo components (development only)
  if (process.env.NODE_ENV === 'development') {
    import('./ListItemWizardDemo')
    import('./FormValidationDemo')
    import('./FormFieldsDemo')
    import('./FormWizardDemo')
    import('./FormStepDemo')
  }
}

// Utility to preload on user interaction
export const preloadOnHover = (componentName: string) => {
  return {
    onMouseEnter: () => {
      switch (componentName) {
        case 'ListItemWizard':
          import('./ListItemWizard')
          break
        case 'PurchaseCheckout':
          import('./PurchaseCheckout')
          break
        case 'ImageUpload':
          import('./fields/ImageUpload')
          break
        case 'TagsInput':
          import('./fields/TagsInput')
          break
        default:
          break
      }
    }
  }
}