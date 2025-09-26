import mysql from "mysql2/promise";

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  // Mantén conexión eficiente con pool
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
} as const;

// Pool global para evitar crear conexiones por request en dev/hmr
declare global {
  var __dbPool: mysql.Pool | undefined;
}
const pool: mysql.Pool = global.__dbPool || (global.__dbPool = mysql.createPool(config));

export async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
