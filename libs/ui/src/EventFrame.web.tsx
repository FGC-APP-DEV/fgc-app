import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Button, Card, Notice, layout } from './operations'
import { EVENT_ERROR_MESSAGE, EVENT_LOAD_TIMEOUT_MS, EVENT_PAGE_URL } from './event-frame'

/** Official event page in an iframe (web). Cross-origin frames expose no load errors, so a
 * frame that never fires `load` (blocked, offline, refused) is reported after a timeout. */
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
              onPress={() => window.open(EVENT_PAGE_URL, '_blank', 'noopener,noreferrer')}
            />
          </View>
        </View>
      ) : (
        <View
          style={{ width: '100%', height: 640, maxHeight: '75vh' as unknown as number }}
        >
          {React.createElement('iframe', {
            key: attempt,
            src: EVENT_PAGE_URL,
            title: 'Official FGC event page',
            loading: 'lazy',
            referrerPolicy: 'no-referrer',
            onLoad: () => setLoaded(true),
            onError: () => setFailed(true),
            style: { width: '100%', height: '100%', border: 0, borderRadius: 8 },
          })}
        </View>
      )}
    </Card>
  )
}
