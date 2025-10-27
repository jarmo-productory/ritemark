# Troubleshooting RiteMark

Common problems and how to fix them quickly.

## Authentication & Sign-In Issues

### "Can't sign in" or "Popup blocked"

**Problem**: Sign-in popup doesn't appear or closes immediately

**Solutions**:
1. **Check popup blocker**: Look for a popup icon in your browser address bar
2. **Allow popups**: Add `ritemark.netlify.app` to allowed sites
3. **Disable extensions**: Temporarily disable ad blockers or privacy extensions
4. **Try different browser**: Test in Chrome, Firefox, or Safari
5. **Clear browser cache**: Go to Settings → Privacy → Clear browsing data

**How to allow popups (Chrome)**:
1. Click the popup icon (🚫) in address bar
2. Select "Always allow popups from ritemark.netlify.app"
3. Click "Done"
4. Refresh the page and try again

### "OAuth error" or "Access denied"

**Problem**: Google OAuth fails with error message

**Solutions**:
1. **Grant all permissions**: RiteMark needs Google Drive access to work
2. **Check Google account**: Make sure you're not using a school/work account with restrictions
3. **Re-authorize**: Sign out completely and sign in again
4. **Clear cookies**: Delete cookies for `accounts.google.com` and retry
5. **Contact support**: If using enterprise Google Workspace, your admin may need to approve the app

### "Session expired" or keeps logging out

**Problem**: RiteMark logs you out frequently

**Solutions**:
1. **Check browser settings**: Ensure cookies are enabled
2. **Don't use private/incognito mode**: Sessions don't persist in private browsing
3. **Update browser**: Old browser versions may have session bugs
4. **Check third-party cookies**: Some privacy settings block required cookies
5. **Sign in again**: Sometimes a fresh sign-in fixes token issues

## Document Saving Issues

### "Document won't save" or "Sync failed"

**Problem**: Changes aren't saving to Google Drive

