import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DriveRevision {
  id: string
  modifiedTime: string
  lastModifyingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  size?: string
}

interface RevisionListProps {
  revisions: DriveRevision[]
  selectedId: string | null
  onSelect: (revisionId: string) => void
  loading: boolean
  error: string | null
  onRetry?: () => void
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }
  return date.toLocaleString('en-US', options)
}

function formatFileSize(bytes?: string): string {
  if (!bytes) return ''
  const size = parseInt(bytes, 10)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function RevisionList({
  revisions,
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
}: RevisionListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (revisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No previous versions available</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {revisions.map((revision) => {
        const isSelected = revision.id === selectedId
        return (
          <button
            key={revision.id}
            onClick={() => onSelect(revision.id)}
            className={cn(
              'w-full text-left p-4 hover:bg-accent transition-colors',
              isSelected && 'bg-accent'
            )}
          >
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">
                  {formatTimestamp(revision.modifiedTime)}
                </p>
                {revision.size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(revision.size)}
                  </p>
                )}
              </div>
              {revision.lastModifyingUser && (
                <p className="text-xs text-muted-foreground">
                  {revision.lastModifyingUser.displayName}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
