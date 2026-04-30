import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

export interface SectionHeaderProps {
  title: string
  icon?: string
  children?: React.ReactNode
}

export function SectionHeader({ title, icon, children }: SectionHeaderProps) {
  const { colors } = useTheme()
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