**Solutions**:
1. **Check internet connection**: Saving requires active internet
2. **Check Google Drive storage**: You may be out of space (check [drive.google.com](https://drive.google.com))
3. **Wait for retry**: RiteMark retries automatically with exponential backoff
4. **Check sync status**: Look for error message in top-right corner
5. **Copy your work**: Select all (`Cmd+A` / `Ctrl+A`), copy to clipboard as backup
6. **Refresh page**: Hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+F5`) and retry

**Check your Google Drive storage**:
1. Visit [drive.google.com](https://drive.google.com)
2. Look in bottom-left corner for storage used
3. If over 15GB, delete old files or upgrade to Google One

### "Auto-save not working"

**Problem**: Document shows "Unsaved changes" for a long time

**Solutions**:
1. **Wait 3 seconds**: Auto-save has a 3-second delay after you stop typing
2. **Check "Saving..." indicator**: Should appear in top-right
3. **Manual save**: Click File menu (☰) → Save (forces immediate save)
4. **Check network**: Open [drive.google.com](https://drive.google.com) to verify Drive is accessible
5. **Check console**: Press F12 → Console tab to see error messages

### "Conflict detected" or "Version mismatch"

**Problem**: Multiple versions of document exist

**Solutions**:
1. **Choose version**: RiteMark will prompt you to keep local or remote version
2. **Keep local**: Use this if your changes are newer
3. **Keep remote**: Use this if someone else edited while you were offline
4. **Copy both**: Copy your version to clipboard, reload, paste into new section
5. **Use version history**: File menu → Version History to compare versions

## Document Opening Issues

### "Can't open file from Drive"

**Problem**: File picker shows empty or files won't open

**Solutions**:
1. **Check file extension**: Only `.md` files work in RiteMark
2. **Check permissions**: File must be owned by you or shared with you
3. **Refresh picker**: Close and reopen "Open from Drive"
4. **Check Google Drive app**: Files must be in Drive, not "Shared with me" (unless you add them to your Drive)
5. **Check file size**: Very large files (>5MB) may take time to load

### "File not found" or "404 error"

**Problem**: Previously opened file can't be found

**Solutions**:
1. **Check if deleted**: File may have been deleted from Google Drive
2. **Check trash**: Visit [drive.google.com/drive/trash](https://drive.google.com/drive/trash) to restore
3. **Check ownership**: File may have been unshared by owner
4. **Search Drive**: Use Drive search to locate the file by name
5. **Open from Drive**: Use "Open from Drive" instead of file history

### "Loading forever" or stuck on spinner

**Problem**: File picker or document loads endlessly

**Solutions**:
1. **Wait 30 seconds**: Large files or slow connections take time
2. **Check internet speed**: Test with [fast.com](https://fast.com)
3. **Refresh page**: Hard refresh and try again
4. **Clear cache**: Browser → Settings → Privacy → Clear cache
5. **Try smaller file**: Test with a new, empty document first

## Editing & Formatting Issues

### "Can't type" or "Cursor not working"

**Problem**: Editor doesn't respond to typing

**Solutions**:
1. **Click in editor**: Make sure editor area has focus (click anywhere in white area)
2. **Check for modals**: Close any open dialogs or popups
3. **Refresh page**: Sometimes editor state gets stuck
4. **Check browser console**: Press F12 to see if JavaScript errors occurred
5. **Try different document**: Test with a new document to isolate issue

### "Formatting not working" or "Shortcuts don't work"

**Problem**: Bold, italic, or other formatting doesn't apply

**Solutions**:
1. **Select text first**: Highlight the text you want to format
2. **Check keyboard shortcuts**: Ensure you're using correct modifier key (Cmd on Mac, Ctrl on Windows)
3. **Use slash commands**: Type `/` to access formatting menu
4. **Check browser**: Some browsers or extensions interfere with shortcuts
5. **Use toolbar**: If shortcuts fail, use the formatting bubble menu (appears when you select text)

### "Undo/Redo broken" or "Lost my changes"

**Problem**: Can't undo recent changes or accidentally deleted content

**Solutions**:
1. **Try undo shortcut**: `Cmd+Z` (Mac) or `Ctrl+Z` (Windows)
2. **Check undo limit**: Only last 100 actions are kept in history
3. **Use version history**: File menu → Version History to restore older version
4. **Check auto-save**: Your changes may be saved, just refresh the page
5. **Copy before risky edits**: Always copy important content before major changes

### "Markdown symbols appearing" (like ** or ##)

**Problem**: Raw markdown syntax visible in editor

**Solutions**:
1. **This shouldn't happen!** RiteMark is WYSIWYG - you should never see raw markdown
2. **Report this bug**: This is a critical issue - [open a GitHub issue](https://github.com/jarmo-productory/ritemark/issues)
3. **Refresh page**: Try reloading to reset editor state
4. **Copy content**: Export markdown and re-import to clean up formatting
5. **Use different browser**: Test if browser-specific issue

## Export & Copy Issues

### "Copy to clipboard not working"

**Problem**: "Copy to Clipboard" doesn't copy markdown

**Solutions**:
1. **Check browser permissions**: Allow clipboard access when prompted
2. **Manual copy**: File menu → Export → Copy markdown manually
3. **Try keyboard**: `Cmd+A` (select all) → `Cmd+C` (copy) as fallback
4. **Check browser**: Safari has stricter clipboard permissions than Chrome
5. **Use export instead**: Download as `.md` file and open in text editor

### "Exported markdown looks wrong"

**Problem**: Markdown format doesn't match visual editor

**Solutions**:
1. **This is a bug!** [Report it](https://github.com/jarmo-productory/ritemark/issues) with examples
2. **Check formatting**: Some complex formatting may not export perfectly
3. **Simplify structure**: Avoid nested lists or complex tables
4. **Test incrementally**: Export small sections to find problematic content
5. **Use standard markdown**: Stick to basic formatting (headings, bold, lists)

### "Word export creates blank document"

**Problem**: Exported `.docx` file is empty or corrupted

**Solutions**:
1. **Check document content**: Empty documents export as empty
2. **Try different browser**: Test in Chrome if using Firefox
3. **Copy markdown instead**: Use markdown export as workaround
4. **Check file size**: Very large documents may fail to convert
5. **Report issue**: Include browser and document details

## Performance Issues

### "Editor is slow" or "Typing lag"

**Problem**: Noticeable delay when typing or editing

**Solutions**:
1. **Check document size**: Very large documents (>50 pages) will be slower
2. **Close other tabs**: Free up browser memory
3. **Restart browser**: Memory leaks can slow things down
4. **Update browser**: Old versions may have performance issues
5. **Check computer resources**: Look for high CPU/memory usage

### "Page crashes" or "Browser freezes"

**Problem**: RiteMark causes browser to crash or freeze

**Solutions**:
1. **Reduce document size**: Split large documents into multiple files
2. **Clear browser cache**: May fix corrupted data
3. **Update browser**: Use latest version for bug fixes
4. **Check extensions**: Disable all extensions and test
5. **Report crash**: Use browser's crash reporting to help us investigate

### "Images load slowly" or "Spinning loader"

**Problem**: Images take a long time to appear

**Solutions**:
1. **Check internet speed**: Image loading requires good connection
2. **Check image size**: Large images (>5MB) take longer to load
3. **Wait for Drive**: Google Drive may be slow temporarily
4. **Optimize images**: Use smaller image files when possible
5. **Check browser console**: Look for network errors (F12 → Network tab)

## Mobile-Specific Issues

### "Can't type on mobile"

**Problem**: Keyboard doesn't appear or editor doesn't respond on phone/tablet

**Solutions**:
1. **Tap directly in editor**: Make sure you're tapping the white editor area
2. **Close other apps**: Free up device memory
3. **Update browser**: Use latest mobile browser version
4. **Try landscape mode**: Sometimes orientation affects editor
5. **Restart browser**: Close and reopen browser app

### "Toolbar too small on mobile"

**Problem**: Formatting buttons are hard to tap

**Solutions**:
1. **Use landscape mode**: Toolbar is larger in landscape orientation
2. **Pinch to zoom**: Zoom in on toolbar area temporarily
3. **Use slash commands**: Type `/` for formatting menu (easier on mobile)
4. **Use text selection bubble**: Select text to show formatting options

### "Google Drive picker doesn't work on mobile"

**Problem**: File picker blank or crashes on phone

**Solutions**:
1. **This is a known limitation**: Google Picker API doesn't work on iOS Safari
2. **Use custom browser**: RiteMark automatically switches to custom file browser on mobile
3. **If still broken**: Report issue with device model and browser version
4. **Workaround**: Create new documents instead of opening existing ones

## Network & Connectivity Issues

### "Offline mode activated" unexpectedly

**Problem**: RiteMark shows offline despite having internet

**Solutions**:
1. **Check internet**: Open [google.com](https://google.com) to verify connection
2. **Check firewall**: Corporate networks may block Google APIs
3. **Refresh page**: Sometimes connection check fails temporarily
4. **Check VPN**: VPNs can interfere with Google Drive access
5. **Wait and retry**: RiteMark automatically retries connection

### "Sync stuck at 99%" or "Uploading..."

**Problem**: Document appears to sync but never completes

**Solutions**:
1. **Check file size**: Very large documents take longer
2. **Check internet stability**: Intermittent connection causes retry loops
3. **Wait for timeout**: RiteMark will eventually fail and retry
4. **Check Drive quota**: You may be out of storage mid-upload
5. **Copy content**: Save your work externally as backup

### "CORS error" or "Blocked by policy"

**Problem**: Console shows cross-origin or security errors

**Solutions**:
1. **Check browser extensions**: Disable privacy/security extensions
2. **Check corporate firewall**: Enterprise networks may block Google APIs
3. **Use different network**: Try home internet vs. work network
4. **Update browser**: Security policies change with browser versions
5. **Report issue**: Include browser console screenshot

## Data & Privacy Concerns

### "Where are my files stored?"

**Answer**:
- Your documents are stored in **your Google Drive**, not on RiteMark servers
- You can see them at [drive.google.com](https://drive.google.com)
- We only access files you create or open in RiteMark
- You own all your content - we never see it

### "Can you read my documents?"

**Answer**:
- **No.** RiteMark operates entirely in your browser
- All communication goes directly from your browser to Google Drive
- Our servers never receive your document content
- We can't decrypt or access your files

### "How do I delete my data?"

**Steps**:
1. Sign out of RiteMark
2. Visit [Google Account permissions](https://myaccount.google.com/permissions)
3. Find "RiteMark" in the list
4. Click "Remove Access"
5. Delete your `.md` files from Google Drive
6. Done! All data removed

## Still Need Help?

### Report a Bug

1. Check if it's a known issue: [GitHub Issues](https://github.com/jarmo-productory/ritemark/issues)
2. If new, create an issue with:
   - **Browser**: Name and version
   - **Device**: Desktop/mobile, OS version
   - **Steps to reproduce**: Exactly what you did
   - **Expected vs. actual**: What should happen vs. what happened
   - **Screenshots**: If applicable
   - **Console errors**: Press F12 → Console → screenshot any red errors

### Get Support

- **Email**: jarmo@productory.eu
- **GitHub Issues**: [Open an issue](https://github.com/jarmo-productory/ritemark/issues)
- **Response time**: Usually within 24-48 hours

### Emergency Recovery

**If RiteMark is completely broken:**

1. **Access Google Drive directly**: [drive.google.com](https://drive.google.com)
2. **Find your `.md` file**: Search for your document name
3. **Open in text editor**: Right-click → Open with → Google Docs (or download)
4. **Copy content**: Save your work somewhere safe
5. **Report issue**: Tell us what broke so we can fix it

---

**Last Updated**: 2025-10-27
**Version**: 1.0 (Sprint 18)
