import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

export interface StatusChipProps {
  status: string
  label: string
}

export function StatusChip({ status, label }: StatusChipProps) {
  const { colors } = useTheme()
  return (
    <View
      style={[
        styles.base,
        { borderColor: colors.border, backgroundColor: colors.bgElevated },
        status === 'complete' && { borderColor: colors.success },
        status === 'critical' && { borderColor: colors.danger },
        status === 'warning' && { borderColor: colors.warning },
      ]}
    >
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})
