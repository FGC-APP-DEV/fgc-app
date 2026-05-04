import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@apollo/client/react'
import {
  GET_ANNOUNCEMENTS,
  GET_JUDGES,
  GET_TEAMS,
  type GetAnnouncementsQueryData,
  type GetJudgesQueryData,
  type GetTeamsQueryData,
} from '@fgc/graphql'
import type { TranslationDict } from '@fgc/shared'
import { ProgressBar, SectionHeader, StatusChip, useTheme } from '@fgc/ui'

export interface JudgeAdvisorDashboardProps {
  t: TranslationDict
}

export function JudgeAdvisorDashboard({ t }: JudgeAdvisorDashboardProps) {
  const { colors } = useTheme()
  const teamsQ = useQuery<GetTeamsQueryData>(GET_TEAMS)
  const judgesQ = useQuery<GetJudgesQueryData>(GET_JUDGES)
  const annQ = useQuery<GetAnnouncementsQueryData>(GET_ANNOUNCEMENTS)

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.h1, { color: colors.text }]}>{t.judgeAdvisorDashboard}</Text>
      <SectionHeader title={t.divergenceWarnings} icon="⚑" />
      <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
        {(teamsQ.data?.teams ?? []).filter(x => x.divergence).length}{' '}
        teams flagged for divergence review.
      </Text>
      <SectionHeader title={t.evaluations} icon="◎" />
      {(judgesQ.data?.judges ?? []).map(j => (
        <View
          key={j.id}
          style={[
            styles.row,
            { borderColor: colors.border, backgroundColor: colors.bgElevated },
          ]}
        >
          <Text style={{ color: colors.text, flex: 1 }}>{j.name}</Text>
          <View style={{ width: 140 }}>
            <ProgressBar value={j.completed} max={Math.max(j.total, 1)} />
          </View>
          <StatusChip status={j.status} label={j.status} />
        </View>
      ))}
      <SectionHeader title={t.announcements} icon="!" />
      {(annQ.data?.announcements ?? []).map(a => (
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
      ))}
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
