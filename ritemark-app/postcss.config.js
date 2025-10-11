export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Temporarily disabled for testing
    // 'postcss-prefix-selector': {
    //   prefix: '.legacy-root',
    //   exclude: [
    //     // Don't prefix Tailwind base layer
    //     /^@layer base/,
    //     // Don't prefix CSS custom properties
    //     /^:root/,
    //     /^\.dark/,
    //     // Don't prefix html, body selectors (keep them global)
    //     /^html/,
    //     /^body/,
    //     // Don't prefix global imports
    //     /^@import/,
    //   ],
    // },
  },
}