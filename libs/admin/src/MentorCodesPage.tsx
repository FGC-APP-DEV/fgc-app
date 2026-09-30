import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Team } from '@fgc/contracts'
import { sortTeams } from '@fgc/shared'
import {
  Body,
  Button,
  Card,
  Confirm,
  Field,
  Loading,
  Notice,
  layout,
  useToast,
  useToastOn,
} from '@fgc/ui'
import { paginate } from './lib/admin'

type Code = { teamId: string; version: number; expiresAt: string }

export function MentorCodesPage() {
  const { api } = useAuth()
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [codes, setCodes] = useState<Code[]>([])
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [page, setPage] = useState(1)
  const [regenerate, setRegenerate] = useState<Team | null>(null)
  const [confirmRefresh, setConfirmRefresh] = useState(false)
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  useToastOn(error, 'error')

  const load = async () => {
    try {
      const [allTeams, allCodes] = await Promise.all([
        api.list<Team>('/teams'),
        api.get<Code[]>('/admin/mentor-codes'),
      ])
      setTeams(sortTeams(allTeams, (t) => t))
      setCodes(allCodes)
    } catch (e) {
      setError((e as Error).message)
      setTeams((current) => current ?? [])
    }
  }
  useEffect(() => {
    void load()
  }, [api])

  const issue = async (team: Team) => {
    setBusy(true)
    setError('')
    setSecret('')
    try {
      const data = await api.command<{ code: string }>('/admin/mentor-codes', {
        teamId: team.id,
        expectedVersion: codes.find((c) => c.teamId === team.id)?.version ?? 0,
      })
      setSecret(`${team.name}: ${data.code}`)
      toast.success(`Access code issued for ${team.name}`)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const query = name.trim().toLowerCase()
  const cc = country.trim().toLowerCase()
  const filtered = (teams ?? []).filter(
    (t) =>
      (!query || `${t.officialId} ${t.name}`.toLowerCase().includes(query)) &&
      (!cc ||
        t.countryCode.toLowerCase().includes(cc) ||
        t.country.toLowerCase().includes(cc)),
  )
  const view = paginate(filtered, page)

  return (
    <View style={layout.stack}>
      <Card title="Mentor access codes">
        <Body>
          Codes and sessions last seven days. Regenerating revokes the previous code, all
          linked sessions and push devices.
        </Body>
        {Boolean(secret) && (
          <Notice text={`Copy this code now. It is shown only once. ${secret}`} />
        )}
        <Button
          label="Refresh access codes"
          variant="secondary"
          icon="refresh"
          onPress={() => setConfirmRefresh(true)}
        />
        <Field
          label="Filter by team name"
          icon="search"
          value={name}
          onChangeText={(value) => {
            setName(value)
            setPage(1)
          }}
        />
        <Field
          label="Filter by country (e.g. BR)"
          icon="search"
          autoCapitalize="characters"
          value={country}
          onChangeText={(value) => {
            setCountry(value)
            setPage(1)
          }}
        />
        {teams === null ? (
          <Loading />
        ) : (
          view.items.map((team) => {
            const has = codes.some((c) => c.teamId === team.id)
            return (
              <View key={team.id} style={layout.row}>
                <Body>{team.name}</Body>
                <Body>{team.countryCode}</Body>
                <Button
                  label={`${has ? 'Regenerate' : 'Issue'} code for ${team.name}`}
                  disabled={busy}
                  variant="secondary"
                  onPress={() => (has ? setRegenerate(team) : void issue(team))}
                />
              </View>
            )
          })
        )}
        {teams !== null && filtered.length === 0 && (
          <Notice text="No teams match these filters." />
        )}
        <View style={layout.row}>
          <Button
            label="Previous page"
            variant="secondary"
            disabled={view.page <= 1}
            onPress={() => setPage(view.page - 1)}
          />
          <Body>
            Page {view.page} of {view.pages} · {filtered.length} teams
          </Body>
          <Button
            label="Next page"
            variant="secondary"
            disabled={view.page >= view.pages}
            onPress={() => setPage(view.page + 1)}
          />
        </View>
      </Card>
      {confirmRefresh && (
        <Confirm
          title="Refresh access codes?"
          description="This reloads the list of teams and their current mentor code status from the server. No code is issued, regenerated or revoked, and existing mentor sessions keep working."
          confirmLabel="Refresh"
          onCancel={() => setConfirmRefresh(false)}
          onConfirm={() => {
            setConfirmRefresh(false)
            void load()
          }}
        />
      )}
      {regenerate && (
        <Confirm
          title="Issue a new mentor code?"
          description={`Previous sessions for ${regenerate.name} will stop working. The new code is shown once.`}
          onCancel={() => setRegenerate(null)}
          onConfirm={() => {
            const team = regenerate
            setRegenerate(null)
            void issue(team)
          }}
        />
      )}
    </View>
  )
}
