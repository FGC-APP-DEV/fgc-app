export interface ThemeColors {
  bg: string
  bgElevated: string
  text: string
  textMuted: string
  border: string
  accent: string
  accentDim: string
  success: string
  warning: string
  danger: string
}

export const darkColors: ThemeColors = {
  bg: '#080c10',
  bgElevated: '#0f1419',
  text: '#e8eaed',
  textMuted: '#8b949e',
  border: '#1f2937',
  accent: '#3b82f6',
  accentDim: 'rgba(59, 130, 246, 0.15)',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
}

export const lightColors: ThemeColors = {
  bg: '#f0f2f5',
  bgElevated: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  accent: '#2563eb',
  accentDim: 'rgba(37, 99, 235, 0.12)',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626',
}
