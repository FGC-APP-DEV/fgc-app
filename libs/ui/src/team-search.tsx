import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import {
  fetchTeams,
  filterTeams,
  flagEmoji,
  type FgcTeam,
  type FgcTeamsResult,
} from '@fgc/shared'
import { useI18n } from './i18n'
import {
  Body,
  Button,
  Card,
  Field,
  Heading,
  Loading,
  Notice,
  radius,
  tokens,
} from './operations'

function TeamRow({ team }: { team: FgcTeam }) {
  const { t } = useI18n()
  const flag = flagEmoji(team.iso2)
  return (
    <View
      accessible
      accessibilityLabel={`${team.name}, ${team.code}, ${t('teamsNumber', { number: team.teamKey })}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.surfaceLow,
      }}
    >
      <Text style={{ fontSize: 24, width: 32, textAlign: 'center' }}>{flag}</Text>
      <Text
        style={{
          fontFamily: 'InterBold',
          fontWeight: '700',
          fontSize: 16,
          minWidth: 48,
          color: tokens.text,
        }}
      >
        {team.code}
      </Text>
      <Text style={{ flex: 1, fontFamily: 'Inter', fontSize: 14, color: tokens.text }}>
        {team.name}
      </Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: tokens.muted }}>
        {t('teamsNumber', { number: team.teamKey })}
      </Text>
    </View>
  )
}

/**
 * Team lookup by country name or code. Nothing is listed until something is typed; the list is
 * loaded on first input (cached by the data module) and filtered in memory on every keystroke.
 */
export function TeamSearch({ title = true }: { title?: boolean }) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [data, setData] = useState<FgcTeamsResult | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // The list is requested on first input, so the landing page makes no call until it is used.
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (!started) return
    const controller = new AbortController()
    setFailed(false)
    fetchTeams({ signal: controller.signal, forceRefresh: attempt > 0 })
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [attempt, started])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const searching = query.trim().length > 0
  const matches = useMemo(
    () => (searching && data ? filterTeams(data.teams, query) : []),
    [searching, data, query],
  )
  return (
    <Card>
      {title && (
        <View style={{ gap: 6 }}>
          <Heading>{t('teamsTitle')}</Heading>
          <Body>{t('teamsSubtitle')}</Body>
        </View>
      )}
      <Field
        label={t('teamsSearchLabel')}
        icon="search"
        value={query}
        onChangeText={(value) => {
          setQuery(value)
          if (value.trim()) setStarted(true)
        }}
        placeholder={t('teamsSearchPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {failed && !data && (
        <>
          <Notice text={t('teamsLoadError')} error />
          <Button label={t('tryAgain')} onPress={retry} />
        </>
      )}
      {!failed && !data && searching && <Loading />}
      {data?.source === 'snapshot' && <Notice text={t('teamsSnapshotNotice')} />}
      {!searching && !failed && <Body>{t('teamsPrompt')}</Body>}
      {searching && data && (
        <View accessibilityLiveRegion="polite" style={{ gap: 10 }}>
          {matches.length === 0 ? (
            <Notice text={t('teamsNoResults', { query: query.trim() })} />
          ) : (
            <>
              <Text style={{ fontFamily: 'Inter', fontSize: 12, color: tokens.muted }}>
                {t('teamsResultCount', { count: matches.length })}
              </Text>
              {matches.map((team) => (
                <TeamRow key={team.teamKey} team={team} />
              ))}
            </>
          )}
        </View>
      )}
    </Card>
  )
}
