import { useState, useRef, useEffect } from 'react'
import { MoreVertical, FileText, FolderOpen } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface FileMenuProps {
  onOpenFromDrive: () => void
  onNewDocument: () => void
}

export function FileMenu({ onOpenFromDrive, onNewDocument }: FileMenuProps) {
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOpenFromDrive = () => {
    onOpenFromDrive()
    setIsOpen(false)
  }

  const handleNewDocument = () => {
    onNewDocument()
    setIsOpen(false)
  }

  // Don't render if user is not authenticated (after all hooks)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="file-menu-container" ref={menuRef}>
      <button
        className="file-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="File menu"
        aria-expanded={isOpen}
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div className="file-menu-dropdown">
          <button
            className="file-menu-item"
            onClick={handleNewDocument}
          >
            <FileText size={16} />
            <span>New Document</span>
          </button>
          <button
            className="file-menu-item"
            onClick={handleOpenFromDrive}
          >
            <FolderOpen size={16} />
            <span>Open from Drive</span>
          </button>
        </div>
      )}

      <style>{`
        .file-menu-container {
          position: fixed;
          top: 20px;
          right: 60px;
          z-index: 1000;
        }

        .file-menu-trigger {
          opacity: 0.15;
          transition: opacity 0.2s ease;
          cursor: pointer;
          border: none;
          background: none;
          border-radius: 6px;
          padding: 8px;
          color: #374151;
        }

        .file-menu-trigger:hover {
          opacity: 0.8;
          background: rgba(255, 255, 255, 0.1);
        }

        .file-menu-trigger:focus {
          outline: 2px solid rgba(59, 130, 246, 0.3);
          outline-offset: 2px;
        }

        .file-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
                      0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
          min-width: 200px;
          overflow: hidden;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .file-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          transition: background-color 0.15s ease;
          color: #374151;
          font-size: 14px;
          text-align: left;
        }

        .file-menu-item:hover {
          background-color: #f9fafb;
        }

        .file-menu-item:active {
          background-color: #f3f4f6;
        }

        .file-menu-item:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .file-menu-item svg {
          flex-shrink: 0;
          color: #6b7280;
        }

        .file-menu-item span {
          flex: 1;
        }

        @media (max-width: 768px) {
          .file-menu-container {
            right: 16px;
          }
        }
      `}</style>
    </div>
  )
}
