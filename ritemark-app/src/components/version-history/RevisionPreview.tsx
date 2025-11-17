import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { History } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevisionPreviewProps {
  fileId: string
  revisionId: string | null
  getAccessToken: () => Promise<string | null>
  onRestore: (revisionId: string) => void
}

export function RevisionPreview({
  fileId,
  revisionId,
  getAccessToken,
  onRestore,
}: RevisionPreviewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!revisionId || !getAccessToken) {
      setContent(null)
      setError(null)
      return
    }

    let isMounted = true

    const fetchRevisionContent = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch fresh access token (handles expiration/refresh automatically)
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('Authentication required')
        }

        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revisionId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to load revision content')
        }

        const text = await response.text()
        if (isMounted) {
          setContent(text)
        }
      } catch (err) {
        console.error('Failed to fetch revision:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load revision')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchRevisionContent()

    return () => {
      isMounted = false
    }
  }, [fileId, revisionId, getAccessToken])

  if (!revisionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <History className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Select a version to preview
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-sm text-destructive mb-4">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className={cn(
            "whitespace-pre-wrap break-words font-mono text-sm",
            "bg-muted p-4 rounded-lg"
          )}>
            {content}
          </pre>
        </div>
      </div>
      <div className="border-t p-4">
        <Button
          onClick={() => onRestore(revisionId)}
          className="w-full"
        >
          Restore This Version
        </Button>
      </div>
    </div>
  )
}
