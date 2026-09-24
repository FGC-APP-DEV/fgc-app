import React, { useEffect, useState } from 'react'
import { AppState, View } from 'react-native'
import { useAuth } from '@fgc/auth'
import { mentorResponses, type Page } from '@fgc/contracts'
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

export function MentorScreen({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const { api, mentor } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [shots, setShots] = useState<
    { templateId: string; name: string; status: string }[]
  >([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
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
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy('')
    }
  }
  return (
    <Screen>
      <Heading>{mentor?.team.name ?? 'Team messages'}</Heading>
      <Body>Messages and filming status for your team.</Body>
      <Button label="Refresh" variant="secondary" onPress={() => void refresh()} />
      {error && <Notice text={error} error />}
      {!pages.length && <Notice text="No messages for your team." />}
      {pages.map((page) => (
        <Card
          key={page.id}
          title={page.sourceArea === 'judges' ? 'Judging message' : 'Filming message'}
          emphasis={page.response ? undefined : 'danger'}
          accent={page.response ? 'success' : undefined}
        >
          <Body>{page.message}</Body>
          <Badge label={page.response ?? 'Response requested'} />
          {!page.response && (
            <View style={[layout.row, { alignItems: 'stretch', gap: 12 }]}>
              {mentorResponses.map((response) => (
                <ActionTile
                  key={response}
                  label={response}
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
      <Card title="Filming checklist">
        {!shots.length && <Notice text="No filming checklist is configured yet." />}
        {shots.map((shot) => (
          <View key={shot.templateId} style={layout.row}>
            <Body>{shot.name}</Body>
            <Badge label={shot.status} />
          </View>
        ))}
      </Card>
    </Screen>
  )
}
