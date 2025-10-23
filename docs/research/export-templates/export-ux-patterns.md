# Export UX Patterns Research - Sprint 16

## Overview

Research conducted for adding export templates to FileMenu in RiteMark. This document synthesizes UX patterns from successful products and provides implementation guidance for shadcn/ui components.

**Research Date**: 2025-10-22
**Sprint**: 15b - Export Templates
**Purpose**: Define UX patterns for export menu in FileMenu component

---

## 1. Google Docs Export Pattern

### Desktop Interface
- **Access**: File menu → Download submenu
- **Structure**: Simple hierarchical menu
- **Format Options**:
  - PDF (.pdf)
  - Microsoft Word (.docx)
  - OpenDocument (.odt)
  - Rich Text Format (.rtf)
  - Plain Text (.txt)
  - HTML (.html)
  - Markdown (.md)

### Mobile Interface
- **Access**: Share & export → Save As
- **Format Selection**: Modal dialog with format picker
- **Action**: OK button confirms selection

### Key UX Insights
✅ **Familiar Pattern**: File → Download is established convention
✅ **Progressive Disclosure**: Submenu keeps interface clean
✅ **Format-First**: User chooses format before download
⚠️ **Export Warnings**: Displays alerts for potential formatting issues on complex documents

---

## 2. Notion Export Pattern

### Access Point
- **Trigger**: Three-dot menu (•••) at top-right of page
- **Export Option**: "Export" in dropdown menu

### Export Modal
- **Presentation**: Centered modal window
- **Format Selection**: Radio buttons or dropdown
  - HTML
  - Markdown & CSV
  - PDF

### Additional Options
- **Include Subpages**: Toggle for nested content
- **Delivery Method**: Email with download link (for large exports)

### Mobile Experience
- **Native Integration**: Taps Export → Opens device share menu
- **Platform Specific**: Leverages iOS/Android sharing capabilities

### Key UX Insights
✅ **Progressive Disclosure**: Menu → Modal keeps complexity hidden
✅ **Async Handling**: Email delivery for large files prevents timeouts
✅ **Mobile-First**: Native share integration feels natural
✅ **Additional Settings**: Toggle options for advanced features

---

## 3. GitHub Copy/Download Pattern

### File Copy Pattern
- **Location**: File toolbar (top of file view)
- **Button**: "Copy raw contents" button
- **Feedback**: Visual confirmation after copy

### Clipboard Copy Element
GitHub's open-source `clipboard-copy-element`:

```html
<clipboard-copy value="Text to copy">
  Copy
</clipboard-copy>
```

**Features**:
- Custom element (web component)
- Dispatches `clipboard-copy` event on success
- Supports `for` attribute to reference other elements
- Works with divs, inputs, links

### Key UX Insights
✅ **Direct Copy**: One-click clipboard copy (no download)
✅ **Visual Feedback**: Event-based confirmation
✅ **Lightweight**: Minimal JavaScript (3kb gzipped with clipboard.js)
✅ **Accessible**: Custom element approach

---

## 4. shadcn/ui DropdownMenu Patterns

### Nested Submenu Implementation

**Required Imports**:
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
```

### Complete Example

```tsx
export function ExportMenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">File</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>File Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Export Submenu */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Download className="mr-2 h-4 w-4" />
              <span>Export</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Markdown (.md)</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileJson className="mr-2 h-4 w-4" />
                  <span>JSON (.json)</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileCode className="mr-2 h-4 w-4" />
                  <span>HTML (.html)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy to Clipboard</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Icon Placement & Sizing
- **Position**: Left-aligned with 8px margin-right (`mr-2`)
- **Size**: 16x16px (`h-4 w-4` = 1rem = 16px)
- **Consistency**: All items use same icon size

### Mobile Responsiveness
⚠️ **Deep Nesting Issue**: Community reports submenu content disappearing when hovering over deeply nested triggers
✅ **Solution**: Limit nesting to 1-2 levels maximum
✅ **Alternative**: Use DropDrawer for responsive dropdown/drawer hybrid

---

## 5. Clipboard API Best Practices

### Copy Button States

```typescript
type CopyState = 'idle' | 'copying' | 'success' | 'error';

const [copyState, setCopyState] = useState<CopyState>('idle');
```

