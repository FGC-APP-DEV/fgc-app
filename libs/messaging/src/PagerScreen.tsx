import {
  MENTOR_RESPONSE_KEYS,
  countryName,
  sortTeams,
  type ShellMessageKey,
} from '@fgc/shared'
import { createPageAttempt } from './page-attempt'
import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import { pagerPresets, type Page, type PageSource, type Team } from '@fgc/contracts'
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
} from '@fgc/ui'

const deliveryKeys: Record<string, ShellMessageKey> = {
  scheduled: 'deliveryScheduled',
  queued: 'deliveryQueued',
  accepted: 'deliveryAccepted',
  failed: 'deliveryFailed',
  cancelled: 'deliveryCancelled',
  responded: 'deliveryResponded',
  no_devices: 'deliveryNoDevices',
}
export function PagerScreen({
  source,
  initialTeamId,
  onBack,
}: {
  source: PageSource
  initialTeamId?: string
  onBack: () => void
}) {
  const { api } = useAuth()
  const { t, locale } = useI18n()
  const [teams, setTeams] = useState<Team[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const [pages, setPages] = useState<Page[]>([])
  const [teamId, setTeam] = useState(initialTeamId ?? '')
  const [changing, setChanging] = useState(!initialTeamId)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [minutes, setMinutes] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const attemptRef = useRef<ReturnType<typeof createPageAttempt> | null>(null)
  const [sent, setSent] = useState(false)
  const load = async () => {
    try {
      const [all, history] = await Promise.all([
        api.list<Team>('/teams'),
        api.list<Page>(`/pages?sourceArea=${source}`),
      ])
      setTeams(sortTeams(all, (t) => t))
      setPages(history)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoaded(true)
    }
  }
  useEffect(() => {
    void load()
  }, [api, source])
  const edit = (fn: () => void) => {
    fn()
    attemptRef.current = null
    setSent(false)
  }
  const submit = async () => {
    setBusy(true)
    setError('')
    const attempt =
      attemptRef.current ??
      createPageAttempt({ teamId, source, message, minutes }, api.newKey())
    attemptRef.current = attempt
    try {
      if (Date.now() - attempt.createdAt >= 86400000) throw new Error(t('pagerExpired'))
      await api.command('/pages', attempt.body, { key: attempt.key })
      setMessage('')
      attemptRef.current = null
      setSent(true)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const selectedTeam = teams.find((t) => t.id === teamId)
  const shownPages = pages.filter((page) =>
    (teams.find((t) => t.id === page.teamId)?.name ?? '')
      .toLowerCase()
      .includes(historySearch.trim().toLowerCase()),
  )
  return (
    <Screen>
      <Button label={t('back')} variant="secondary" onPress={onBack} />
      <Heading>{t('pagerTitle')}</Heading>
      <Body>{t('pagerIntro')}</Body>
      {error && <Notice text={error} error />}
      {sent && <Notice text={t('pagerRecorded')} />}
      <Card title={t('pagerNewMessage')}>
        {selectedTeam && !changing && (
          <View style={layout.row}>
            <Badge
              label={t('pagerTo', {
                team: `${selectedTeam.officialId} · ${selectedTeam.name}`,
              })}
            />
            <Button
              label={t('pagerChangeTeam')}
              variant="secondary"
              onPress={() => setChanging(true)}
            />
          </View>
        )}
        {(changing || !selectedTeam) && (
          <Field
            label={t('pagerFindTeam')}
            icon="search"
            value={search}
            onChangeText={setSearch}
          />
        )}
        <View style={layout.row}>
          {(changing || !selectedTeam ? teams : [])
            .filter((t) =>
              `${t.officialId} ${t.name} ${t.country} ${countryName(t.country)}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .slice(0, 25)
            .map((t) => (
              <Button
                key={t.id}
                label={`${t.officialId} · ${t.name}`}
                variant={teamId === t.id ? 'primary' : 'secondary'}
                onPress={() => {
                  edit(() => setTeam(t.id))
                  setChanging(false)
                }}
              />
            ))}
        </View>
        <View style={layout.stack}>
          {pagerPresets[source].map((preset) => (
            <Button
              key={preset}
              label={preset}
              variant="secondary"
              onPress={() => edit(() => setMessage(preset))}
            />
          ))}
        </View>
        <Field
          label={t('pagerMessageLabel')}
          multiline
          maxLength={500}
          value={message}
          onChangeText={(v) => edit(() => setMessage(v))}
        />
        <View style={layout.row}>
          {[0, source === 'judges' ? 15 : 10, 30, 60].map((offset) => (
            <Button
              key={offset}
              label={
                offset ? t('pagerInMinutes', { minutes: offset }) : t('pagerSendNow')
              }
              variant={minutes === offset ? 'primary' : 'secondary'}
              onPress={() => edit(() => setMinutes(offset))}
            />
          ))}
        </View>
        <Button
          label={busy ? t('pagerSending') : t('pagerSend')}
          disabled={busy || !teamId || !message.trim()}
          onPress={() => void submit()}
        />
      </Card>
      <Heading>{t('pagerHistory')}</Heading>
      <Button
        label={t('pagerRefreshMessages')}
        variant="secondary"
        onPress={() => void load()}
      />
      <Field
        label={t('pagerFilter')}
        icon="search"
        value={historySearch}
        onChangeText={setHistorySearch}
      />
      {!loaded ? (
        <Loading />
      ) : !shownPages.length ? (
        <Notice text={pages.length ? t('pagerNoMatch') : t('pagerNoMessages')} />
      ) : (
        shownPages.map((page) => (
          <Card
            key={page.id}
            title={
              teams.find((t) => t.id === page.teamId)?.name ?? t('pagerTeamFallback')
            }
            accent={page.response ? 'success' : 'warning'}
          >
            <Body>{page.message}</Body>
            <Badge
              label={
                page.response
                  ? MENTOR_RESPONSE_KEYS[page.response]
                    ? t(MENTOR_RESPONSE_KEYS[page.response])
                    : page.response
                  : page.scheduledFor && Date.parse(page.scheduledFor) > Date.now()
                    ? t('pagerScheduled')
                    : t('pagerAwaiting')
              }
            />
            {page.deliveryStatus && (
              <Body>
                {deliveryKeys[page.deliveryStatus]
                  ? t(deliveryKeys[page.deliveryStatus])
                  : t('deliveryUnknown')}
              </Body>
            )}
            <Body>
              {page.response
                ? t('pagerResponded', {
                    date: new Date(page.respondedAt ?? page.createdAt).toLocaleString(
                      locale,
                    ),
                  })
                : t('pagerAvailable', {
                    date: new Date(page.scheduledFor ?? page.createdAt).toLocaleString(
                      locale,
                    ),
                  })}
            </Body>
          </Card>
        ))
      )}
    </Screen>
  )
}
