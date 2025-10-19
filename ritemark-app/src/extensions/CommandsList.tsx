import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { Command } from './SlashCommands'

interface CommandsListProps {
  items: Command[]
  command: (item: Command) => void
}

export const CommandsList = forwardRef((props: CommandsListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      // Guard against empty items list
      if (props.items.length === 0) {
        return false
      }

      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }

      if (event.key === 'Enter') {
        const selectedItem = props.items[selectedIndex]
        if (selectedItem) {
          props.command(selectedItem)
        }
        return true
      }

      return false
    },
  }))

  return (
    <div className="slash-command-menu bg-popover text-popover-foreground rounded-lg border shadow-lg p-1 min-w-[320px] max-h-[400px] overflow-y-auto">
      {props.items.length > 0 ? (
        props.items.map((item, index) => (
          <button
            key={index}
            className={`
              flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md
              transition-colors cursor-pointer border-none
              ${index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
              }
            `}
            onClick={() => props.command(item)}
          >
            <span className="flex items-center justify-center w-8 h-8 text-muted-foreground">
              <item.icon size={18} />
            </span>
            <div className="flex flex-col items-start flex-1">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          No commands found
        </div>
      )}
    </div>
  )
})

CommandsList.displayName = 'CommandsList'
