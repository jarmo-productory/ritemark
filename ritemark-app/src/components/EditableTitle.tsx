import { useState, useRef, useEffect } from 'react'

interface EditableTitleProps {
  title: string
  onRename: (newTitle: string) => void
  className?: string
}

export function EditableTitle({ title, onRename, className = '' }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update edit value when title prop changes
  useEffect(() => {
    setEditValue(title)
  }, [title])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select() // Select all text for easy replacement
    }
  }, [isEditing])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleSave = () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== title) {
      onRename(trimmedValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(title) // Reset to original value
    setIsEditing(false)
  }

  const handleBlur = () => {
    handleSave()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`bg-transparent border-none outline-none text-foreground font-medium min-w-0 flex-1 ${className}`}
        style={{ minWidth: '100px' }}
      />
    )
  }

  return (
    <span
      onClick={handleClick}
      className={`cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded transition-colors ${className}`}
      title="Click to rename"
    >
      {title}
    </span>
  )
}
