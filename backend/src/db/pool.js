import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const rawPool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    // MySQL stores BOOLEAN as TINYINT(1); cast it back to a real JS boolean
    // so existing code (`if (user.is_admin)`, JSON responses, etc.) behaves
    // the same as it did against Postgres's native boolean type.
    typeCast: (field, next) => {
        if (field.type === 'TINY' && field.length === 1) {
            return field.string() === '1'
        }
        return next()
    }
})

// Normalizes mysql2's [rows | ResultSetHeader, fields] tuple into the
// { rows } shape the rest of the codebase already expects (matching the
// previous `pg` driver's response shape), so query call sites don't need to
// change — only placeholder syntax ($1 -> ?) and a couple of Postgres-only
// clauses (RETURNING, LATERAL) needed rewriting.
export const pool = {
    query: async (sql, params) => {
        const [result] = await rawPool.query(sql, params)
        if (Array.isArray(result)) {
            return { rows: result }
        }
        // INSERT/UPDATE/DELETE return a ResultSetHeader, not a rows array
        return { rows: [], insertId: result.insertId, affectedRows: result.affectedRows }
    }
}
