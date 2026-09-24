import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, Notice, layout } from './operations'

interface MockInfo {
  code: string
  accounts: { email: string; roles: string[]; note: string }[]
  mentorCodes: { official: string; code: string }[]
}

/**
 * Development-only quick sign-in for the mock API (`npm run dev:mock`).
 * Renders nothing unless `infoUrl` is provided, so production builds never show it.
 */
export function MockAccounts({
  infoUrl,
  disabled,
  onStaff,
  onMentor,
}: {
  infoUrl?: string
  disabled?: boolean
  onStaff: (email: string, code: string) => void
  onMentor: (code: string) => void
}) {
  const [info, setInfo] = useState<MockInfo | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!infoUrl) return
    let live = true
    fetch(infoUrl)
      .then((r) => (r.ok ? (r.json() as Promise<MockInfo>) : Promise.reject(new Error())))
      .then((value) => live && setInfo(value))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [infoUrl])
  if (!infoUrl) return null
  return (
    <Card title="Mock accounts (development only)">
      <Body>Synthetic data. Tap an account to sign in instantly.</Body>
      {failed && <Notice error text="The mock API is not reachable." />}
      {info?.accounts.map((a) => (
        <View key={a.email} style={layout.row}>
          <Button
            label={`${a.email} · ${a.roles.join(' + ')}`}
            variant="secondary"
            disabled={disabled}
            onPress={() => onStaff(a.email, info.code)}
          />
        </View>
      ))}
      {info?.mentorCodes.map((m) => (
        <Button
          key={m.code}
          label={`Mentor of team ${m.official} · ${m.code}`}
          variant="secondary"
          disabled={disabled}
          onPress={() => onMentor(m.code)}
        />
      ))}
    </Card>
  )
}
