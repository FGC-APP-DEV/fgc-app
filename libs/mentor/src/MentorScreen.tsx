import React, { useEffect, useState } from 'react'
import { AppState, View } from 'react-native'
import { useAuth } from '@fgc/auth'
import { mentorResponses, type Page } from '@fgc/contracts'
import { MENTOR_RESPONSE_KEYS, type ShellMessageKey } from '@fgc/shared'
import {
  ActionTile,
  Badge,
  Body,
  Button,
  Card,
  Heading,
  Notice,
  Screen,
  layout,
  useI18n,
  useToast,
  useToastOn,
  type IconName,
} from '@fgc/ui'

const responseTile: Record<
  (typeof mentorResponses)[number],
  { icon: IconName; tone: 'success' | 'warning' | 'danger' }
> = {
  'On our way': { icon: 'user', tone: 'success' },
  'ETA ~10 min': { icon: 'clock', tone: 'warning' },
  "Can't come now": { icon: 'alertTriangle', tone: 'danger' },
}

const statusKey: Record<string, ShellMessageKey> = {
  pending: 'statusPending',
  captured: 'statusCaptured',
  skipped: 'statusSkipped',
}

export function MentorScreen({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const { api, mentor } = useAuth()
  const { t } = useI18n()
  // The stored response is the English contract value; it is shown in the active language.
  const responseLabels = Object.fromEntries(
    mentorResponses.map((value) => [value, t(MENTOR_RESPONSE_KEYS[value])]),
  ) as Record<string, string>
  const statusLabel = (status: string) =>
    statusKey[status] ? t(statusKey[status]) : status
  const [pages, setPages] = useState<Page[]>([])
  const [shots, setShots] = useState<
    { templateId: string; name: string; status: string }[]
  >([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const toast = useToast()
  useToastOn(error, 'error')
  const refresh = async () => {
    try {
      const [messages, filming] = await Promise.all([
        api.list<Page>('/mentor/pages'),
        api.get<typeof shots>('/mentor/filming'),
      ])
      setPages(messages)
      setShots(filming)
      setError('')
    } catch (e) {
      setPages([])
      setShots([])
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refresh()
    }, 20000)
    const listener = AppState.addEventListener('change', (value) => {
      if (value === 'active') void refresh()
    })
    return () => {
      clearInterval(timer)
      listener.remove()
    }
  }, [api, refreshSignal])
  const respond = async (page: Page, response: (typeof mentorResponses)[number]) => {
    setBusy(page.id)
    try {
      await api.command(`/mentor/pages/${page.id}/respond`, {
        response,
        expectedVersion: page.version,
      })
      toast.success(
        t('mentorResponseSent', { response: t(MENTOR_RESPONSE_KEYS[response]) }),
      )
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy('')
    }
  }
  return (
    <Screen>
      <Heading>{mentor?.team.name ?? t('mentorTeamMessages')}</Heading>
      <Body>{t('mentorIntro')}</Body>
      <Button label={t('refresh')} variant="secondary" onPress={() => void refresh()} />
      {!pages.length && <Notice text={t('mentorNoMessages')} />}
      {pages.map((page) => (
        <Card
          key={page.id}
          title={
            page.sourceArea === 'judges'
              ? t('mentorJudgingMessage')
              : t('mentorFilmingMessage')
          }
          emphasis={page.response ? undefined : 'danger'}
          accent={page.response ? 'success' : undefined}
        >
          <Body>{page.message}</Body>
          <Badge
            label={
              page.response
                ? (responseLabels[page.response] ?? page.response)
                : t('mentorResponseRequested')
            }
          />
          {!page.response && (
            <View style={[layout.row, { alignItems: 'stretch', gap: 12 }]}>
              {mentorResponses.map((response) => (
                <ActionTile
                  key={response}
                  label={t(MENTOR_RESPONSE_KEYS[response])}
                  icon={responseTile[response].icon}
                  tone={responseTile[response].tone}
                  disabled={busy === page.id}
                  onPress={() => void respond(page, response)}
                />
              ))}
            </View>
          )}
        </Card>
      ))}
      <Card title={t('mentorChecklist')}>
        {!shots.length && <Notice text={t('mentorNoChecklist')} />}
        {shots.map((shot) => (
          <View key={shot.templateId} style={layout.row}>
            <Body>{shot.name}</Body>
            <Badge label={statusLabel(shot.status)} />
          </View>
        ))}
      </Card>
    </Screen>
  )
}
