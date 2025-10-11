# RiteMark - WYSIWYG Markdown Editor

**"Google Docs for Markdown"** - A visual editor for AI-native non-technical users who need markdown output with cloud collaboration.

## Features

- **WYSIWYG Editor** - No markdown syntax visible to users
- **Real-time Collaboration** - Work together with Y.js CRDT technology
- **Google Drive Integration** - Cloud-native file storage and management
- **Professional Formatting** - Context-sensitive toolbar with keyboard shortcuts
- **Mobile-Optimized** - Responsive design for modern work patterns

## Tech Stack

- **React 19** + **TypeScript** - Modern UI development
- **Vite** - Fast build tooling
- **TipTap** - Powerful WYSIWYG editor framework
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first styling

## Documentation

### For Users
- [Text Formatting Guide](docs/user-guide/formatting.md) - How to format text with the toolbar

### For Developers
- [FormattingBubbleMenu Component](docs/components/FormattingBubbleMenu.md) - Technical documentation
- [Google Drive Integration](docs/DRIVE-INTEGRATION-SUMMARY.md) - Drive API setup and usage
- [OAuth Setup](docs/oauth-testing-checklist.md) - Authentication configuration

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (runs on localhost:5173)
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Development

This template uses [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) with Babel for Fast Refresh.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