**State Flow**:
1. **idle**: Default state, button shows "Copy"
2. **copying**: Brief loading state (optional, for large content)
3. **success**: Shows "Copied!" for 1.5-2 seconds
4. **error**: Shows error message briefly
5. **Auto-reset**: Returns to idle after timeout

### Implementation Pattern

```typescript
async function copyToClipboard(text: string) {
  // Check browser support
  if ('clipboard' in navigator) {
    return await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    return document.execCommand('copy', true, text);
  }
}

function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(text);
      setIsCopied(true);

      // Auto-reset after 1.5-2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);

      // Optional: Show toast notification
      toast.success("Copied to clipboard!");

    } catch (err) {
      console.error('Copy failed:', err);
      toast.error("Failed to copy");
    }
  };

  return (
    <Button onClick={handleCopy}>
      {isCopied ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </>
      )}
    </Button>
  );
}
```

### shadcn useCopyToClipboard Hook

```typescript
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

const [copy, isCopied] = useCopyToClipboard();

// Usage with toast
await copy("Hello world").then(() => {
  toast("Text Copied to your clipboard 🎉");
});
```

**Hook Features**:
- Returns tuple: `[copy function, isCopied boolean]`
- Promise-based API for chaining
- Automatic 2-second reset
- Error handling with console warnings
- Browser compatibility fallback

### Toast Notifications

**Best Practices**:
- **Duration**: 1.5-3 seconds for success messages
- **Position**: Bottom-right or top-right (non-intrusive)
- **Content**: Simple confirmation ("Copied!", "Export successful")
- **Icons**: Checkmark for success, X for error
- **Dismiss**: Auto-dismiss or manual close button

**shadcn/ui Toast Example**:
```typescript
import { toast } from '@/components/ui/use-toast';

toast({
  title: "Export successful",
  description: "Document exported as Markdown",
  variant: "default", // or "destructive" for errors
});
```

### Browser Compatibility

**Security Requirements**:
✅ **HTTPS Only**: Clipboard API requires secure context
✅ **localhost Exception**: Works on localhost for development
✅ **User Interaction**: Must be triggered by click or keypress
⚠️ **No Background Access**: Cannot access clipboard without user action

**Mobile Considerations**:
- iOS Safari: Full support (iOS 13.4+)
- Chrome Android: Full support
- Firefox Android: Full support
- Fallback required for older mobile browsers

---

## 6. File Download Implementation

### Browser Download Pattern

```typescript
function downloadFile(content: string, filename: string, mimeType: string) {
  // Create blob from content
  const blob = new Blob([content], { type: mimeType });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Usage examples
downloadFile(markdownContent, 'document.md', 'text/markdown');
downloadFile(jsonContent, 'data.json', 'application/json');
downloadFile(htmlContent, 'page.html', 'text/html');
```

### MIME Types Reference

| Format | Extension | MIME Type |
|--------|-----------|-----------|
| Markdown | .md | text/markdown |
| JSON | .json | application/json |
| HTML | .html | text/html |
| Plain Text | .txt | text/plain |
| PDF | .pdf | application/pdf |
| Word | .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |

---

## 7. Loading States & Error Handling

### Export State Machine

```typescript
type ExportState =
  | { status: 'idle' }
  | { status: 'exporting'; format: string }
  | { status: 'success'; format: string }
  | { status: 'error'; error: string };

const [exportState, setExportState] = useState<ExportState>({
  status: 'idle'
});

async function handleExport(format: string) {
  setExportState({ status: 'exporting', format });

  try {
    const content = await generateExport(format);
    downloadFile(content, `document.${format}`, getMimeType(format));

    setExportState({ status: 'success', format });
    toast.success(`Exported as ${format.toUpperCase()}`);

    // Reset after success
    setTimeout(() => {
      setExportState({ status: 'idle' });
    }, 2000);

  } catch (error) {
    setExportState({
      status: 'error',
      error: error instanceof Error ? error.message : 'Export failed'
    });
    toast.error('Export failed');

    // Reset after error
    setTimeout(() => {
      setExportState({ status: 'idle' });
    }, 3000);
  }
}
```

### Loading Indicator in Menu Items

```tsx
<DropdownMenuItem
  onClick={() => handleExport('md')}
  disabled={exportState.status === 'exporting'}
>
  {exportState.status === 'exporting' && exportState.format === 'md' ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <FileText className="mr-2 h-4 w-4" />
  )}
  <span>Markdown (.md)</span>
</DropdownMenuItem>
```

