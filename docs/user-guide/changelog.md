# RiteMark Changelog

All notable changes to RiteMark are documented here. Latest releases appear first.

---

## November 4, 2025 - AI Writing Assistant

**Your AI-Powered Writing Partner** 🤖

We've integrated OpenAI to help you write and edit faster. Ask the AI to make changes to your document using natural language commands.

### What's New

**AI Chat Sidebar**
- **Natural language editing** - Just tell the AI what you want: "replace hello with hi" or "change the greeting"
- **Instant document changes** - AI modifies your text in real-time
- **Message history** - Keep track of your conversation with the AI
- **Smart context** - Automatically resets when you switch documents

**Your Own API Key (BYOK)**
- **You control costs** - Bring your own OpenAI API key, no surprise charges from us
- **Secure storage** - Your key is encrypted with bank-grade AES-256-GCM encryption
- **Two ways to add** - Enter your key in Settings → General, or directly in the chat sidebar
- **Instant sync** - Add your key anywhere, and it updates everywhere immediately
- **Easy management** - View your masked key or delete it anytime

**How to Get Started**
1. Get a free OpenAI API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add it in Settings → General (click your avatar) or in the AI chat sidebar
3. Click the chat icon in the top-right corner
4. Start giving commands like "make this more professional" or "fix grammar"

### Technical Details
- Uses OpenAI's GPT-5-mini model for fast, affordable edits
- All processing happens in your browser - your documents never leave your device
- Keys are encrypted and stored locally in IndexedDB
- Zero-duplication architecture with shared components

**Privacy Note:** We never see your API key or your documents. Everything stays on your device and communicates directly with OpenAI.

---

## November 3, 2025 - Enhanced Security & Settings

**Safer, More Professional, More Control** 🔒

We've hardened OAuth security, added comprehensive settings management, and improved the overall user experience.

### What's New

**Settings & Account Dialog**
- **Unified settings hub** - All preferences in one place (click your avatar in the sidebar)
- **User profile section** - See your Google account info at a glance
- **General preferences** - Pick up where you left off, theme selection, keyboard shortcuts
- **Privacy & data controls** - Export your data, manage your account
- **Professional design** - Clean, accessible interface following WCAG guidelines

**OAuth Security Improvements**
- **Better error messages** - No more browser alerts, professional error dialogs with retry options
- **Token validation** - Automatic token checking every 15 minutes with graceful re-authentication
- **HTTPS enforcement** - Secure connections in production
- **Rate limiting** - 10 requests per minute per IP to prevent abuse
- **CSRF protection** - Enhanced security with state parameter validation

**GDPR Compliance**
- **Export your data** - Download all your settings and preferences as JSON
- **Delete your account** - Permanently remove all your data with clear confirmation
- **Privacy transparency** - Updated privacy policy with comprehensive data handling details

### Bug Fixes
- Fixed: Table of Contents scrolling now works reliably (Sprint 15 pattern reuse)
- Fixed: Token refresh handles async operations correctly
- Fixed: Backend health checks optimized with global context

### Technical Improvements
- Professional error dialogs replace browser alerts
- Structured logging with metadata support
- Shared OAuth callback handler (130+ lines deduplicated)
- Backend health context for performance optimization

**Where to find it:** Click your avatar in the bottom-left sidebar to access Settings & Account.

---

## November 1, 2025 - Your Settings Sync Everywhere

**Pick Up Where You Left Off** 🔄

Your editor preferences now sync automatically across all your devices. Change your font size on your laptop, and it's already updated on your phone.

### What Syncs
- **Editor preferences** - Font size, font family, theme (light/dark)
- **Auto-save settings** - Your preferred auto-save timing
- **It just works** - Changes sync in the background every 30 seconds
- **Private and secure** - Everything is encrypted before syncing to your Google Drive

### How It Works
- **Automatic syncing** - No buttons to click, it happens behind the scenes
- **Works offline** - Settings load instantly from your device's cache
- **Cross-device** - Start editing on desktop, continue on mobile
- **No setup needed** - Just sign in with Google and it's enabled

**Technical Note:** Settings are stored encrypted in your Google Drive's private app folder. Only you can access them.

---

## October 27, 2025 - Export & Share Features

**New Ways to Share Your Work** 📤

We've added three powerful ways to export and share your documents:

### Copy to Clipboard
- **One-click copying** with the ⋮ menu (keyboard shortcut: ⌘⇧C)
- Paste into **Microsoft Word, Google Docs, Slack, email** with formatting intact
- Headings, bold, italic, lists, and tables all preserved
- Falls back to plain markdown in text editors

### Export to Word
- **Download as .docx** directly from RiteMark
- Opens perfectly in Microsoft Word, Google Docs, LibreOffice
- Professional formatting with Calibri font (Microsoft's standard)
- Includes your name and date in document properties
- Perfect spacing for business documents

### Download as Markdown
- **Save raw markdown files** (.md) to your computer
- Use with static site generators (Jekyll, Hugo, 11ty)
- Compatible with any markdown editor
- Great for version control and GitHub

**Where to find it:** Click the ⋮ menu in the top-right corner of any document.

---

## October 26, 2025 - Version History

**Time Travel for Your Documents** ⏮️

Never lose your work again! You can now view and restore previous versions of your documents.

### What's New
- **See all past versions** saved to Google Drive
- **Preview changes** side-by-side with the current version
- **Restore any version** with one click
- **Automatic saving** every time you make changes
- Works with Google Drive's built-in version control

**How it works:** Click the ⋮ menu → "View Version History" (or press ⌘⇧H)

### Bug Fixes
- Fixed: Tables now export correctly to Word format
- Fixed: Sign-in experience is more consistent
- Fixed: Better error messages when authentication expires

---

## Earlier Updates

### September 2025 - Google Drive Integration
- **Cloud-first editing** - All documents save automatically to Google Drive
- **No manual saving** - Every change syncs instantly
- **Access anywhere** - Edit from any device with Google Drive
- **Secure authentication** - Sign in with your Google account

### August 2025 - Launch
- **WYSIWYG markdown editor** - Write markdown without seeing markdown
- **Real-time formatting** - See bold, headings, and lists as you type
- **Clean interface** - Focus on writing, not tools
- **Mobile-friendly** - Works great on phones and tablets

---

**Need Help?**
- [Getting Started Guide](./getting-started.md)
- [Troubleshooting](./troubleshooting.md)
- Report issues on [GitHub](https://github.com/jarmotuisk/ritemark)

---

*RiteMark is in active development. New features are added regularly based on user feedback.*
