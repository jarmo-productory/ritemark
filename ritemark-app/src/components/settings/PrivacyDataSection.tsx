/**
 * Privacy & Data Section
 * GDPR compliance: data export, account deletion, privacy policy
 */

import { useState } from 'react'
import { Download, Trash2, ExternalLink } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { useAuth } from '@/hooks/useAuth'

interface PrivacyDataSectionProps {
  userId: string
  onDeleteAccount: () => void
}

export function PrivacyDataSection({ userId, onDeleteAccount }: PrivacyDataSectionProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      console.log('[PrivacyDataSection] Exporting data for user:', userId)

      // Call GDPR export endpoint
      const response = await fetch('/.netlify/functions/gdpr-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: user?.email,
          name: user?.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Export failed')
      }

      // Download JSON file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ritemark-data-export-${userId}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      console.log('[PrivacyDataSection] Data exported successfully')
      alert('✅ Data exported successfully!')
    } catch (error) {
      console.error('[PrivacyDataSection] Export failed:', error)
      alert(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    setShowDeleteDialog(false)
    setIsDeleting(true)

    try {
      console.log('[PrivacyDataSection] Deleting account for user:', userId)

      // Call GDPR deletion endpoint
      const response = await fetch('/.netlify/functions/gdpr-delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: user?.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Account deletion failed')
      }

      const result = await response.json()
      console.log('[PrivacyDataSection] Account deleted successfully:', result)

      // Show success message
      alert('✅ Account deleted successfully. Your Google Drive files are safe.')

      // Trigger logout and cleanup (handled by parent component)
      onDeleteAccount()
    } catch (error) {
      console.error('[PrivacyDataSection] Account deletion failed:', error)
      alert(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-4 pt-6 pb-6 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">Privacy & Data</h3>

        {/* Download data */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Download my data</Label>
            <p className="text-sm text-muted-foreground">
              Export all your data as JSON
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>

        {/* Delete account */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Delete my account</Label>
            <p className="text-sm text-destructive">
              ⚠️ Permanently delete all your data
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>

        {/* Privacy policy */}
        <div className="flex items-center justify-between">
          <Label>Privacy Policy</Label>
          <Button variant="link" size="sm" asChild>
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
              View policy <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirmed}
      />
    </>
  )
}
