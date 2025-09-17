# Tailwind CSS v4 Technical Guide

**Version**: 4.1.13  
**Project**: Ritemark  
**Updated**: September 2025  

## Overview

This document provides the definitive technical implementation guide for Tailwind CSS v4 in the Ritemark project. **All Tailwind-related code generation must reference this document.**

## Critical Architecture Changes in v4

Tailwind CSS v4 introduced breaking changes from v3. The architecture is fundamentally different:

### v3 vs v4 Comparison

| Aspect | Tailwind v3 | Tailwind v4 |
|--------|-------------|-------------|
| CSS Import | `@tailwind base;` `@tailwind components;` `@tailwind utilities;` | `@import "tailwindcss";` |
| PostCSS Plugin | `tailwindcss` | `@tailwindcss/postcss` |
| Vite Integration | PostCSS only | `@tailwindcss/vite` plugin |
| Config File | Required | Optional (zero-config) |
| Package Structure | Single package | Split packages |

## Required Dependencies

```json
{
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.13",
    "@tailwindcss/postcss": "^4.1.13",
    "tailwindcss": "^4.1.13"
  }
}
```

## Configuration Files

### 1. CSS Import (src/index.css)

**✅ CORRECT v4 Format:**
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other CSS variables ... */
  }
  
  * {
    border-color: hsl(var(--border));
  }
  
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}
```

**❌ FORBIDDEN v3 Format:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. Vite Configuration (vite.config.ts)

**✅ REQUIRED v4 Setup:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // This handles everything
  ],
})
```

### 3. PostCSS Configuration (postcss.config.js)

**✅ v4 Format (when using PostCSS):**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

**Note**: When using `@tailwindcss/vite` plugin, PostCSS config may not be necessary.

### 4. Tailwind Config (tailwind.config.js)

**✅ v4 Format (Optional - Zero Config Preferred):**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... shadcn/ui colors
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

## shadcn/ui Integration

### Color System
Use HSL CSS variables with `hsl()` function:

```css
.text-foreground {
  color: hsl(var(--foreground));
}

.bg-card {
  background-color: hsl(var(--card));
}
```

### Component Structure
```typescript
// Button component example
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
  }
)
```

## Common Issues and Solutions

### Issue 1: Classes Not Generating
**Problem**: Utility classes like `text-4xl`, `font-bold`, `p-8` not appearing in CSS.

**Solutions**:
1. Ensure correct CSS import: `@import "tailwindcss";`
2. Add `@tailwindcss/vite` plugin to Vite config
3. Restart dev server after config changes
4. Check file is in content detection path

### Issue 2: Styles Not Applied on First Load
**Problem**: Styles work after refresh but not on initial page load.

**Solution**: Use `@tailwindcss/vite` plugin instead of PostCSS-only approach.

### Issue 3: Arbitrary Values Working but Standard Classes Don't
**Problem**: `bg-[#ff0000]` works but `bg-red-500` doesn't.

**Solution**: Configuration issue - check CSS import method and plugin setup.

## Best Practices

### 1. Class Organization
```typescript
// Group related classes logically
<div className="flex items-center justify-center p-8 space-x-4">
  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Primary Action
  </Button>
</div>
```

### 2. CSS Variable Usage
```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}

.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

### 3. Responsive Design
```typescript
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
    Responsive Heading
  </h1>
</div>
```

## Troubleshooting Steps

1. **Verify Installation**:
   ```bash
   npm list tailwindcss @tailwindcss/vite @tailwindcss/postcss
   ```

2. **Check CSS Import**:
   ```css
   @import "tailwindcss"; /* Not @tailwind directives */
   ```

3. **Verify Vite Plugin**:
   ```typescript
   import tailwindcss from '@tailwindcss/vite'
   // In plugins array: tailwindcss()
   ```

4. **Restart Dev Server**:
   ```bash
   # Kill existing servers on port 5173
   npm run dev
   ```

5. **Clear Cache**:
   ```bash
   rm -rf node_modules/.cache
   rm -rf .vite
   npm run dev
   ```

## Migration from v3 to v4 Checklist

- [ ] Update CSS imports from `@tailwind` to `@import "tailwindcss"`
- [ ] Install `@tailwindcss/vite` package
- [ ] Add `tailwindcss()` plugin to Vite config
- [ ] Update PostCSS config to use `@tailwindcss/postcss`
- [ ] Remove or simplify `tailwind.config.js` (optional in v4)
- [ ] Test utility class generation
- [ ] Verify shadcn/ui components work correctly
- [ ] Update build and development scripts if needed

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Vite Plugin Documentation](https://github.com/tailwindlabs/tailwindcss/tree/next/packages/%40tailwindcss-vite)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## Project-Specific Notes

- **Port**: Always use 5173 (CARDINAL RULE)
- **Node Version**: 20.x required
- **Build Target**: Dual build (Vite web + Google Apps Script)
- **Color System**: HSL variables for shadcn/ui compatibility