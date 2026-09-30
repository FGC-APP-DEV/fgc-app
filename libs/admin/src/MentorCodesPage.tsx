import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Team } from '@fgc/contracts'
import { sortTeams } from '@fgc/shared'
import {
  ActionModal,
  Body,
  Button,
  Card,
  DataTable,
  Field,
  Notice,
  layout,
  type Column,
} from '@fgc/ui'

type Code = { teamId: string; version: number; expiresAt: string }

export function MentorCodesPage() {
  const { api } = useAuth()
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [codes, setCodes] = useState<Code[]>([])
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [acting, setActing] = useState<Team | null>(null)
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
  const codeOf = (team: Team) => codes.find((c) => c.teamId === team.id)
  const columns: Column<Team>[] = [
    { key: 'team', title: 'Team', flex: 3, render: (t) => t.name },
    { key: 'country', title: 'Country', render: (t) => t.countryCode },
    {
      key: 'code',
      title: 'Code',
      flex: 2,
      render: (t) => (codeOf(t) ? 'Active' : 'Not issued'),
    },
  ]
  const has = acting ? Boolean(codeOf(acting)) : false

  return (
    <View style={layout.stack}>
      {Boolean(error) && <Notice text={error} error />}
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
          onPress={() => void load()}
        />
        <Field
          label="Filter by team name"
          icon="search"
          value={name}
          onChangeText={setName}
        />
        <Field
          label="Filter by country (e.g. BR)"
          icon="search"
          autoCapitalize="characters"
          value={country}
          onChangeText={setCountry}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          noun="teams"
          loading={teams === null}
          empty="No teams match these filters."
          resetKey={`${name}|${country}`}
          rowActionLabel={(t) => `Actions for ${t.name}`}
          onRowAction={setActing}
        />
      </Card>
      {acting && (
        <ActionModal
          title={`Mentor code for ${acting.name}`}
          onClose={() => setActing(null)}
          confirmLabel={has ? 'Regenerate code' : 'Issue code'}
          confirmDisabled={busy}
          onConfirm={() => {
            const team = acting
            setActing(null)
            void issue(team)
          }}
        >
          <Body>
            {has
              ? `Previous sessions for ${acting.name} will stop working. The new code is shown once.`
              : `Issue a mentor code for ${acting.name}. The code is shown once.`}
          </Body>
        </ActionModal>
      )}
    </View>
  )
}
