# Text Formatting Guide

Welcome to RiteMark! This guide explains how to format your text using our visual formatting toolbar. No markdown knowledge required—just select text and click buttons.

## Formatting Toolbar

When you select text in the editor, a **formatting toolbar** automatically appears above or below your selection. This toolbar provides quick access to common text formatting options.

**To see the toolbar:**
1. Click and drag to select any text
2. The toolbar appears automatically
3. Click any formatting button to apply

**Note:** The toolbar won't appear in code blocks to preserve code formatting.

---

## Available Formatting Options

### Bold

Make your text stand out with bold formatting.

**Button:** Bold **B** (first button in toolbar)

**Keyboard Shortcuts:**
- **Mac:** `Cmd + B`
- **Windows/Linux:** `Ctrl + B`

**How to use:**
1. Select the text you want to make bold
2. Click the **B** button or press the keyboard shortcut
3. Selected text becomes bold

**To remove bold:**
- Select the bold text and click **B** again or press the shortcut

**Visual indicator:** The **B** button has a gray background when bold is active.

---

### Italic

Add emphasis with italic formatting.

**Button:** Italic *I* (second button in toolbar)

**Keyboard Shortcuts:**
- **Mac:** `Cmd + I`
- **Windows/Linux:** `Ctrl + I`

**How to use:**
1. Select the text you want to italicize
2. Click the *I* button or press the keyboard shortcut
3. Selected text becomes italic

**To remove italic:**
- Select the italic text and click *I* again or press the shortcut

**Visual indicator:** The *I* button has a gray background when italic is active.

---

### Headings

Create section headings to organize your document.

#### Heading 1 (Large Heading)

**Button:** **H1** (third button in toolbar)

**How to use:**
1. Click anywhere on the line you want to convert
2. Click the **H1** button
3. The entire line becomes a large heading

**To remove:**
- Click **H1** again to convert back to normal text

**Visual indicator:** The **H1** button has a gray background when the current line is a Heading 1.

#### Heading 2 (Medium Heading)

**Button:** **H2** (fourth button in toolbar)

**How to use:**
1. Click anywhere on the line you want to convert
2. Click the **H2** button
3. The entire line becomes a medium heading

**To remove:**
- Click **H2** again to convert back to normal text

**Visual indicator:** The **H2** button has a gray background when the current line is a Heading 2.

---

### Links

Add clickable links to your text.

**Button:** 🔗 Link icon (last button in toolbar)

**Keyboard Shortcuts:**
- **Mac:** `Cmd + K`
- **Windows/Linux:** `Ctrl + K`

**Visual indicator:** The 🔗 button has a gray background when the selected text contains a link.

---

## Working with Links

### Adding a New Link

**Step 1:** Select the text you want to turn into a link
- Example: Select the words "Visit our website"

**Step 2:** Open the link dialog
- Click the 🔗 Link icon in the toolbar, **OR**
- Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux)

**Step 3:** Enter the URL
- Type the website address in the input field
- You can enter just the domain: `example.com`
- Or the full URL: `https://example.com`
- RiteMark automatically adds `https://` if you don't include it

**Step 4:** Save the link
- Click the **Add** button, **OR**
- Press `Enter` on your keyboard

**Result:** Your selected text is now a clickable link!

---

### Editing an Existing Link

**Step 1:** Select the linked text
- Click and drag to select text that already has a link

**Step 2:** Open the link dialog
- Click the 🔗 Link icon, **OR**
- Press `Cmd + K` / `Ctrl + K`

**Step 3:** Modify the URL
- The current URL appears in the input field
- Change it to a new URL

**Step 4:** Save changes
- Click the **Update** button, **OR**
- Press `Enter`

**Result:** The link now points to the new URL.

---

### Removing a Link

**Step 1:** Select the linked text

**Step 2:** Open the link dialog
- Click 🔗 or press `Cmd + K` / `Ctrl + K`

**Step 3:** Remove the link
- Click the red **✕ Remove** button

**Result:** The text is no longer a link (but remains selected and formatted).

