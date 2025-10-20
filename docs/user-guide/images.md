# Working with Images in RiteMark

This guide explains how to add, resize, and manage images in your RiteMark documents.

## Quick Start

There are two ways to add images to your document:

1. **Slash Command**: Type `/image` in your document
2. **Drag and Drop**: Drag an image file from your computer directly into the editor

## Adding Images with Slash Command

### Step 1: Open the Image Command

1. Place your cursor where you want to insert the image
2. Type `/image`
3. Press `Enter` or click the "Image" option from the command menu

### Step 2: Choose Your Image

1. The file picker dialog will open
2. Click "Choose File"
3. Select an image from your computer

**Supported Formats**:
- PNG
- JPEG
- GIF
- WebP

**File Size Limit**: 10MB maximum

### Step 3: Add Alt Text (Optional)

1. After selecting your image, you'll see a preview
2. Enter a description in the "Describe this image..." field
3. This helps with accessibility and SEO
4. If you skip this, the filename will be used instead

### Step 4: Insert the Image

1. Click "Insert Image"
2. Your image will be uploaded to Google Drive
3. The image appears in your document
4. You can continue editing right away

## Adding Images with Drag and Drop

### Quick Method

1. Open your file browser (Finder on Mac, File Explorer on Windows)
2. Find the image you want to add
3. Drag the image into your RiteMark editor
4. Drop it where you want it to appear
5. The image will be uploaded and inserted automatically

**Note**: When using drag and drop, the image uses the filename as alt text. You can't customize alt text with this method.

## Resizing Images

All images can be resized by dragging:

### How to Resize

1. Click on the image to select it
2. Small handles will appear on the corners
3. Click and drag a corner handle to resize
4. The image maintains its aspect ratio automatically
5. Release the mouse button when you're happy with the size

**Tips**:
- Drag from corners (not edges) for best results
- Resize is visual only - the original image file is not modified
- Smaller display size does not reduce file size

## Where Are Images Stored?

All images are automatically uploaded to your Google Drive account:

### Storage Details

- **Folder**: "RiteMark Images"
- **Location**: Root of your Google Drive
- **Permissions**: Anyone with the link can view
- **Format**: WebP (compressed for faster loading)

### Why Google Drive?

- **Cloud Storage**: Access your images from any device
- **Persistent**: Images stay in your documents even after browser refresh
- **No Server**: All uploads happen directly from your browser
- **Your Control**: You own the images in your Drive

### Checking Your Images