---

## 8. Recommended UX Pattern for RiteMark

### Proposed Structure

```
File Menu
├── New Document
├── Open...
├── Save
├── Save As...
├── ───────────── (separator)
├── Export ▶
│   ├── Markdown (.md)
│   ├── JSON (.json)
│   ├── HTML (.html)
│   ├── ───────────── (separator)
│   └── Copy to Clipboard
├── ───────────── (separator)
└── Settings
```

### Key Design Decisions

1. **Location**: Export submenu in File menu (familiar pattern)
2. **Icon**: Download icon (📥) for Export trigger
3. **Formats**: Start with 3 core formats (MD, JSON, HTML)
4. **Clipboard**: Separate "Copy to Clipboard" option at bottom of submenu
5. **Feedback**: Toast notifications for all actions
6. **States**: Loading spinner during export, success checkmark
7. **Mobile**: Touch-friendly sizing (min 44px touch targets)

### Implementation Checklist

- [ ] Add DropdownMenuSub components to FileMenu
- [ ] Implement download functions for each format
- [ ] Add clipboard copy with toast feedback
- [ ] Create export state management
- [ ] Add loading indicators
- [ ] Implement error handling with user-friendly messages
- [ ] Add toast notifications for success/error states
- [ ] Test on mobile devices
- [ ] Add keyboard shortcuts (Cmd/Ctrl+E for export menu)
- [ ] Add analytics tracking for export usage

---

## 9. Code Samples for Implementation

### Complete FileMenu Export Submenu

```tsx
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Download,
  FileText,
  FileJson,
  FileCode,
  Copy,
  Check,
  Loader2
} from "lucide-react";

type ExportFormat = 'md' | 'json' | 'html';
type ExportState = 'idle' | 'exporting' | 'success' | 'error';

export function FileMenu() {
  const [exportState, setExportState] = useState<{
    status: ExportState;
    format?: ExportFormat;
  }>({ status: 'idle' });

  const [copyState, setCopyState] = useState<'idle' | 'success'>('idle');

  async function handleExport(format: ExportFormat) {
    setExportState({ status: 'exporting', format });

    try {
      // Generate content based on format
      const content = await generateExportContent(format);

      // Download file
      const mimeTypes = {
        md: 'text/markdown',
        json: 'application/json',
        html: 'text/html',
      };

      downloadFile(content, `document.${format}`, mimeTypes[format]);

      setExportState({ status: 'success', format });
      toast({
        title: "Export successful",
        description: `Document exported as ${format.toUpperCase()}`,
      });

      setTimeout(() => setExportState({ status: 'idle' }), 2000);

    } catch (error) {
      setExportState({ status: 'error' });
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });

      setTimeout(() => setExportState({ status: 'idle' }), 3000);
    }
  }

  async function handleCopyToClipboard() {
    try {
      const content = await generateMarkdownContent();
      await navigator.clipboard.writeText(content);

      setCopyState('success');
      toast({
        title: "Copied to clipboard",
        description: "Document copied as Markdown",
      });

      setTimeout(() => setCopyState('idle'), 1500);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy to clipboard",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          File
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>File Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>New Document</DropdownMenuItem>
        <DropdownMenuItem>Open...</DropdownMenuItem>
        <DropdownMenuItem>Save</DropdownMenuItem>
        <DropdownMenuItem>Save As...</DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Export Submenu */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Download className="mr-2 h-4 w-4" />
              <span>Export</span>
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {/* Markdown Export */}
                <DropdownMenuItem
                  onClick={() => handleExport('md')}
                  disabled={exportState.status === 'exporting'}
                >
                  {exportState.status === 'exporting' && exportState.format === 'md' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : exportState.status === 'success' && exportState.format === 'md' ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  <span>Markdown (.md)</span>
                </DropdownMenuItem>

                {/* JSON Export */}
                <DropdownMenuItem
                  onClick={() => handleExport('json')}
                  disabled={exportState.status === 'exporting'}
                >
                  {exportState.status === 'exporting' && exportState.format === 'json' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : exportState.status === 'success' && exportState.format === 'json' ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <FileJson className="mr-2 h-4 w-4" />
                  )}
                  <span>JSON (.json)</span>
                </DropdownMenuItem>

                {/* HTML Export */}
                <DropdownMenuItem
                  onClick={() => handleExport('html')}
                  disabled={exportState.status === 'exporting'}
                >
                  {exportState.status === 'exporting' && exportState.format === 'html' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : exportState.status === 'success' && exportState.format === 'html' ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <FileCode className="mr-2 h-4 w-4" />
                  )}
                  <span>HTML (.html)</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Copy to Clipboard */}
                <DropdownMenuItem onClick={handleCopyToClipboard}>
                  {copyState === 'success' ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper functions
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function generateExportContent(format: ExportFormat): Promise<string> {
  // This would integrate with your editor to get actual content
  // Placeholder implementation
  return `Content exported as ${format}`;
}

async function generateMarkdownContent(): Promise<string> {
  // Get markdown from editor
  return "# Sample Document\n\nContent here...";
}
```

