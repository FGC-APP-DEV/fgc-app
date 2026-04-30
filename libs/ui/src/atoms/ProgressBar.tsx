import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { clamp } from '@fgc/shared'

export interface ProgressBarProps {
  value: number
  max: number
}

export function ProgressBar({ value, max }: ProgressBarProps) {
  const { colors } = useTheme()
  const pct = useMemo(() => clamp(Math.round((value / max) * 100), 0, 100), [value, max])
  const fillColor =
    pct >= 80 ? colors.success : pct >= 50 ? colors.accent : pct >= 30 ? colors.warning : colors.danger
  return (
    <View style={[styles.track, { backgroundColor: colors.border }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
})
