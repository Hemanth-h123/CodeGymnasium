import { Pool } from 'pg'

let pool: Pool | null = null

export function getDb() {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  if (!url) return null
  pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })
  return pool
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const db = getDb()
  if (!db) throw new Error('DATABASE_URL not set')
  const res = await db.query(text, params)
  return res.rows as T[]
}