---

## 10. Accessibility Considerations

### Keyboard Navigation
- **Enter/Space**: Open submenu when focused on Export trigger
- **Arrow Keys**: Navigate between menu items
- **Esc**: Close submenu and return to parent menu
- **Tab**: Move focus out of menu entirely

### Screen Reader Support
```tsx
<DropdownMenuSubTrigger aria-label="Export document submenu">
  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
  <span>Export</span>
</DropdownMenuSubTrigger>

<DropdownMenuItem
  onClick={() => handleExport('md')}
  aria-label="Export document as Markdown file"
>
  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
  <span>Markdown (.md)</span>
</DropdownMenuItem>
```

### Focus Management
- Maintain focus trap within open menu
- Return focus to trigger after menu closes
- Visual focus indicators on all interactive elements

---

## 11. Performance Optimization

### Lazy Loading for Large Exports
```typescript
async function handleExport(format: ExportFormat) {
  setExportState({ status: 'exporting', format });

  try {
    // Show progress for large documents
    const content = await generateExportContent(format, {
      onProgress: (percent) => {
        toast({
          title: `Exporting... ${percent}%`,
          duration: 500,
        });
      }
    });

    // Rest of export logic...
  } catch (error) {
    // Error handling...
  }
}
```

### Debounce for Rapid Clicks
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedExport = useDebouncedCallback(
  (format: ExportFormat) => handleExport(format),
  300,
  { leading: true, trailing: false }
);
```

---

## Summary & Recommendations

### ✅ Recommended Patterns

1. **Use DropdownMenuSub** for nested export menu (familiar, accessible)
2. **Limit nesting to 1 level** (export submenu only, no deeper)
3. **Icons on left** with consistent 16px sizing (`h-4 w-4`)
4. **Loading states** with spinner during export
5. **Success feedback** with checkmark + toast notification
6. **Auto-reset** after 1.5-2 seconds for button states
7. **Error handling** with user-friendly messages in toast
8. **Clipboard as option** in export submenu (not separate button)

### 🎯 Implementation Priority

**Phase 1 (MVP)**:
- Markdown export (primary format)
- Copy to Clipboard
- Basic toast notifications
- Download file implementation

**Phase 2 (Enhancement)**:
- JSON export (for data portability)
- HTML export (for web publishing)
- Loading states and spinners
- Error recovery

**Phase 3 (Polish)**:
- Keyboard shortcuts (Cmd/Ctrl+E)
- Progress indicators for large files
- Analytics tracking
- Mobile optimization

### 📊 Success Metrics

- **Adoption**: % of users who use export feature
- **Format Preference**: Which export formats are most popular
- **Error Rate**: % of failed exports
- **Time to Complete**: Average export duration
- **Mobile Usage**: % of exports from mobile devices

---

## References

- [shadcn/ui Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)
- [shadcn/ui useCopyToClipboard Hook](https://www.shadcn.io/hooks/use-copy-to-clipboard)
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [LogRocket: Copy to Clipboard in React](https://blog.logrocket.com/implementing-copy-clipboard-react-clipboard-api/)
- [Google Docs Export Guide](https://www.androidpolice.com/google-docs-export-files/)
- [Notion Export Documentation](https://www.notion.com/help/export-your-content)
- [GitHub clipboard-copy-element](https://github.com/github/clipboard-copy-element)

---

**Research completed**: 2025-10-22
**Document version**: 1.0
**Next steps**: Begin implementation in Sprint 16
