import React, { useMemo } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@apollo/client/react'
import {
  GET_ANNOUNCEMENTS,
  GET_INTERVIEWS,
  GET_JUDGES,
  GET_TEAMS,
  type GetAnnouncementsQueryData,
  type GetInterviewsQueryData,
  type GetJudgesQueryData,
  type GetTeamsQueryData,
} from '@fgc/graphql'
import type { TranslationDict } from '@fgc/shared'
import { ProgressBar, SectionHeader, StatusChip, useTheme } from '@fgc/ui'

export interface JudgeDashboardProps {
  t: TranslationDict
}

export function JudgeDashboard({ t }: JudgeDashboardProps) {
  const { colors } = useTheme()
  const teamsQ = useQuery<GetTeamsQueryData>(GET_TEAMS)
  const interviewsQ = useQuery<GetInterviewsQueryData>(GET_INTERVIEWS)
  const judgesQ = useQuery<GetJudgesQueryData>(GET_JUDGES)
  const annQ = useQuery<GetAnnouncementsQueryData>(GET_ANNOUNCEMENTS)

  const loading =
    teamsQ.loading || interviewsQ.loading || judgesQ.loading || annQ.loading
  const err =
    teamsQ.error || interviewsQ.error || judgesQ.error || annQ.error

  const teams = teamsQ.data?.teams ?? []
  const completed = useMemo(() => teams.filter(x => x.status === 'complete').length, [teams])
  const pending = useMemo(() => teams.filter(x => x.status === 'pending').length, [teams])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t.loading}</Text>
      </View>
    )
  }
  if (err) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger }}>{t.errorLoad}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]}>
      <Text style={[styles.h1, { color: colors.text }]}>{t.judgeDashboard}</Text>
      <View style={styles.row}>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t.completionProgress}</Text>
          <ProgressBar value={completed} max={Math.max(teams.length, 1)} />
        </View>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t.missingEvals}</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{pending}</Text>
        </View>
      </View>

      <SectionHeader title={t.assignedTeams} icon="▣" />
      {teams.map(team => (
        <View
          key={team.id}
          style={[
            styles.teamRow,
            { borderColor: colors.border, backgroundColor: colors.bgElevated },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>{team.id}</Text>
          <Text style={{ color: colors.text, flex: 1 }}>{team.name}</Text>
          <StatusChip status={team.status} label={team.status} />
          <Text style={{ color: colors.textMuted, marginLeft: 8 }}>{team.panel}</Text>
        </View>
      ))}

      <SectionHeader title={t.interviewNotices} icon="◷" />
      {(interviewsQ.data?.interviews ?? []).map(it => (
        <View
          key={it.id}
          style={[
            styles.teamRow,
            { borderColor: colors.border, backgroundColor: colors.bgElevated },
          ]}
        >
          <Text style={{ color: colors.text, flex: 1 }}>{it.teamName}</Text>
          <Text style={{ color: colors.textMuted }}>{it.scheduleTime}</Text>
          <Text style={{ color: colors.textMuted, marginLeft: 8 }}>{it.room}</Text>
          <StatusChip status={it.status} label={it.status} />
        </View>
      ))}

      <SectionHeader title={t.evaluations} icon="◎" />
      {(judgesQ.data?.judges ?? []).map(j => (
        <View
          key={j.id}
          style={[
            styles.teamRow,
            { borderColor: colors.border, backgroundColor: colors.bgElevated },
          ]}
        >
          <Text style={{ color: colors.text, flex: 1 }}>{j.name}</Text>
          <Text style={{ color: colors.textMuted }}>{j.panel}</Text>
          <View style={{ width: 120, marginLeft: 12 }}>
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
            styles.teamRow,
            { borderColor: colors.border, backgroundColor: colors.bgElevated },
          ]}
        >
          <Text style={{ color: colors.textMuted, width: 48 }}>{a.timeDisplay}</Text>
          <Text style={{ color: colors.text, flex: 1 }}>{a.text}</Text>
          <StatusChip status={a.type} label={a.type} />
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
})
