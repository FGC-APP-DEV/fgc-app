import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@apollo/client/react'
import { GET_ANNOUNCEMENTS, GET_TEAMS } from '@fgc/graphql'
import type { TranslationDict } from '@fgc/shared'
import { SectionHeader, StatusChip, useTheme } from '@fgc/ui'

export interface MentorDashboardProps {
  t: TranslationDict
}

export function MentorDashboard({ t }: MentorDashboardProps) {
  const { colors } = useTheme()
  const teamsQ = useQuery(GET_TEAMS)
  const annQ = useQuery(GET_ANNOUNCEMENTS)

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.h1, { color: colors.text }]}>{t.mentorDashboard}</Text>
      <SectionHeader title={t.notebookStatus} icon="📓" />
      {(teamsQ.data?.teams ?? []).map(
        (team: { id: string; name: string; notebookStatus: string }) => (
          <View
            key={team.id}
            style={[
              styles.row,
              { borderColor: colors.border, backgroundColor: colors.bgElevated },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: '700', width: 56 }}>{team.id}</Text>
            <Text style={{ color: colors.text, flex: 1 }}>{team.name}</Text>
            <StatusChip status={team.notebookStatus} label={team.notebookStatus} />
          </View>
        ),
      )}
      <SectionHeader title={t.interviewNotices} icon="◷" />
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
