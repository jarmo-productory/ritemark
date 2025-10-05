import React, { useState, useEffect } from 'react'
import { useDriveFiles } from '../../hooks/useDriveFiles'
import type { DriveFileBrowserProps } from '../../types/drive'
import { Search, File, Clock, X, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

/**
 * DriveFileBrowser - Custom mobile-optimized file list
 * Shows app-created markdown files only
 * Features: search, file cards, pull-to-refresh feel
 */
export const DriveFileBrowser: React.FC<DriveFileBrowserProps> = ({
  onFileSelect,
  onClose,
}) => {
  const { files, isLoading, error, hasMore, fetchFiles, loadMore, refresh, searchFiles } = useDriveFiles()
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Initial fetch
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchFiles(searchQuery)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  const formatFileSize = (sizeBytes?: string): string => {
    if (!sizeBytes) return ''
    const bytes = parseInt(sizeBytes, 10)
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="drive-file-browser">
      {/* Header */}
      <div className="browser-header">
        <h2 className="browser-title">Open from Drive</h2>
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Close file browser"
        >
          <X size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search markdown files..."
            className="search-input"
          />
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="refresh-button"
          aria-label="Refresh file list"
        >
          <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error.message}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && files.length === 0 && (
        <div className="loading-state">
          <Loader2 size={32} className="spinning" />
          <p>Loading files...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && files.length === 0 && !error && (
        <div className="empty-state">
          <File size={48} />
          <h3>No files found</h3>
          <p>
            {searchQuery
              ? 'Try a different search term'
              : 'Create a new document to get started'}
          </p>
        </div>
      )}

      {/* File List */}
      <div className="file-list">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file)}
            className="file-card"
          >
            <div className="file-icon">
              <File size={24} />
            </div>
            <div className="file-info">
              <h3 className="file-name">{file.name}</h3>
              <div className="file-meta">
                <Clock size={14} />
                <span>{formatDate(file.modifiedTime)}</span>
                {file.size && (
                  <>
                    <span className="meta-separator">•</span>
                    <span>{formatFileSize(file.size)}</span>
                  </>
                )}
              </div>
            </div>
          </button>
        ))}

        {/* Load More */}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="load-more-button"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="spinning" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        )}
      </div>

      <style>{`
        .drive-file-browser {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .browser-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          min-height: 56px;
        }

        .browser-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 56px;
          min-height: 56px;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background-color: #f3f4f6;
        }

        .search-form {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #6b7280;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          min-height: 56px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .refresh-button {
          background: white;
          border: 1px solid #d1d5db;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 56px;
          min-height: 56px;
          transition: all 0.2s;
        }

        .refresh-button:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background-color: #fef2f2;
          color: #dc2626;
          border-bottom: 1px solid #fecaca;
        }

        .loading-state,
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          color: #6b7280;
          text-align: center;
        }

        .empty-state h3 {
          margin: 16px 0 8px;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        .file-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .file-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          min-height: 72px;
        }

        .file-card:hover {
          background-color: #f9fafb;
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .file-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background-color: #eff6ff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #111827;
        }

        .file-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #6b7280;
        }

        .meta-separator {
          color: #d1d5db;
        }

        .load-more-button {
          width: 100%;
          padding: 12px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 56px;
          transition: all 0.2s;
        }

        .load-more-button:hover:not(:disabled) {
          background-color: #eff6ff;
          border-color: #3b82f6;
        }

        .load-more-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        /* Tablet and Desktop */
        @media (min-width: 768px) {
          .drive-file-browser {
            position: static;
            max-width: 600px;
            margin: 0 auto;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          }

          .browser-header {
            border-radius: 12px 12px 0 0;
          }
        }

        /* Large Desktop */
        @media (min-width: 1024px) {
          .drive-file-browser {
            max-width: 800px;
          }

          .file-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .load-more-button {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  )
}
