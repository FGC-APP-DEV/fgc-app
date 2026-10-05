import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { TeamAnnotations } from '@fgc/contracts'
import {
  Badge,
  Body,
  Button,
  Card,
  Field,
  Heading,
  Loading,
  Notice,
  Screen,
  layout,
  useI18n,
  useToast,
} from '@fgc/ui'

const MAX_VISIBLE = 20

/** Case-insensitive match on country, team name/official id or panel name; an empty term shows none. */
export function matchTeams(teams: readonly TeamAnnotations[], term: string) {
  const q = term.trim().toLowerCase()
  if (!q) return []
  return teams.filter((team) =>
    [team.country, team.teamName, team.officialId, team.panelName ?? ''].some((value) =>
      value.toLowerCase().includes(q),
    ),
  )
}

/**
 * Head referee page: every judge annotation for a team (read only) plus the head referee's own
 * "refs notes" topic, which the judges of the team's panel can read.
 */
export function RefereeNotesScreen() {
  const { api } = useAuth()
  const { t } = useI18n()
  const [teams, setTeams] = useState<TeamAnnotations[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const load = useCallback(async () => {
    try {
      setTeams(await api.get<TeamAnnotations[]>('/referee/annotations'))
      setError('')
    } catch {
      setError(t('refLoadError'))
    }
  }, [api, t])
  useEffect(() => {
    void load()
  }, [load])
  const matches = useMemo(() => matchTeams(teams ?? [], query), [teams, query])
  return (
    <Screen>
      <Heading>{t('refTitle')}</Heading>
      <Body>{t('refIntro')}</Body>
      {Boolean(error) && <Notice error text={error} />}
      <Field label={t('refSearch')} value={query} onChangeText={setQuery} />
      {teams === null && !error && <Loading />}
      {teams !== null && !query.trim() && <Notice text={t('refSearchHint')} />}
      {teams !== null && Boolean(query.trim()) && matches.length === 0 && (
        <Notice text={t('refNoMatch')} />
      )}
      {matches.slice(0, MAX_VISIBLE).map((team) => (
        <TeamRefereeCard key={team.teamId} team={team} onSaved={load} />
      ))}
    </Screen>
  )
}

function TeamRefereeCard({
  team,
  onSaved,
}: {
  team: TeamAnnotations
  onSaved(): Promise<void>
}) {
  const { api, user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const own = team.notes.find((n) => n.authorId === user?.id)
  const others = team.notes.filter((n) => n.authorId !== user?.id)
  const [text, setText] = useState(own?.text ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setText(own?.text ?? '')
  }, [own?.version, own?.text])
  const dirty = text !== (own?.text ?? '')
  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true)
    setError('')
    try {
      await work()
      toast.success(done)
      await onSaved()
    } catch {
      setError(t('refSaveError'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card title={`${team.officialId} · ${team.teamName}`}>
      <View style={layout.row}>
        <Badge label={team.country} />
        <Badge label={team.panelName ?? t('refNoPanel')} />
      </View>
      <Card title={t('refJudgeAnnotations')}>
        {team.observations.length === 0 && <Notice text={t('refNoAnnotations')} />}
        {team.observations.map((o) => (
          <Card key={o.id} title={o.authorName}>
            <Body>{o.text}</Body>
          </Card>
        ))}
      </Card>
      <Card title={t('refNotes')}>
        {others.map((n) => (
          <Card key={n.id} title={n.authorName}>
            <Body>{n.text}</Body>
          </Card>
        ))}
        <Field
          label={t('refYourNote')}
          multiline
          maxLength={10000}
          value={text}
          editable={!busy}
          onChangeText={setText}
        />
        {Boolean(error) && <Notice error text={error} />}
        <View style={layout.row}>
          <Button
            label={t('refSave')}
            disabled={busy || !dirty || !text.trim()}
            onPress={() =>
              void run(
                () =>
                  api.command(
                    `/referee/teams/${team.teamId}/note`,
                    { text, expectedVersion: own?.version ?? 0 },
                    { method: 'PUT' },
                  ),
                t('refSaved'),
              )
            }
          />
          {own && (
            <Button
              label={t('refDelete')}
              variant="danger"
              disabled={busy || dirty}
              onPress={() =>
                void run(
                  () =>
                    api.command(
                      `/referee/teams/${team.teamId}/note`,
                      { expectedVersion: own.version },
                      { method: 'DELETE' },
                    ),
                  t('refDeleted'),
                )
              }
            />
          )}
        </View>
      </Card>
    </Card>
  )
}

/** Read-only refs notes for the judges of a team's panel (and advisors). */
export function RefereeNotesPanel({ teamId }: { teamId: string }) {
  const { api } = useAuth()
  const { t } = useI18n()
  const [notes, setNotes] = useState<TeamAnnotations['notes'] | null>(null)
  useEffect(() => {
    let live = true
    setNotes(null)
    api
      .get<TeamAnnotations['notes']>(`/judging/teams/${teamId}/referee-notes`)
      .then((next) => live && setNotes(next))
      .catch(() => live && setNotes([]))
    return () => {
      live = false
    }
  }, [api, teamId])
  if (!notes?.length) return null
  return (
    <Card title={t('refNotesForJudges')}>
      {notes.map((n) => (
        <Card key={n.id} title={n.authorName}>
          <Body>{n.text}</Body>
        </Card>
      ))}
    </Card>
  )
}
