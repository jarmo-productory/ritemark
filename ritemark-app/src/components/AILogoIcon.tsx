/**
 * AI Logo Icon Component
 * Custom icon matching the RM logo design style
 * Compact version for use in buttons and UI elements
 */

interface AILogoIconProps {
  size?: number
  className?: string
}

export function AILogoIcon({ size = 24, className = '' }: AILogoIconProps) {
  return (
    <div
      className={`ai-logo-icon ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <span className="ai-logo-text" style={{ fontSize: `${size * 0.42}px` }}>
        AI
      </span>
    </div>
  )
}
