import React, { useEffect, useState } from 'react'
import { useAuth } from '@fgc/auth'
import { createNotificationAdapter } from '@fgc/notifications'
import { Button, Notice } from '@fgc/ui'

export function MentorNotifications({ onMessage }: { onMessage: () => void }) {
  const { api, installationId } = useAuth()
  const [adapter] = useState(createNotificationAdapter)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const unsubscribe = adapter.subscribe({ onEvent: onMessage })
    return () => {
      unsubscribe()
      adapter.dispose()
    }
  }, [adapter, onMessage])
  async function enable() {
    setBusy(true)
    try {
      const result = await adapter.registerDevice({
        installationId,
        register: async (value) => {
          await api.command(
            '/mentor/device',
            {
              installationId: value.installationId,
              token: value.expoPushToken,
              platform: value.platform,
              permission: value.permission,
            },
            { method: 'PUT' },
          )
        },
      })
      if (result.status === 'denied')
        await api.command('/mentor/device', { installationId }, { method: 'DELETE' })
      setStatus(
        result.status === 'registered'
          ? 'Notifications enabled.'
          : (result.reason ?? 'Keep this screen open to receive messages.'),
      )
    } catch {
      setStatus(
        'Notifications could not be enabled. Keep this screen open and try again.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      {status && <Notice text={status} />}
      <Button
        label="Enable notifications"
        disabled={busy || !installationId}
        variant="secondary"
        onPress={() => void enable()}
      />
    </>
  )
}
