import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Role, Team, User } from '@fgc/contracts'
import {
  Body,
  Button,
  Card,
  Confirm,
  Field,
  Heading,
  Notice,
  Screen,
  layout,
} from '@fgc/ui'

export function AdminScreen({ onImports }: { onImports: () => void }) {
  const { api } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [codes, setCodes] = useState<
    { teamId: string; version: number; expiresAt: string }[]
  >([])
  const [emails, setEmails] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [mode, setMode] = useState<'add' | 'replace'>('add')
  const [editing, setEditing] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [regenerate, setRegenerate] = useState<Team | null>(null)
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)
  const load = async () => {
    try {
      const [allUsers, allTeams, allCodes] = await Promise.all([
        api.list<User>('/admin/users'),
        api.list<Team>('/teams'),
        api.get<typeof codes>('/admin/mentor-codes'),
      ])
      setUsers(allUsers)
      setTeams(allTeams)
      setCodes(allCodes)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    void load()
  }, [api])
  const grant = async () => {
    setBusy(true)
    setError('')
    try {
      const results: { email: string; error?: string }[] = []
      for (const email of [
        ...new Set(
          emails
            .split(/[\s,;]+/)
            .filter(Boolean)
            .map((value) => value.toLowerCase()),
        ),
      ]) {
        const expectedVersion =
          users.find((user) => user.email.toLowerCase() === email)?.version ?? 0
        results.push(
          ...(await api.command<{ email: string; error?: string }[]>('/admin/access', {
            emails: [email],
            roles,
            mode,
            expectedVersion,
          })),
        )
      }
      setResult(
        results.map((row) => `${row.email}: ${row.error ?? 'Access updated'}`).join('\n'),
      )
      if (results.every((r) => !r.error)) {
        setEmails('')
        setEditing(null)
      }
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
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
  return (
    <Screen>
      <Heading>Administration</Heading>
      <Body>
        Manage access and the shared team register. Judging content is private to judges
        and advisors.
      </Body>
      {error && <Notice text={error} error />}
      <Button
        label="Refresh access and codes"
        variant="secondary"
        onPress={() => void load()}
      />
      <Button label="Import teams" onPress={onImports} />
      <Card
        title={
          editing
            ? `Edit access for ${editing.name ?? editing.email}`
            : 'Approve staff access'
        }
      >
        <Field
          label="Email addresses (comma or line separated)"
          multiline
          value={emails}
          onChangeText={setEmails}
          autoCapitalize="none"
        />
        <View style={layout.row}>
          {(['admin', 'judge', 'judgeAdvisor', 'filmmaker'] as Role[]).map((role) => (
            <Button
              key={role}
              label={role}
              variant={roles.includes(role) ? 'primary' : 'secondary'}
              onPress={() =>
                setRoles(
                  roles.includes(role)
                    ? roles.filter((r) => r !== role)
                    : [...roles, role],
                )
              }
            />
          ))}
        </View>
        <View style={layout.row}>
          <Button
            label="Add roles"
            variant={mode === 'add' ? 'primary' : 'secondary'}
            onPress={() => setMode('add')}
          />
          <Button
            label="Replace roles"
            variant={mode === 'replace' ? 'primary' : 'secondary'}
            onPress={() => setMode('replace')}
          />
        </View>
        <Body>
          Replace with no roles removes access. Admin and judging roles cannot be
          combined.
        </Body>
        <Button
          label="Save access"
          disabled={busy || !emails.trim()}
          onPress={() => void grant()}
        />
        {result && <Notice text={result} />}
      </Card>
      <Card title="Current users">
        {users.length ? (
          users.map((u) => (
            <View key={u.id} style={layout.stack}>
              <Body>
                {u.name ?? u.email} · {u.roles.join(', ') || 'No access'}
              </Body>
              <Button
                label={`Edit ${u.email}`}
                variant="secondary"
                onPress={() => {
                  setEditing(u)
                  setEmails(u.email)
                  setRoles(u.roles)
                  setMode('replace')
                }}
              />
            </View>
          ))
        ) : (
          <Notice text="No users have signed in yet." />
        )}
      </Card>
      <Card title="Mentor access codes">
        <Body>
          Codes and sessions last seven days. Regenerating revokes the previous code, all
          linked sessions and push devices.
        </Body>
        {secret && (
          <Notice text={`Copy this code now. It is shown only once. ${secret}`} />
        )}
        <Field
          label="Find team for mentor code"
          value={search}
          onChangeText={setSearch}
        />
        {teams
          .filter((t) =>
            `${t.officialId} ${t.name}`.toLowerCase().includes(search.toLowerCase()),
          )
          .map((team) => (
            <View key={team.id} style={layout.row}>
              <Body>{team.name}</Body>
              <Button
                label={`${codes.some((c) => c.teamId === team.id) ? 'Regenerate' : 'Issue'} code for ${team.name}`}
                disabled={busy}
                variant="secondary"
                onPress={() => setRegenerate(team)}
              />
            </View>
          ))}
      </Card>
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
    </Screen>
  )
}
