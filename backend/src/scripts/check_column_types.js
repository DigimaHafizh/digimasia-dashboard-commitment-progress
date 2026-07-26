import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const { rows } = await pool.query(`
  SELECT table_name, column_name, data_type, character_maximum_length
  FROM information_schema.columns
  WHERE table_name IN ('users','progress_log') AND character_maximum_length IS NOT NULL
  ORDER BY table_name, column_name
`)
console.table(rows)
await pool.end()
