import React, { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Role, User } from '@fgc/contracts'
import {
  Body,
  Button,
  Card,
  Field,
  Icon,
  Loading,
  Notice,
  tokens,
  layout,
  useToast,
  useToastOn,
} from '@fgc/ui'
import { AdminModal } from './AdminModal'
import { ROLES, filterUsers, paginate } from './lib/admin'

type Filters = { name: string; email: string; role: Role | '' }
const NO_FILTERS: Filters = { name: '', email: '', role: '' }
// `color` is a getter so it follows the active theme instead of the palette at import time.
const cell = {
  fontFamily: 'Inter',
  fontSize: 14,
  get color() {
    return tokens.text
  },
} as const

export function UsersPage() {
  const { api } = useAuth()
  const [users, setUsers] = useState<User[] | null>(null)
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const toast = useToast()
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
  const view = paginate(filtered, page)
  const setFilter = (patch: Partial<Filters>) => {
    setFilters({ ...filters, ...patch })
    setPage(1)
  }
  const close = () => {
    setEditing(null)
    setRoles([])
    setConfirmDelete(false)
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
      toast.success(`${editing.email}: ${done}`)
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

  return (
    <View style={layout.stack}>
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
        <View style={layout.row}>
          <Button
            label="All roles"
            variant={filters.role ? 'secondary' : 'primary'}
            onPress={() => setFilter({ role: '' })}
          />
          {ROLES.map((role) => (
            <Button
              key={role}
              label={role}
              variant={filters.role === role ? 'primary' : 'secondary'}
              onPress={() => setFilter({ role: filters.role === role ? '' : role })}
            />
          ))}
        </View>
        {users === null ? (
          <Loading />
        ) : (
          <View accessibilityRole="none" style={{ gap: 0 }}>
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: 8,
                borderBottomWidth: 2,
                borderColor: tokens.border,
              }}
            >
              <Text style={[cell, { flex: 2, fontWeight: '700' }]}>Name</Text>
              <Text style={[cell, { flex: 3, fontWeight: '700' }]}>Email</Text>
              <Text style={[cell, { flex: 2, fontWeight: '700' }]}>Role</Text>
              <Text style={[cell, { width: 40, fontWeight: '700' }]}>Edit</Text>
            </View>
            {view.items.map((u) => (
              <View
                key={u.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderColor: tokens.border,
                }}
              >
                <Text style={[cell, { flex: 2 }]}>{u.name ?? '-'}</Text>
                <Text style={[cell, { flex: 3 }]}>{u.email}</Text>
                <Text style={[cell, { flex: 2 }]}>
                  {u.roles.join(', ') || 'No access'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${u.email}`}
                  onPress={() => open(u)}
                  style={{ width: 40, padding: 8 }}
                >
                  <Icon name="pencil" size={18} color={tokens.secondary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {users !== null && filtered.length === 0 && (
          <Notice
            text={
              users.length
                ? 'No users match these filters.'
                : 'No users have signed in yet.'
            }
          />
        )}
        <View style={layout.row}>
          <Button
            label="Previous page"
            variant="secondary"
            disabled={view.page <= 1}
            onPress={() => setPage(view.page - 1)}
          />
          <Body>
            Page {view.page} of {view.pages} · {filtered.length} users
          </Body>
          <Button
            label="Next page"
            variant="secondary"
            disabled={view.page >= view.pages}
            onPress={() => setPage(view.page + 1)}
          />
        </View>
      </Card>
      {editing && (
        <AdminModal title={`Edit ${editing.name ?? editing.email}`} onClose={close}>
          <Body>{editing.email}</Body>
          <View style={layout.row}>
            {ROLES.map((role) => (
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
          <Body>Admin and judging roles cannot be combined.</Body>
          {Boolean(modalError) && <Notice text={modalError} error />}
          {confirmDelete ? (
            <>
              <Notice
                text={`Remove all access for ${editing.email}? They will no longer be able to use the app.`}
                error
              />
              <Button
                label="Confirm delete"
                variant="danger"
                disabled={busy}
                onPress={() => void save([], 'Access removed')}
              />
              <Button
                label="Keep user"
                variant="secondary"
                onPress={() => setConfirmDelete(false)}
              />
            </>
          ) : (
            <>
              <Button
                label="Confirm"
                disabled={busy || conflict}
                onPress={() => void save(roles, 'Roles updated')}
              />
              <Button
                label="Delete user"
                variant="danger"
                disabled={busy}
                onPress={() => setConfirmDelete(true)}
              />
              <Button label="Cancel" variant="secondary" onPress={close} />
            </>
          )}
        </AdminModal>
      )}
    </View>
  )
}
