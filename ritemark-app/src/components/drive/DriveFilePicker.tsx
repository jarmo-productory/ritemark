import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { usePicker } from '../../hooks/usePicker'
import { DriveFileBrowser } from './DriveFileBrowser'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog'
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
        // Sprint 27 Fix: showPicker is now async (fetches fresh token)
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
          },
          (error) => {
            // Picker failed to open - show error and close
            console.error('Picker error:', error)
            alert(`Failed to open file picker: ${error}`)
            onClose()
          }
        ).then((pickerOpened) => {
          // If picker failed to open, close immediately
          if (!pickerOpened) {
            onClose()
          }
        }).catch((error) => {
          console.error('Failed to open picker:', error)
          onClose()
        })
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
      <Dialog open={true}>
        <DialogContent className="border-none bg-transparent shadow-none">
          <DialogTitle className="sr-only">Loading Google Drive Picker</DialogTitle>
          <DialogDescription className="sr-only">
            Preparing the Google Drive file picker interface
          </DialogDescription>
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-lg">Loading Google Picker...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Picker handles its own UI, so this component returns null
  return null
}
