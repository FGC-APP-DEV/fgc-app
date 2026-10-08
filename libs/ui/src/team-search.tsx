import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import {
  fetchTeams,
  filterTeams,
  flagEmoji,
  formatMatchTime,
  matchesForTeam,
  type FgcMatch,
  type FgcMatchTeam,
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

/** Above this many matching teams only the teams are listed, to keep the page readable. */
const MAX_TEAMS_WITH_MATCHES = 5

function Alliance({
  teams,
  side,
  highlight,
}: {
  teams: FgcMatchTeam[]
  side: 'red' | 'blue'
  highlight: number
}) {
  const { t } = useI18n()
  return (
    <View
      accessibilityLabel={`${t(side === 'red' ? 'matchRedAlliance' : 'matchBlueAlliance')}: ${teams
        .map((team) => team.code)
        .join(', ')}`}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 4,
        minHeight: 36,
        paddingHorizontal: 6,
        backgroundColor:
          side === 'red' ? 'rgba(220, 38, 38, 0.14)' : 'rgba(59, 130, 246, 0.16)',
      }}
    >
      {teams.map((team) => (
        <View
          key={team.teamKey}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={{ fontSize: 14 }}>{flagEmoji(team.iso2)}</Text>
          <Text
            style={{
              fontFamily: team.teamKey === highlight ? 'InterBold' : 'Inter',
              fontWeight: team.teamKey === highlight ? '700' : '400',
              fontSize: 13,
              color: tokens.text,
              textDecorationLine: team.teamKey === highlight ? 'underline' : 'none',
            }}
          >
            {team.code}
          </Text>
        </View>
      ))}
    </View>
  )
}

function MatchRow({ match, highlight }: { match: FgcMatch; highlight: number }) {
  const { t, locale } = useI18n()
  const when = formatMatchTime(match.scheduledTime, locale)
  const field = match.field === null ? '' : t('teamsField', { number: match.field })
  const label = {
    fontFamily: 'Inter',
    fontSize: 12,
    color: tokens.muted,
    textAlign: 'center',
  } as const
  return (
    <View
      accessible
      accessibilityLabel={[
        match.name,
        when ? `${when.day} ${when.time}` : '',
        field,
        `${t('matchRedAlliance')}: ${match.red.map((x) => x.code).join(', ')}`,
        `${t('matchBlueAlliance')}: ${match.blue.map((x) => x.code).join(', ')}`,
      ]
        .filter(Boolean)
        .join(', ')}
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.surfaceLow,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 68, justifyContent: 'center', padding: 6 }}>
        <Text style={label}>{match.name}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Alliance teams={match.red} side="red" highlight={highlight} />
        <Alliance teams={match.blue} side="blue" highlight={highlight} />
      </View>
      <View style={{ width: 76, justifyContent: 'center', padding: 6, gap: 2 }}>
        {when && <Text style={label}>{`${when.day}, ${when.time}`}</Text>}
        {!!field && <Text style={label}>{field}</Text>}
        {match.played && match.redScore !== null && match.blueScore !== null && (
          <Text style={[label, { color: tokens.text, fontWeight: '700' }]}>
            {`${match.redScore} – ${match.blueScore}`}
          </Text>
        )}
      </View>
    </View>
  )
}

function TeamResult({ team, matches }: { team: FgcTeam; matches: FgcMatch[] | null }) {
  const { t } = useI18n()
  return (
    <View style={{ gap: 8 }}>
      <TeamRow team={team} />
      {matches &&
        (matches.length === 0 ? (
          <Body>{t('teamsNoMatches')}</Body>
        ) : (
          matches.map((match) => (
            <MatchRow key={match.key} match={match} highlight={team.teamKey} />
          ))
        ))}
    </View>
  )
}

/**
 * Team lookup by country name or code. Nothing is listed until something is typed; the list is
 * loaded when a search starts (cached by the data module) and filtered in memory on every keystroke.
 */
export function TeamSearch({ title = true }: { title?: boolean }) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [data, setData] = useState<FgcTeamsResult | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const searching = query.trim().length > 0
  // Requested when a search starts (never on page load); the data module's cache makes repeats free.
  useEffect(() => {
    if (!searching) return
    const controller = new AbortController()
    setFailed(false)
    fetchTeams({ signal: controller.signal, forceRefresh: attempt > 0 })
      .then(setData)
      .catch(() => {
        if (controller.signal.aborted) return
        // Never keep showing an earlier schedule as if it were current after a failed refresh.
        setData(null)
        setFailed(true)
      })
    return () => controller.abort()
  }, [attempt, searching])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
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
        onChangeText={setQuery}
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
              {matches.length > MAX_TEAMS_WITH_MATCHES && <Body>{t('teamsRefine')}</Body>}
              {matches.map((team) => (
                <TeamResult
                  key={team.teamKey}
                  team={team}
                  matches={
                    matches.length > MAX_TEAMS_WITH_MATCHES
                      ? null
                      : matchesForTeam(data.matches, team.teamKey)
                  }
                />
              ))}
            </>
          )}
        </View>
      )}
    </Card>
  )
}
