import React from 'react'
import { X, Command, Hash, Type, List, Link, Image, Code, Quote, CheckSquare } from 'lucide-react'
import './TipsModal.css'

interface TipsModalProps {
  onClose: () => void
}

const TipsModal: React.FC<TipsModalProps> = ({ onClose }) => {
  const tips = [
    {
      category: 'Commands',
      icon: <Command size={20} />,
      items: [
        { key: '/', description: 'Open command menu for quick formatting' },
        { key: 'Cmd/Ctrl + K', description: 'Quick command palette' },
      ],
    },
    {
      category: 'Headings',
      icon: <Hash size={20} />,
      items: [
        { key: '#', description: 'Heading 1 (largest)' },
        { key: '##', description: 'Heading 2' },
        { key: '###', description: 'Heading 3 (and so on...)' },
      ],
    },
    {
      category: 'Text Formatting',
      icon: <Type size={20} />,
      items: [
        { key: '**text**', description: 'Bold text' },
        { key: '*text*', description: 'Italic text' },
        { key: '~~text~~', description: 'Strikethrough' },
        { key: '`code`', description: 'Inline code' },
      ],
    },
    {
      category: 'Lists',
      icon: <List size={20} />,
      items: [
        { key: '-', description: 'Bullet list' },
        { key: '1.', description: 'Numbered list' },
        { key: '- [ ]', description: 'Task list (checkbox)' },
      ],
    },
    {
      category: 'Links & Media',
      icon: <Link size={20} />,
      items: [
        { key: '[text](url)', description: 'Insert link' },
        { key: '![alt](url)', description: 'Insert image' },
      ],
    },
    {
      category: 'Code & Quotes',
      icon: <Code size={20} />,
      items: [
        { key: '```', description: 'Code block (type language after)' },
        { key: '>', description: 'Blockquote' },
      ],
    },
  ]

  return (
    <div className="tips-modal-overlay" onClick={onClose}>
      <div className="tips-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="tips-modal-header">
          <h2 className="tips-modal-title">Markdown Shortcuts</h2>
          <button className="tips-modal-close" onClick={onClose} aria-label="Close tips">
            <X size={20} />
          </button>
        </div>

        <div className="tips-modal-content">
          {tips.map((section, idx) => (
            <div key={idx} className="tips-section">
              <div className="tips-section-header">
                <div className="tips-section-icon">{section.icon}</div>
                <h3 className="tips-section-title">{section.category}</h3>
              </div>
              <div className="tips-section-items">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="tips-item">
                    <span className="tips-item-key">{item.key}</span>
                    <span className="tips-item-desc">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="tips-modal-footer">
          <p className="tips-modal-hint">
            💡 You can always access these tips by typing <kbd>/help</kbd> in the editor
          </p>
        </div>
      </div>
    </div>
  )
}

export default TipsModal
