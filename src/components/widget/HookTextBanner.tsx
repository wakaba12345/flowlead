'use client'

interface Props {
  text: string
  variant?: 'default' | 'purple' | 'dark' | 'light' | 'indigo' | 'storm'
}

export function HookTextBanner({ text, variant = 'default' }: Props) {
  if (!text) return null

  type StyleDef = { bg: string; border: string; color: string; icon: string }

  const styles: Record<string, StyleDef> = {
    // 行銷強效：橘色
    default: {
      bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      border: 'none',
      color: '#ffffff',
      icon: '🎁',
    },
    // 現代卡片：紫色
    purple: {
      bg: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      border: 'none',
      color: '#ffffff',
      icon: '🎁',
    },
    // 極簡豪華深色：純金底 + 深藍字，無 icon
    dark: {
      bg: '#C5A55A',
      border: 'none',
      color: '#0F1B2D',
      icon: '',
    },
    // 極簡豪華淺色：純金底 + 深棕字，無 icon
    light: {
      bg: '#C5A55A',
      border: 'none',
      color: '#1A1208',
      icon: '',
    },
    // 極簡專業：靛藍色
    indigo: {
      bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      border: 'none',
      color: '#ffffff',
      icon: '🎁',
    },
    // 新聞媒體：純紅色，無 icon
    storm: {
      bg: '#CC0000',
      border: 'none',
      color: '#ffffff',
      icon: '',
    },
  }

  const s = styles[variant] ?? styles.default

  return (
    <div style={{
      background: s.bg,
      border: s.border,
      borderRadius: 6,
      padding: '7px 12px',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: s.icon ? 7 : 0,
    }}>
      {s.icon && <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>}
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
