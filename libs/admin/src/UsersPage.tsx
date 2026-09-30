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
  const [roles, setRoles] = useState<Role[]>([])
  const [removeAccess, setRemoveAccess] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [notice, setNotice] = useState('')
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
    setRoles([])
    setRemoveAccess(false)
    setModalError('')
  }
  const open = (user: User) => {
    close()
    setEditing(user)
    setRoles(user.roles)
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
        setModalError(failed.error ?? 'The change could not be saved.')
        return
      }
      setNotice(`${editing.email}: ${done}`)
      close()
      await load()
    } catch (e) {
      setModalError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const conflict =
    roles.includes('admin') && (roles.includes('judge') || roles.includes('judgeAdvisor'))
  const columns: Column<User>[] = [
    { key: 'name', title: 'Name', flex: 2, render: (u) => u.name ?? '-' },
    { key: 'email', title: 'Email', flex: 3, render: (u) => u.email },
    {
      key: 'role',
      title: 'Role',
      flex: 2,
      render: (u) => u.roles.join(', ') || 'No access',
    },
  ]

  return (
    <View style={layout.stack}>
      {Boolean(error) && <Notice text={error} error />}
      {Boolean(notice) && <Notice text={notice} />}
      <Card title="Current users">
        <Field
          label="Filter by name"
          icon="search"
          value={filters.name}
          onChangeText={(name) => setFilter({ name })}
        />
        <Field
          label="Filter by email"
          icon="search"
          autoCapitalize="none"
          value={filters.email}
          onChangeText={(email) => setFilter({ email })}
        />
        <Select
          label="Role"
          value={filters.role}
          options={[
            { value: '', label: 'All roles' },
            ...ROLES.map((role) => ({ value: role, label: role })),
          ]}
          onChange={(role) => setFilter({ role: role as Role | '' })}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          noun="users"
          loading={users === null}
          empty={
            users?.length
              ? 'No users match these filters.'
              : 'No users have signed in yet.'
          }
          resetKey={JSON.stringify(filters)}
          rowActionLabel={(u) => `Actions for ${u.email}`}
          onRowAction={open}
        />
      </Card>
      {editing && (
        <ActionModal
          title={`Edit ${editing.name ?? editing.email}`}
          onClose={close}
          confirmLabel={removeAccess ? 'Remove access' : 'Confirm'}
          confirmVariant={removeAccess ? 'danger' : 'primary'}
          confirmDisabled={busy || (!removeAccess && conflict)}
          onConfirm={() =>
            void (removeAccess
              ? save([], 'Access removed')
              : save(roles, 'Roles updated'))
          }
        >
          <Body>{editing.email}</Body>
          {ROLES.map((role) => (
            <Checkbox
              key={role}
              label={role}
              checked={!removeAccess && roles.includes(role)}
              disabled={removeAccess}
              onChange={(on) =>
                setRoles(on ? [...roles, role] : roles.filter((r) => r !== role))
              }
            />
          ))}
          <Body>Admin and judging roles cannot be combined.</Body>
          <Checkbox
            label="Remove all access"
            checked={removeAccess}
            onChange={setRemoveAccess}
          />
          {removeAccess && (
            <Notice
              text={`Remove all access for ${editing.email}? They will no longer be able to use the app.`}
              error
            />
          )}
          {Boolean(modalError) && <Notice text={modalError} error />}
        </ActionModal>
      )}
    </View>
  )
}
