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
let pool: mysql.Pool;
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: mysql.Pool | undefined;
}
if (!global.__dbPool) {
  global.__dbPool = mysql.createPool(config);
}
pool = global.__dbPool;

export async function query<T = any>(sql: string, params: any[] = []) {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
