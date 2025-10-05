import React, { useState, useEffect } from 'react'
import { usePicker } from '../../hooks/usePicker'
import { DriveFileBrowser } from './DriveFileBrowser'
import type { DriveFilePickerProps } from '../../types/drive'

/**
 * DriveFilePicker - Responsive file picker that routes between:
 * - Desktop (≥768px): Google Picker API (opens ANY Drive file)
 * - Mobile (<768px): Custom DriveFileBrowser (app-created files only)
 *
 * This ensures optimal UX across devices while respecting mobile limitations
 */
export const DriveFilePicker: React.FC<DriveFilePickerProps> = ({
  onFileSelect,
  onClose,
}) => {
  const { isPickerReady, showPicker } = usePicker()
  const [showCustomBrowser, setShowCustomBrowser] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Detect viewport width and choose appropriate picker
  useEffect(() => {
    const checkViewport = () => {
      const desktopView = window.innerWidth >= 768
      setIsDesktop(desktopView)

      if (desktopView && isPickerReady) {
        // Desktop: Show Google Picker (opens ANY Drive file)
        // Wrap the callback to convert partial file object to DriveFile
        showPicker(
          (pickedFile) => {
            console.log('Picker selected file:', pickedFile)

            // Convert the minimal file object from Picker to DriveFile format
            const driveFile = {
              ...pickedFile,
              modifiedTime: new Date().toISOString(),
              createdTime: new Date().toISOString(),
            }

            // Call parent callback and close
            onFileSelect(driveFile)
            onClose()
          },
          () => {
            // User cancelled - close the picker UI
            onClose()
          }
        )
        // Don't call onClose() here - wait for file selection or cancel
      } else if (!desktopView) {
        // Mobile: Show custom browser (app-created files only)
        setShowCustomBrowser(true)
      }
    }

    checkViewport()

    // Listen for viewport changes (orientation changes, window resize)
    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 768
      if (newIsDesktop !== isDesktop) {
        checkViewport()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isPickerReady, showPicker, onFileSelect, onClose, isDesktop])

  // Show custom browser for mobile or as fallback
  if (showCustomBrowser) {
    return <DriveFileBrowser onFileSelect={onFileSelect} onClose={onClose} />
  }

  // Loading state while Picker API initializes (desktop only)
  if (isDesktop && !isPickerReady) {
    return (
      <div className="picker-loading-overlay">
        <div className="picker-loading-spinner" />
        <p>Loading Google Picker...</p>

        <style>{`
          .picker-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            color: white;
          }

          .picker-loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  // Picker handles its own UI, so this component returns null
  return null
}
