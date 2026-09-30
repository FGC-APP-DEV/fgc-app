import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import {
  Button,
  Card,
  Notice,
  OFFICIAL_INFORMATION_URL,
  layout,
  openOfficialInformation,
  radius,
  tokens,
} from './operations'
import { useI18n } from './i18n'
import { EVENT_LOAD_TIMEOUT_MS } from './event-frame'

/**
 * Official event page in an iframe (web). A cross-origin page cannot tell us whether the embed
 * was blocked (X-Frame-Options / frame-ancestors) and the browser still fires `load` for its
 * own error page, so failure cannot be detected reliably. The frame is therefore always
 * followed by a footer with "Open in browser" and "Reload"; a frame that never loads (or fires
 * `error`) additionally shows an error notice.
 */
export function EventFrame() {
  const { t } = useI18n()
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (loaded || failed) return
    const timer = setTimeout(() => setFailed(true), EVENT_LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [attempt, loaded, failed])
  const reload = () => {
    setLoaded(false)
    setFailed(false)
    setAttempt((n) => n + 1)
  }
  return (
    <Card title={t('eventInformation')}>
      {failed ? (
        <View style={layout.stack}>
          <Notice error text={t('eventLoadError')} />
          <View style={layout.row}>
            <Button label={t('tryAgain')} onPress={reload} />
          </View>
        </View>
      ) : (
        <View
          style={{
            width: '100%',
            height: 640,
            minHeight: 320,
            maxHeight: '75vh' as unknown as number,
            borderRadius: radius.tile,
            borderWidth: 1,
            borderColor: tokens.border,
            backgroundColor: tokens.surface,
            overflow: 'hidden',
          }}
        >
          {React.createElement('iframe', {
            key: attempt,
            src: OFFICIAL_INFORMATION_URL,
            title: 'Official FGC event page',
            loading: 'lazy',
            referrerPolicy: 'no-referrer',
            onLoad: () => setLoaded(true),
            onError: () => setFailed(true),
            style: { width: '100%', height: '100%', border: 0 },
          })}
        </View>
      )}
      <View style={[layout.row, { justifyContent: 'space-between' }]}>
        <Text style={[layout.muted, { flexShrink: 1 }]}>{t('eventNotLoadingHint')}</Text>
        <View style={layout.row}>
          <Button label={t('reload')} variant="secondary" onPress={reload} />
          <Button
            label={t('openInBrowser')}
            variant="secondary"
            onPress={openOfficialInformation}
          />
        </View>
      </View>
    </Card>
  )
}
