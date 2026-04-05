'use client'

interface Props {
  text: string
  variant?: 'dark' | 'light' | 'default'
}

export function HookTextBanner({ text, variant = 'default' }: Props) {
  if (!text) return null

  const styles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    default: {
      bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      border: 'none',
      color: '#ffffff',
      icon: '🎁',
    },
    dark: {
      bg: 'linear-gradient(135deg, rgba(197,165,90,0.18) 0%, rgba(197,165,90,0.08) 100%)',
      border: '1px solid rgba(197,165,90,0.35)',
      color: '#C5A55A',
      icon: '🎁',
    },
    light: {
      bg: 'linear-gradient(135deg, rgba(197,165,90,0.15) 0%, rgba(197,165,90,0.06) 100%)',
      border: '1px solid rgba(197,165,90,0.3)',
      color: '#8B6914',
      icon: '🎁',
    },
  }

  const s = styles[variant]

  return (
    <div style={{
      background: s.bg,
      border: s.border,
      borderRadius: 7,
      padding: '7px 12px',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
    }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
      <p style={{
        margin: 0,
        fontSize: 12,
        fontWeight: 700,
        color: s.color,
        lineHeight: 1.4,
        letterSpacing: '0.01em',
      }}>
        {text}
      </p>
    </div>
  )
}
