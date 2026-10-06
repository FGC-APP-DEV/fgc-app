import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Role, User } from '@fgc/contracts'
import {
  ActionModal,
  Body,
  Card,
  Checkbox,
  DataTable,
  Field,
  Notice,
  Select,
  layout,
  useI18n,
  useToast,
  useToastOn,
  type Column,
} from '@fgc/ui'
import { ROLES, filterUsers } from './lib/admin'

type Filters = { name: string; email: string; role: Role | '' }
const NO_FILTERS: Filters = { name: '', email: '', role: '' }
export function UsersPage() {
  const { api } = useAuth()
  const [users, setUsers] = useState<User[] | null>(null)
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [editing, setEditing] = useState<User | null>(null)
  const [role, setRole] = useState<Role | ''>('')
  const [removeAccess, setRemoveAccess] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const toast = useToast()
  const { t } = useI18n()
  useToastOn(error, 'error')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      setUsers(await api.list<User>('/admin/users'))
    } catch (e) {
      setError((e as Error).message)
      setUsers((current) => current ?? [])
    }
  }
  useEffect(() => {
    void load()
  }, [api])

  const filtered = filterUsers(users ?? [], filters)
  const setFilter = (patch: Partial<Filters>) => {
    setFilters({ ...filters, ...patch })
  }
  const close = () => {
    setEditing(null)
    setRole('')
    setRemoveAccess(false)
    setModalError('')
  }
  const open = (user: User) => {
    close()
    setEditing(user)
    // One role per person; a legacy account holding several shows its first one until replaced.
    setRole(user.roles[0] ?? '')
  }
  const save = async (next: Role[], done: string) => {
    if (!editing) return
    setBusy(true)
    setModalError('')
    try {
      const results = await api.command<{ email: string; error?: string }[]>(
        '/admin/access',
        {
          emails: [editing.email],
          roles: next,
          mode: 'replace',
          expectedVersion: editing.version,
        },
      )
      const failed = results.find((row) => row.error)
      if (failed) {
        setModalError(failed.error ?? t('usersSaveFailed'))
        return
      }
      toast.success(t('usersDone', { email: editing.email, message: done }))
      close()
      await load()
    } catch (e) {
      setModalError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const columns: Column<User>[] = [
    { key: 'name', title: t('usersName'), flex: 2, render: (u) => u.name ?? '-' },
    { key: 'email', title: t('usersEmail'), flex: 3, render: (u) => u.email },
    {
      key: 'role',
      title: t('usersRole'),
      flex: 2,
      render: (u) => u.roles.join(', ') || t('usersNoAccess'),
    },
  ]

  return (
    <View style={layout.stack}>
      <Card title={t('adminUsers')}>
        <Field
          label={t('usersFilterName')}
          icon="search"
          value={filters.name}
          onChangeText={(name) => setFilter({ name })}
        />
        <Field
          label={t('usersFilterEmail')}
          icon="search"
          autoCapitalize="none"
          value={filters.email}
          onChangeText={(email) => setFilter({ email })}
        />
        <Select
          label={t('usersRole')}
          value={filters.role}
          options={[
            { value: '', label: t('usersAllRoles') },
            ...ROLES.map((role) => ({ value: role, label: role })),
          ]}
          onChange={(role) => setFilter({ role: role as Role | '' })}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          noun={t('usersNoun')}
          loading={users === null}
          empty={users?.length ? t('usersNoMatch') : t('usersNone')}
          resetKey={JSON.stringify(filters)}
          rowActionLabel={(u) => t('actionsFor', { name: u.email })}
          onRowAction={open}
        />
      </Card>
      {editing && (
        <ActionModal
          title={t('usersEdit', { name: editing.name ?? editing.email })}
          onClose={close}
          confirmLabel={removeAccess ? t('usersConfirmRemove') : t('confirm')}
          confirmVariant={removeAccess ? 'danger' : 'primary'}
          confirmDisabled={busy || (!removeAccess && !role)}
          onConfirm={() =>
            void (removeAccess
              ? save([], t('usersAccessRemoved'))
              : save(role ? [role] : [], t('usersRolesUpdated')))
          }
        >
          <Body>{editing.email}</Body>
          {ROLES.map((option) => (
            <Checkbox
              key={option}
              label={option}
              checked={!removeAccess && role === option}
              disabled={removeAccess}
              onChange={(on) => setRole(on ? option : '')}
            />
          ))}
          <Body>{t('usersRolesRule')}</Body>
          <Checkbox
            label={t('usersRemoveAll')}
            checked={removeAccess}
            onChange={setRemoveAccess}
          />
          {removeAccess && (
            <Notice text={t('usersRemoveWarn', { email: editing.email })} error />
          )}
          {Boolean(modalError) && <Notice text={modalError} error />}
        </ActionModal>
      )}
    </View>
  )
}
