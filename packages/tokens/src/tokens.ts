export const tokens = {
  color: {
    primary: 'var(--dt-color-primary)',
    primaryHover: 'var(--dt-color-primary-hover)',
    primaryContrast: 'var(--dt-color-primary-contrast)',
    text: 'var(--dt-color-text)',
    textMuted: 'var(--dt-color-text-muted)',
    surface: 'var(--dt-color-surface)',
    border: 'var(--dt-color-border)',
    success: 'var(--dt-color-success)',
    warning: 'var(--dt-color-warning)',
    error: 'var(--dt-color-error)',
    info: 'var(--dt-color-info)',
  },
  radius: {
    sm: 'var(--dt-radius-sm)',
    md: 'var(--dt-radius-md)',
    lg: 'var(--dt-radius-lg)',
    pill: 'var(--dt-radius-pill)',
  },
  space: (n: 1 | 2 | 3 | 4 | 5 | 6 | 8) => `var(--dt-space-${n})`,
} as const;

export type DtTokens = typeof tokens;
