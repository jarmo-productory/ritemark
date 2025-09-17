# shadcn/ui Technical Implementation Guide

**Version**: Latest compatible with Tailwind CSS v4  
**Project**: Ritemark  
**Updated**: September 2025  

## Overview

This document provides the definitive technical implementation guide for shadcn/ui components with Tailwind CSS v4 in the Ritemark project. **All shadcn/ui component code generation must reference this document.**

## Critical Integration Requirements

### Dependencies
```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.13",
    "tailwindcss": "^4.1.13"
  }
}
```

### Utility Function (MANDATORY)
```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Color System Configuration

### CSS Variables (src/index.css)
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
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

### Tailwind Config (Tailwind CSS v4 Compatible)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
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

## Component Implementation

### Button Component (CORRECT Implementation)
```typescript
// src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
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
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## Critical Fixes for Hover States

### Issue 1: Alpha Value Support
**Problem**: `hover:bg-primary/90` not working due to alpha value processing.

**Solution**: Use `<alpha-value>` in color definitions:
```javascript
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
  },
}
```

### Issue 2: Missing Cursor Pointer
**Problem**: Buttons don't show pointer cursor on hover.

**Solution**: Add `cursor-pointer` to button base classes:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center ... cursor-pointer",
  // ...
)
```

### Issue 3: Transition Colors Not Working
**Problem**: Smooth transitions between states not occurring.

**Solution**: Ensure `transition-colors` is in base classes and proper CSS variables are defined.

## Common Patterns

### Using Components with Variants
```typescript
// Primary button
<Button onClick={handleClick}>
  Primary Action
</Button>

// Secondary button
<Button variant="secondary" onClick={handleClick}>
  Secondary Action
</Button>

// Destructive button
<Button variant="destructive" onClick={handleClick}>
  Delete Item
</Button>

// Ghost button
<Button variant="ghost" size="sm" onClick={handleClick}>
  Cancel
</Button>
```

### Custom Button Styling
```typescript
<Button 
  className={cn("w-full", "bg-green-500", "hover:bg-green-600")}
  onClick={handleClick}
>
  Custom Styled Button
</Button>
```

## Troubleshooting

### Hover States Not Working
1. **Check color definitions** include `<alpha-value>` support
2. **Verify CSS variables** are properly defined in `:root`
3. **Ensure `transition-colors`** is in component base classes
4. **Add `cursor-pointer`** to interactive elements

### Colors Not Applying
1. **Verify Tailwind config** has proper color extensions
2. **Check CSS import** uses `@import "tailwindcss"`
3. **Ensure `@tailwindcss/vite`** plugin is configured
4. **Restart dev server** after config changes

### Component Not Found Errors
1. **Check file paths** in component imports
2. **Verify `@/lib/utils`** path alias is configured
3. **Install required dependencies** (clsx, tailwind-merge, etc.)

## Installation Checklist

- [ ] Install required dependencies (clsx, tailwind-merge, class-variance-authority)
- [ ] Create `src/lib/utils.ts` with `cn` function
- [ ] Configure CSS variables with HSL values
- [ ] Update Tailwind config with `<alpha-value>` support
- [ ] Add `@tailwindcss/vite` plugin to Vite config
- [ ] Implement components with proper variant structure
- [ ] Add `cursor-pointer` to interactive elements
- [ ] Test hover states and transitions

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v4 with shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4)
- [Class Variance Authority](https://cva.style/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

## Project-Specific Notes

- **Always use `cn()` function** for className merging
- **Reference color variables** as `hsl(var(--variable) / <alpha-value>)`
- **Include `cursor-pointer`** in all interactive components
- **Test hover states** after implementation
- **Follow Tailwind v4 patterns** from technical documentation