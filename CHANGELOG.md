# Changelog

All notable user-facing changes to RiteMark will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.28.0] - 2025-11-15

### ✨ Added
- **Pick up where you left off - Loading State**: When you return to RiteMark with "Pick up where you left off" enabled, you'll now see a friendly loading spinner and message ("Opening your last file...") instead of the action buttons while your previous file loads. This prevents confusion and accidental clicks during file restoration.

### 🎨 Improved
- Enhanced user experience during automatic file restoration
- Clearer visual feedback when loading settings and files
- Professional loading animations for a polished feel

### 🐛 Fixed
- Removed confusing display of "New Document" and "Open from Drive" buttons while auto-restore was in progress

---

## [Unreleased]

### Coming Soon
- Real-time collaboration with Y.js
- Mobile-responsive editor improvements
- AI writing assistance integration

---

## Release History

### [1.27.0] - 2025-11-14
- OAuth callback handling improvements
- Production domain support (rm.productory.ai)
- TypeScript type safety enhancements

### [1.26.0] - 2025-11-13
- Client-side error monitoring via Netlify functions
- Enhanced debugging capabilities

### [1.25.0] - 2025-11-12
- Settings sync across devices via Google Drive AppData
- Encrypted token management for enhanced security

---

## Version Naming Convention

- **Major** (x.0.0): Breaking changes or major feature releases
- **Minor** (1.x.0): New features, sprints, and enhancements
- **Patch** (1.1.x): Bug fixes and minor improvements

Each sprint typically results in a minor version bump.
