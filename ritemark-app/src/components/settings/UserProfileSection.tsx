/**
 * User Profile Section
 * Displays user avatar, name, and email in Settings dialog
 */

import { User } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface UserProfileSectionProps {
  user: {
    name?: string
    email?: string
    picture?: string
  }
}

export function UserProfileSection({ user }: UserProfileSectionProps) {
  return (
    <div className="flex items-center gap-4 pb-6 border-b">
      <Avatar className="h-12 w-12">
        {user.picture ? (
          <AvatarImage src={user.picture} alt={user.name || 'User'} />
        ) : null}
        <AvatarFallback>
          {user.name?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{user.name || 'User'}</p>
        <p className="text-sm text-muted-foreground">{user.email || ''}</p>
      </div>
    </div>
  )
}
