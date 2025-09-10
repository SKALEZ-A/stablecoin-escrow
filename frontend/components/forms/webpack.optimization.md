# Webpack Optimization Guide for Enhanced Form System

This guide provides webpack configuration optimizations specifically for the enhanced form system to improve bundle size and loading performance.

## Bundle Splitting Configuration

```javascript
// next.config.js or webpack.config.js
module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize chunks for form system
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          // Separate chunk for form components
          forms: {
            name: 'forms',
            test: /[\\/]components[\\/]forms[\\/]/,
            chunks: 'all',
            priority: 10,
            minSize: 20000,
            maxSize: 100000
          },
          // Separate chunk for framer-motion (heavy animation library)
          animations: {
            name: 'animations',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            chunks: 'all',
            priority: 15,
            minSize: 30000
          },
          // Separate chunk for form validation libraries
          validation: {
            name: 'validation',
            test: /[\\/]node_modules[\\/](zod|yup|joi)[\\/]/,
            chunks: 'all',
            priority: 12
          },
          // Separate chunk for wagmi and web3 libraries
          web3: {
            name: 'web3',
            test: /[\\/]node_modules[\\/](wagmi|viem|@wagmi)[\\/]/,
            chunks: 'all',
            priority: 14
          }
        }
      }
    }

    // Tree shaking optimization
    config.optimization.usedExports = true
    config.optimization.sideEffects = false

    return config
  }
}
```

## Dynamic Imports for Code Splitting

```typescript
// Lazy load heavy form components
const ListItemWizard = lazy(() => 
  import('./components/forms/ListItemWizard').then(module => ({
    default: module.default
  }))
)

// Preload on route change or user interaction
const preloadFormComponents = () => {
  import('./components/forms/ListItemWizard')
  import('./components/forms/PurchaseCheckout')
}

// Use with React Router or Next.js
useEffect(() => {
  router.prefetch('/list-item') // Next.js
  preloadFormComponents()
}, [])
```

## Bundle Analysis

```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Run analysis
ANALYZE=true npm run build
```

## Performance Budgets

```javascript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 250000, // 250kb
    maxEntrypointSize: 250000,
    hints: 'warning',
    assetFilter: function(assetFilename) {
      // Only check JS files
      return assetFilename.endsWith('.js')
    }
  }
}
```

## Tree Shaking Optimization

```typescript
// forms/index.ts - Optimized exports
export { FormStep } from './FormStep'
export { ProgressIndicator } from './ProgressIndicator'

// Avoid default exports for better tree shaking
export const ListItemWizard = lazy(() => import('./ListItemWizard'))
export const PurchaseCheckout = lazy(() => import('./PurchaseCheckout'))

// Use named exports in consuming code
import { FormStep, ProgressIndicator } from './components/forms'
```

## Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
}
```

## CSS Optimization

```javascript
// Extract CSS into separate chunks
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[name].[contenthash].css',
    })
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  }
}
```

## Runtime Optimization

```typescript
// Preload critical resources
const preloadCriticalResources = () => {
  // Preload critical CSS
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'style'
  link.href = '/css/forms.css'
  document.head.appendChild(link)

  // Preload critical fonts
  const fontLink = document.createElement('link')
  fontLink.rel = 'preload'
  fontLink.as = 'font'
  fontLink.type = 'font/woff2'
  fontLink.crossOrigin = 'anonymous'
  fontLink.href = '/fonts/inter.woff2'
  document.head.appendChild(fontLink)
}

// Call on app initialization
useEffect(() => {
  preloadCriticalResources()
}, [])
```

## Monitoring and Metrics

```typescript
// Performance monitoring
const measureFormPerformance = () => {
  // Measure component render time
  performance.mark('form-render-start')
  
  // After component renders
  performance.mark('form-render-end')
  performance.measure('form-render-time', 'form-render-start', 'form-render-end')
  
  // Get measurements
  const measures = performance.getEntriesByType('measure')
  console.log('Form render time:', measures[0].duration)
}

// Bundle size monitoring
const getBundleSize = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    console.log('Effective connection type:', connection.effectiveType)
    console.log('Downlink speed:', connection.downlink)
  }
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  console.log('Transfer size:', navigation.transferSize)
  console.log('Encoded body size:', navigation.encodedBodySize)
}
```

## Recommended Bundle Sizes

- **Critical path**: < 50KB (gzipped)
- **Form components**: < 100KB per chunk
- **Animation libraries**: < 80KB
- **Validation libraries**: < 30KB
- **Total initial bundle**: < 200KB

## Performance Checklist

- [ ] Implement code splitting for heavy components
- [ ] Use lazy loading for non-critical components
- [ ] Optimize images with WebP/AVIF formats
- [ ] Minimize CSS and extract to separate files
- [ ] Enable gzip/brotli compression
- [ ] Implement service worker for caching
- [ ] Use performance budgets in CI/CD
- [ ] Monitor bundle size in production
- [ ] Preload critical resources
- [ ] Use tree shaking for unused code elimination