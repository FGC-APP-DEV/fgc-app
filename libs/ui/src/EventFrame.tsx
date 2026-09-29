import React, { useEffect, useState } from 'react'
import { Linking, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { Button, Card, Loading, Notice, layout } from './operations'
import { EVENT_ERROR_MESSAGE, EVENT_LOAD_TIMEOUT_MS, EVENT_PAGE_URL } from './event-frame'

/** Official event page in a WebView (native). Load, HTTP and timeout failures show an error. */
export function EventFrame() {
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
    <Card title="Event information">
      {failed ? (
        <View style={layout.stack}>
          <Notice error text={EVENT_ERROR_MESSAGE} />
          <View style={layout.row}>
            <Button label="Try again" onPress={retry} />
            <Button
              label="Open in browser"
              variant="secondary"
              onPress={() => void Linking.openURL(EVENT_PAGE_URL)}
            />
          </View>
        </View>
      ) : (
        <View style={{ width: '100%', height: 600 }}>
          <WebView
            key={attempt}
            source={{ uri: EVENT_PAGE_URL }}
            originWhitelist={['https://*']}
            nestedScrollEnabled
            startInLoadingState
            renderLoading={() => <Loading />}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            onHttpError={() => setFailed(true)}
            style={{ flex: 1, borderRadius: 8 }}
            accessibilityLabel="Official FGC event page"
          />
        </View>
      )}
    </Card>
  )
}
