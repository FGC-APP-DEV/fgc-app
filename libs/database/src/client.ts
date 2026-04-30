import { Pool, PoolConfig } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

declare global {
  // eslint-disable-next-line no-var
  var __fgcDbPool: Pool | undefined
  // eslint-disable-next-line no-var
  var __fgcDb: ReturnType<typeof drizzle<typeof schema>> | undefined
}

function getConnectionConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL || ''
  const urlWithoutSsl = databaseUrl
    .replace(/[?&]sslmode=[^&]*/gi, '')
    .replace(/[?&]ssl=[^&]*/gi, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '')

  return { connectionString: urlWithoutSsl }
}

function getPool(): Pool {
  if (global.__fgcDbPool) return global.__fgcDbPool
  global.__fgcDbPool = new Pool(getConnectionConfig())
  return global.__fgcDbPool
}

function getDb() {
  if (global.__fgcDb) return global.__fgcDb
  global.__fgcDb = drizzle(getPool(), { schema })
  return global.__fgcDb
}

export const db = getDb()
export const pool = getPool()

export async function connectDatabase(): Promise<void> {
  const client = await pool.connect()
  await client.query('SELECT 1')
  client.release()
}

export async function disconnectDatabase(): Promise<void> {
  await pool.end()
  global.__fgcDbPool = undefined
  global.__fgcDb = undefined
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch {
    return false
  }
}

export { schema }
