import React, { useState } from 'react'
import { useAuth } from '@fgc/auth'
import type { User } from '@fgc/contracts'
import type { ShellMessageKey } from '@fgc/shared'
import { Body, Button, Card, Field, Notice, useI18n, useToast, useToastOn } from '@fgc/ui'
import { duplicateEmails, parseAccessCsv } from './lib/admin'

const CSV_ERRORS: Record<string, ShellMessageKey> = {
  'Invalid email address': 'csvInvalidEmail',
  'Add at least one role': 'csvNoRole',
  'Admin and judging roles cannot be combined': 'csvAdminJudge',
}
export function ApproveAccessPage() {
  const { api } = useAuth()
  const { t } = useI18n()
  // The parser reports English messages; show them in the active language.
  const csvError = (message: string) => {
    if (CSV_ERRORS[message]) return t(CSV_ERRORS[message])
    const unknown = /^Unknown role: (.*)$/.exec(message)
    return unknown ? t('csvUnknownRole', { roles: unknown[1] }) : message
  }
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  useToastOn(error, 'error')

  const submit = async () => {
    setError('')
    setResult('')
    const rows = parseAccessCsv(text)
    if (!rows.length) return
    const invalid = rows.filter((row) => row.error)
    if (invalid.length) {
      setError(
        invalid
          .map((row) =>
            t('approveLine', { line: row.line, error: csvError(row.error ?? '') }),
          )
          .join('\n'),
      )
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
          receipt?.error
            ? `${row.email}: ${receipt.error}`
            : t('approveAdded', { email: row.email, roles: row.roles.join(', ') }),
        )
        if (receipt?.error) failed.push(row.email)
      }
      const repeated = duplicateEmails(rows)
      if (repeated.length)
        lines.push(t('approveRepeated', { emails: repeated.join(', ') }))
      setResult(lines.join('\n'))
      if (failed.length < byEmail.size) toast.success(t('approveSaved'))
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
    <Card title={t('adminApprove')}>
      <Body>
        One person per line: email, then roles separated by commas. Example:
        {'\n'}ada@example.org, admin{'\n'}sam@example.org, [filmmaker, judge]{'\n'}
        Roles: admin, judge, judgeAdvisor, filmmaker, headReferee. Roles are added to any
        the person already has; edit or remove roles from Current users.
      </Body>
      <Field
        label={t('approveList')}
        multiline
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        placeholder="email@example.org, filmmaker"
      />
      <Button
        label={t('approveSave')}
        disabled={busy || !text.trim()}
        onPress={() => void submit()}
      />
      {Boolean(result) && <Notice text={result} />}
    </Card>
  )
}

const formatRow = (row: { email: string; roles: string[] }) =>
  `${row.email}, ${row.roles.join(', ')}`
