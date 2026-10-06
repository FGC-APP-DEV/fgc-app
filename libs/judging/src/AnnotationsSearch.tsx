import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { CountryAnnotations } from '@fgc/contracts'
import {
  Badge,
  Body,
  Button,
  Card,
  Field,
  Loading,
  Notice,
  layout,
  useI18n,
} from '@fgc/ui'

const DEBOUNCE_MS = 350

/**
 * Cross-panel annotations dashboard: shows nothing but the filter until a search is made, then lists
 * the matching countries (by code/name) or every country of a matching panel. Opening a country
 * shows all annotations written about it by any panel.
 */
export function AnnotationsSearch() {
  const { api } = useAuth()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CountryAnnotations[]>([])
  const [searched, setSearched] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [opened, setOpened] = useState<string | null>(null)
  const latest = useRef('')
  const term = query.trim()
  useEffect(() => {
    latest.current = term
    setOpened(null)
    if (!term) {
      setResults([])
      setSearched('')
      setError('')
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      api
        .get<CountryAnnotations[]>(
          `/judging/annotations?search=${encodeURIComponent(term)}`,
        )
        .then((next) => {
          if (latest.current !== term) return
          setResults(next)
          setSearched(term)
          setError('')
        })
        .catch(() => {
          if (latest.current === term) setError(t('jdAnnLoadError'))
        })
        .finally(() => {
          if (latest.current === term) setLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [api, term, t])
  return (
    <>
      <Field
        label={t('jdAnnSearch')}
        icon="search"
        value={query}
        maxLength={100}
        autoCapitalize="none"
        onChangeText={setQuery}
      />
      {!term && <Notice text={t('jdAnnInstructions')} />}
      {Boolean(error) && <Notice error text={error} />}
      {loading && <Loading />}
      {!loading && Boolean(term) && !error && searched === term && !results.length && (
        <Notice text={t('jdAnnNoResults')} />
      )}
      {Boolean(term) &&
        searched === term &&
        results.map((r) => {
          const open = opened === r.teamId
          return (
            <Card key={r.teamId} title={`${r.officialId} · ${r.teamName}`}>
              <Body>
                {r.country} · {r.panelName}
              </Body>
              <View style={layout.row}>
                <Badge label={t('jdAnnCount', { count: r.observations.length })} />
              </View>
              <Button
                label={open ? t('jdAnnHide') : t('jdAnnOpen', { country: r.country })}
                variant={open ? 'secondary' : 'primary'}
                onPress={() => setOpened(open ? null : r.teamId)}
              />
              {open && (
                <Card title={t('jdAnnAll')}>
                  {!r.observations.length && <Notice text={t('jdAnnNone')} />}
                  {r.observations.map((o) => (
                    <Card key={o.id} title={`${o.authorName} · ${o.panelName}`}>
                      <Body>{o.text}</Body>
                    </Card>
                  ))}
                </Card>
              )}
            </Card>
          )
        })}
    </>
  )
}
