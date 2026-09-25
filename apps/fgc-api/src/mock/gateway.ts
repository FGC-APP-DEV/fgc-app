import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { DomainError, fromRpc, type Gateway, type RpcClient } from '@fgc/server'

/**
 * Development-only gateway. It runs the real SQL migrations on an in-memory
 * PostgreSQL (PGlite) and calls the same `api.*` functions PostgREST would, with
 * the same roles and JWT claims, so authorization/version/replay rules are the
 * real ones. It is not used by the production entry point.
 */
export interface Identity {
  userId: string
  sessionId: string
}

const authFixture = `create role anon;create role authenticated;create role service_role;
create schema auth;create table auth.users(id uuid primary key,email text);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users,not_after timestamptz);
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
grant usage on schema auth to authenticated;grant execute on all functions in schema auth to authenticated;`

export async function createMockDatabase(migrationsDir: string): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(authFixture)
  for (const file of (await readdir(migrationsDir)).sort())
    if (file.endsWith('.sql'))
      await db.exec(await readFile(path.join(migrationsDir, file), 'utf8'))
  return db
}

export class MockGateway {
  private readonly tokens = new Map<string, Identity & { expiresAt: number }>()
  constructor(readonly db: PGlite) {}

  /** Creates a live session (row in auth.sessions) and an opaque access token. */
  async startSession(email: string, lifetimeMs = 3_600_000) {
    const normalized = email.trim().toLowerCase()
    const existing = await this.db.query<{ id: string }>(
      'select id from auth.users where email=$1',
      [normalized],
    )
    const userId = existing.rows[0]?.id ?? randomUUID()
    if (!existing.rows[0])
      await this.db.query('insert into auth.users(id,email) values($1,$2)', [
        userId,
        normalized,
      ])
    const sessionId = randomUUID()
    await this.db.query('insert into auth.sessions(id,user_id) values($1,$2)', [
      sessionId,
      userId,
    ])
    const token = `mock.${randomUUID()}`
    this.tokens.set(token, { userId, sessionId, expiresAt: Date.now() + lifetimeMs })
    return { token, userId, sessionId, expiresAt: Date.now() + lifetimeMs }
  }

  async endSession(token: string) {
    const found = this.tokens.get(token)
    this.tokens.delete(token)
    if (found)
      await this.db.query('delete from auth.sessions where id=$1', [found.sessionId])
  }

  identity(token: string): Identity {
    const found = this.tokens.get(token)
    if (!found || found.expiresAt <= Date.now()) throw new DomainError('UNAUTHENTICATED')
    return found
  }

  private client(role: 'authenticated' | 'service_role', claims?: Identity): RpcClient {
    return {
      rpc: async (name, args = {}) => {
        if (!/^[a-z_]+$/.test(name)) throw new DomainError('FORBIDDEN')
        const entries = Object.entries(args)
        if (entries.some(([key]) => !/^[a-z_]+$/.test(key)))
          throw new DomainError('VALIDATION_ERROR')
        const call = `select api.${name}(${entries
          .map(([key], i) => `${key} => $${i + 1}`)
          .join(', ')}) as result`
        const values = entries.map(([, v]) =>
          v !== null && typeof v === 'object' ? JSON.stringify(v) : v,
        )
        try {
          return await this.db.transaction(async (tx) => {
            await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
              claims
                ? JSON.stringify({ sub: claims.userId, session_id: claims.sessionId })
                : '',
            ])
            await tx.query(`set local role ${role}`)
            const result = await tx.query<{ result: unknown }>(call, values)
            return result.rows[0]?.result ?? null
          })
        } catch (error) {
          const e = error as { code?: string; message?: string }
          throw fromRpc({ code: e.code, message: e.message })
        }
      },
    }
  }

  asIdentity(identity: Identity) {
    return this.client('authenticated', identity)
  }

  gateway(): Gateway {
    return {
      staff: (token) => this.client('authenticated', this.identity(token)),
      service: this.client('service_role'),
      verify: async (token) => ({ id: this.identity(token).userId }),
      ready: async () => true,
    }
  }
}
