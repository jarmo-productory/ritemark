import React, { useMemo } from 'react'
import type { SaveStatusProps } from '../../types/drive'
import { CloudOff, Loader2, AlertCircle, Check } from 'lucide-react'

/**
 * SaveStatus - Displays real-time Drive sync status
 * Shows: "Saving...", "Saved X ago", "Error", "Offline"
 * Color-coded states with icons for clear visual feedback
 */
export const SaveStatus: React.FC<SaveStatusProps> = ({
  syncStatus,
  className = '',
}) => {
  const statusDisplay = useMemo(() => {
    const { status, lastSaved, error } = syncStatus

    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 size={16} className="spinning" />,
          text: 'Saving...',
          color: '#3b82f6', // Blue
          bgColor: '#eff6ff',
        }

      case 'synced':
        // Only show "Saved" status if we actually have a lastSaved timestamp
        if (!lastSaved) {
          return null // Don't show anything if nothing has been saved yet
        }
        const timeAgo = formatTimeAgo(lastSaved)
        return {
          icon: <Check size={16} />,
          text: `Saved ${timeAgo}`,
          color: '#10b981', // Green
          bgColor: '#f0fdf4',
        }

      case 'error':
        return {
          icon: <AlertCircle size={16} />,
          text: error || 'Save failed',
          color: '#dc2626', // Red
          bgColor: '#fef2f2',
        }

      case 'offline':
        return {
          icon: <CloudOff size={16} />,
          text: 'Offline',
          color: '#6b7280', // Gray
          bgColor: '#f9fafb',
        }

      default:
        return null // Don't show anything for initial unsaved state
    }
  }, [syncStatus])

  // Don't render anything if statusDisplay is null (nothing saved yet)
  if (!statusDisplay) {
    return null
  }

  return (
    <div className={`save-status ${className}`}>
      <div
        className="status-content"
        style={{
          color: statusDisplay.color,
          backgroundColor: statusDisplay.bgColor,
        }}
      >
        {statusDisplay.icon}
        <span className="status-text">{statusDisplay.text}</span>
      </div>

      <style>{`
        .save-status {
          position: fixed;
          top: 24px;
          left: 20px;
          z-index: 900;
        }

        .status-content {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 400;
          transition: all 0.2s;
          opacity: 0.6;
        }

        .status-content:hover {
          opacity: 1;
        }

        .status-text {
          white-space: nowrap;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .save-status {
            left: 16px;
            top: 20px;
          }

          .status-content {
            padding: 5px 8px;
            font-size: 12px;
          }

          .status-content svg {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Format timestamp as relative time ago
 */
function formatTimeAgo(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 5) return 'just now'
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
