import React, { useState, useEffect } from 'react'
import { useDriveFiles } from '../../hooks/useDriveFiles'
import type { DriveFileBrowserProps } from '../../types/drive'
import { Search, File, Clock, X, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

/**
 * DriveFileBrowser - Mobile-optimized file list with shadcn Dialog
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
  const [isOpen, setIsOpen] = useState(true)

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

  const handleClose = () => {
    setIsOpen(false)
    onClose()
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="h-screen max-w-full sm:max-w-2xl sm:h-auto sm:max-h-[80vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-4 border-b min-h-[56px] shrink-0">
          <DialogTitle className="text-lg font-semibold">Open from Google Drive</DialogTitle>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center min-w-[56px] min-h-[56px]"
            aria-label="Close file browser"
          >
            <X size={24} />
          </button>
        </DialogHeader>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 px-4 py-4 border-b shrink-0">
          <div className="flex-1 relative flex items-center">
            <Search size={20} className="absolute left-3 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markdown files..."
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base min-h-[56px] focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white border border-gray-300 p-3 rounded-lg cursor-pointer flex items-center justify-center min-w-[56px] min-h-[56px] transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh file list"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </form>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 border-b border-red-200 shrink-0">
            <AlertCircle size={20} />
            <span>{error.message}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && files.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 text-gray-500 text-center">
            <Loader2 size={32} className="animate-spin" />
            <p className="mt-4">Loading files...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && files.length === 0 && !error && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 text-gray-500 text-center">
            <File size={48} />
            <h3 className="mt-4 mb-2 text-lg font-semibold text-gray-900">No files found</h3>
            <p className="text-sm">
              {searchQuery
                ? 'Try a different search term'
                : 'Create a new document to get started'}
            </p>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 lg:grid lg:grid-cols-2 lg:gap-3">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => onFileSelect(file)}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg mb-2 lg:mb-0 cursor-pointer text-left transition-all min-h-[72px] hover:bg-gray-50 hover:border-blue-500 hover:shadow-md"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <File size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-gray-900">
                  {file.name}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>{formatDate(file.modifiedTime)}</span>
                  {file.size && (
                    <>
                      <span className="text-gray-300">•</span>
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
              className="w-full p-3 bg-white border border-gray-300 rounded-lg cursor-pointer text-base font-medium text-blue-500 flex items-center justify-center gap-2 min-h-[56px] transition-all hover:bg-blue-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed lg:col-span-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