---

## URL Tips & Tricks

### Automatic Protocol Addition

RiteMark automatically adds `https://` to URLs that don't have a protocol.

**Examples:**
- You type: `example.com` → Saved as: `https://example.com`
- You type: `github.com/ritemark` → Saved as: `https://github.com/ritemark`
- You type: `https://example.com` → Saved as: `https://example.com` (unchanged)

### Supported URL Formats

**✅ Valid URLs:**
- `example.com`
- `www.example.com`
- `https://example.com`
- `http://example.com`
- `example.com/path/to/page`
- `subdomain.example.com`

**❌ Invalid URLs:**
- Empty input (shows error: "Please enter a URL")
- Non-URL text like "not a website"
- URLs with unsupported protocols (ftp://, file://)

### Error Messages

**"Please enter a URL"**
- You tried to save an empty link
- Solution: Type a URL or click Cancel

**"Please enter a valid URL (e.g., example.com or https://example.com)"**
- The URL format is invalid
- Solution: Check for typos or use a simpler format like `example.com`

---

## Keyboard Shortcuts Summary

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| **Bold** | `Cmd + B` | `Ctrl + B` |
| **Italic** | `Cmd + I` | `Ctrl + I` |
| **Add/Edit Link** | `Cmd + K` | `Ctrl + K` |
| **Submit Link** | `Enter` | `Enter` |
| **Cancel Link Dialog** | `Esc` | `Esc` |

---

## Combining Formats

You can apply multiple formats to the same text!

**Examples:**
- **Bold + Italic:** Select text, click **B**, then click *I*
- **Bold + Link:** Create a link, then select it and click **B**
- **Italic + Heading:** Make text italic first, then convert the line to a heading

**To remove all formatting:**
1. Select the formatted text
2. Click each active format button (gray background) to toggle it off

---

## Tips for Efficient Formatting

### Use Keyboard Shortcuts
- Much faster than clicking buttons
- Works even when toolbar isn't visible
- Memorize: `Cmd/Ctrl + B` (Bold), `Cmd/Ctrl + I` (Italic), `Cmd/Ctrl + K` (Link)

### Select Before Formatting
- Always select text first, then apply formatting
- You can also type text, then select it and format

### Format While Typing
- Press `Cmd/Ctrl + B` before typing to start bold text
- Press the shortcut again to stop bold formatting

### Link Shortcuts
- Press `Enter` in the link dialog instead of clicking Add/Update
- Press `Esc` to cancel and close the dialog quickly

---

## Troubleshooting

### The formatting toolbar doesn't appear

**Possible Reasons:**
- No text is selected (click and drag to select)
- You're inside a code block (formatting is disabled there)

**Solution:** Select text outside of code blocks.

---

### Keyboard shortcuts don't work

**Possible Reasons:**
- You're not selecting text first (required for `Cmd/Ctrl + K`)
- Your browser or another extension is intercepting the shortcut

**Solution:** Try clicking the toolbar buttons instead, or check browser extensions.

---

### Link dialog doesn't open with Cmd+K / Ctrl+K

**Possible Reasons:**
- No text is selected (link shortcut requires selection)
- Browser blocked the shortcut

**Solution:** Select text first, then try again. If it still doesn't work, click the 🔗 icon.

---

### My URL shows an error but it looks correct

**Possible Reasons:**
- URL contains special characters that need encoding
- URL is missing key parts (like domain extension)

**Solution:** Try simplifying the URL to just `example.com` format, or use the full `https://` version.

---

## Next Steps

Now that you know how to format text, explore these features:

- **[Save to Google Drive](#)** - Save your work to the cloud
- **[Collaborate in Real-Time](#)** - Work with others on the same document
- **[Export as Markdown](#)** - Download your document as a .md file

---

## Questions?

If you need help with formatting or encounter issues:
- Check the [FAQs](#)
- Visit our [Support Page](#)
- Report a bug on [GitHub Issues](https://github.com/ritemark/ritemark-app/issues)

---

**Happy writing with RiteMark! 🎉**
