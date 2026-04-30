import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@apollo/client/react'
import { GET_ANNOUNCEMENTS, GET_EVENT_SCHEDULE } from '@fgc/graphql'
import type { TranslationDict } from '@fgc/shared'
import { SectionHeader, StatusChip, useTheme } from '@fgc/ui'

export interface PublicDashboardProps {
  t: TranslationDict
}

export function PublicDashboard({ t }: PublicDashboardProps) {
  const { colors } = useTheme()
  const schedQ = useQuery(GET_EVENT_SCHEDULE)
  const annQ = useQuery(GET_ANNOUNCEMENTS)

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.h1, { color: colors.text }]}>{t.publicDashboard}</Text>
      <SectionHeader title={t.schedule} icon="⏱" />
      {(schedQ.data?.eventSchedule ?? []).map(
        (e: {
          id: string
          timeDisplay: string
          eventName: string
          status: string
        }) => (
          <View
            key={e.id}
            style={[
              styles.row,
              { borderColor: colors.border, backgroundColor: colors.bgElevated },
            ]}
          >
            <Text style={{ color: colors.textMuted, width: 56 }}>{e.timeDisplay}</Text>
            <Text style={{ color: colors.text, flex: 1 }}>{e.eventName}</Text>
            <StatusChip status={e.status} label={e.status} />
          </View>
        ),
      )}
      <SectionHeader title={t.announcements} icon="!" />
      {(annQ.data?.announcements ?? []).map(
        (a: { id: string; type: string; text: string; timeDisplay: string }) => (
          <View
            key={a.id}
            style={[
              styles.row,
              { borderColor: colors.border, backgroundColor: colors.bgElevated },
            ]}
          >
            <Text style={{ color: colors.textMuted, width: 48 }}>{a.timeDisplay}</Text>
            <Text style={{ color: colors.text, flex: 1 }}>{a.text}</Text>
          </View>
        ),
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
})
