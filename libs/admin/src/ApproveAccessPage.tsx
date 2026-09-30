import React, { useState } from 'react'
import { useAuth } from '@fgc/auth'
import type { User } from '@fgc/contracts'
import { Body, Button, Card, Field, Notice } from '@fgc/ui'
import { parseAccessCsv } from './lib/admin'

export function ApproveAccessPage() {
  const { api } = useAuth()
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    setResult('')
    const rows = parseAccessCsv(text)
    if (!rows.length) return
    const invalid = rows.filter((row) => row.error)
    if (invalid.length) {
      setError(invalid.map((row) => `Line ${row.line}: ${row.error}`).join('\n'))
      return
    }
    setBusy(true)
    try {
      const users = await api.list<User>('/admin/users')
      const lines: string[] = []
      const failed: string[] = []
      // The last line wins when an email is repeated.
      const byEmail = new Map(rows.map((row) => [row.email, row]))
      for (const row of byEmail.values()) {
        const expectedVersion =
          users.find((u) => u.email.toLowerCase() === row.email)?.version ?? 0
        const [receipt] = await api.command<{ email: string; error?: string }[]>(
          '/admin/access',
          { emails: [row.email], roles: row.roles, mode: 'add', expectedVersion },
        )
        lines.push(
          `${row.email}: ${receipt?.error ?? `Access added (${row.roles.join(', ')})`}`,
        )
        if (receipt?.error) failed.push(row.email)
      }
      setResult(lines.join('\n'))
      // Keep only the rows that failed so they can be corrected and resent.
      setText(
        rows
          .filter((row) => failed.includes(row.email))
          .map(formatRow)
          .join('\n'),
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card title="Approve staff access">
      <Body>
        One person per line: email, then roles separated by commas. Example:
        {'\n'}ada@example.org, admin{'\n'}sam@example.org, [filmmaker, judge]{'\n'}
        Roles: admin, judge, judgeAdvisor, filmmaker. Roles are added to any the person
        already has; edit or remove roles from Current users.
      </Body>
      <Field
        label="Access list (CSV: email, roles)"
        multiline
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        placeholder="email@example.org, filmmaker"
      />
      {error && <Notice text={error} error />}
      <Button
        label="Save access"
        disabled={busy || !text.trim()}
        onPress={() => void submit()}
      />
      {result && <Notice text={result} />}
    </Card>
  )
}

const formatRow = (row: { email: string; roles: string[] }) =>
  `${row.email}, ${row.roles.join(', ')}`
