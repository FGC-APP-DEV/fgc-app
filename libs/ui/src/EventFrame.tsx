import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { WebView } from 'react-native-webview'
import {
  Button,
  Card,
  Loading,
  Notice,
  OFFICIAL_INFORMATION_URL,
  layout,
  openOfficialInformation,
  radius,
  tokens,
} from './operations'
import { useI18n } from './i18n'
import { EVENT_LOAD_TIMEOUT_MS } from './event-frame'

/** Official event page in a WebView (native). Load, HTTP and timeout failures show an error. */
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
  const retry = () => {
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
            <Button label={t('tryAgain')} onPress={retry} />
            <Button
              label={t('openInBrowser')}
              variant="secondary"
              onPress={openOfficialInformation}
            />
          </View>
        </View>
      ) : (
        <View
          style={{
            width: '100%',
            height: 600,
            borderRadius: radius.tile,
            borderWidth: 1,
            borderColor: tokens.border,
            backgroundColor: tokens.surface,
            overflow: 'hidden',
          }}
        >
          <WebView
            key={attempt}
            source={{ uri: OFFICIAL_INFORMATION_URL }}
            originWhitelist={['https://*']}
            nestedScrollEnabled
            startInLoadingState
            renderLoading={() => <Loading />}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            onHttpError={() => setFailed(true)}
            style={{ flex: 1, backgroundColor: tokens.surface }}
            accessibilityLabel="Official FGC event page"
          />
        </View>
      )}
    </Card>
  )
}