1. Go to [Google Drive](https://drive.google.com)
2. Open the "RiteMark Images" folder
3. You'll see all images you've uploaded
4. You can rename, delete, or organize them as needed

**Note**: If you delete an image from Google Drive, it will no longer appear in your documents.

## Image Display

### How Images Appear

All images in RiteMark:
- Display at full width by default
- Can be resized to any size by dragging corners
- Appear on their own line (text flows underneath, not beside)
- Load lazily (only when scrolled into view)
- Use async decoding (for better performance)

### Image Behavior

- **Full-Width Display**: Images take up the full editor width initially
- **Text Flow**: Text always appears below images, never beside them
- **Responsive**: Images scale down on smaller screens
- **Fast Loading**: WebP compression makes images load quickly

## Troubleshooting

### Image Won't Upload

**Problem**: "Upload failed" error appears

**Solutions**:
1. **Check file size**: Maximum is 10MB - try a smaller image
2. **Check file format**: Only PNG, JPEG, GIF, and WebP are supported
3. **Check Google Drive connection**: You must be signed in to Google Drive
4. **Check internet connection**: Upload requires active internet
5. **Try again**: Sometimes network issues are temporary

### Image Not Appearing

**Problem**: Image uploaded successfully but doesn't show in document

**Solutions**:
1. **Refresh the page**: Sometimes a hard refresh (Cmd+Shift+R or Ctrl+Shift+F5) helps
2. **Check Google Drive permissions**: Image must be set to "Anyone with link can view"
3. **Check browser console**: Look for errors (F12 or Cmd+Option+I)
4. **Check Google Drive storage**: You may be out of storage space

### Can't Resize Image

**Problem**: Drag handles don't appear or don't work

**Solutions**:
1. **Click to select**: Make sure the image is selected first
2. **Use corners**: Drag from corner handles, not edges
3. **Check browser**: Try a different browser (Chrome, Firefox, Safari, Edge)
4. **Refresh page**: Reload the editor and try again

### Image Wrong Location (Drag-and-Drop)

**Problem**: Dropped image appears at top of document, not where I dropped it

**Solutions**:
1. **Don't scroll during upload**: Keep the viewport steady while uploading
2. **Use slash command instead**: `/image` gives you more control over placement
3. **Move after insertion**: Select and cut (Cmd+X), then paste where you want it

### Image Takes Too Long to Load

**Problem**: Spinning loader appears for a long time

**Solutions**:
1. **Check file size**: Images over 5MB will take longer to compress and upload
2. **Check internet speed**: Slow connection will delay uploads
3. **Wait for compression**: WebP compression can take 5-10 seconds for large images
4. **Cancel and retry**: Close the dialog and try again

## Tips and Best Practices

### For Best Performance

1. **Optimize images before upload**: Use smaller images when possible
2. **Use appropriate formats**:
   - Photos: JPEG or WebP
   - Graphics/logos: PNG or WebP
   - Animations: GIF
3. **Avoid huge images**: 2-3MB is a good maximum for most images
4. **Use descriptive alt text**: Helps with accessibility and search

### For Better Documents

1. **Add alt text**: Describe what's in the image for accessibility
2. **Use images sparingly**: Too many images can slow down editing
3. **Resize after insertion**: Adjust size to fit your content
4. **Test on mobile**: Check how your document looks on smaller screens

### For Accessibility

1. **Always add alt text**: Screen readers rely on this
2. **Be descriptive**: "Chart showing sales growth Q1 2024" is better than "chart"
3. **Avoid text in images**: If you must, describe the text in alt text
4. **Use images to support text**: Don't rely solely on images to convey information

## Keyboard Shortcuts

Currently, there are no keyboard shortcuts specific to image operations. You can:

- Use `/image` command from keyboard
- Use `Escape` to close the upload dialog
- Use `Tab` to navigate within the dialog
- Use `Enter` to confirm upload

## Limitations

Current limitations (may be added in future updates):

### Not Yet Supported

- **Image alignment**: Left, center, right positioning
- **Text wrapping**: Text flowing around images
- **Image captions**: Figure captions below images
- **Image editing**: Crop, rotate, filters
- **Image borders**: Custom borders or shadows
- **Inline images**: Small images within text paragraphs

### Workarounds

- **Caption**: Add a text paragraph below the image manually
- **Alignment**: All images are full-width for now
- **Editing**: Edit images before uploading (use external tools)

## Privacy and Security

### What Happens to Your Images

1. **Uploaded to your Google Drive**: Not stored on RiteMark servers
2. **You own the images**: Full control through your Google Drive account
3. **Public by default**: Set to "Anyone with link can view" for embedding
4. **WebP conversion**: Original format converted for optimization

### Permissions Required

RiteMark needs these Google Drive permissions:

- **Upload files**: To save your images
- **Create folders**: To organize images in "RiteMark Images" folder
- **Set permissions**: To make images viewable in your documents

**Privacy Note**: RiteMark only accesses files it creates. We cannot see your other Google Drive files.

## Frequently Asked Questions

### Can I use images from URLs?

Not currently. You must upload image files from your computer. URL-based images may be added in a future update.

### Can I upload multiple images at once?

No. You need to upload images one at a time using `/image` or drag and drop.

### What happens if I delete the Google Drive folder?

If you delete the "RiteMark Images" folder or files within it, those images will no longer appear in your documents. The editor will show broken image placeholders.

### Can I share documents with images?

Yes. As long as the images are set to "Anyone with link can view" in Google Drive (which happens automatically), anyone can see them in your shared documents.

### Do images work offline?

No. Images require an internet connection to:
- Upload to Google Drive
- Display in documents (loaded from Drive)

However, if images are cached by your browser, they may appear while offline temporarily.

### Can I use the same image in multiple documents?

Yes! Once uploaded to Google Drive, you can insert the same image in different documents. Just use the `/image` command and select it again from your computer (it will upload again as a separate file).

### Is there a limit to how many images I can add?

The only limit is your Google Drive storage quota. Each Google account gets 15GB free storage shared across Gmail, Drive, and Photos.

## Getting Help

If you're still having trouble with images:

1. **Check browser console**: Press F12 (or Cmd+Option+I on Mac) to see error messages
2. **Try different browser**: Test in Chrome, Firefox, or Safari
3. **Check Google Drive**: Verify you're signed in and have storage space
4. **Report issues**: [Create an issue on GitHub](https://github.com/your-repo/ritemark/issues)

---

**Last Updated**: 2025-10-20
**Version**: 1.0 (Sprint 12)
