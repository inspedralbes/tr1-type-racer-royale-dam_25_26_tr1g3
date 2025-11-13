import mysql from 'mysql2/promise';
import 'dotenv/config';
// Això utilitza l'arxiu .env (esta al drive)

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'nodeuser',
  password: process.env.DB_PASSWORD || 'nodepass',
  database: process.env.DB_NAME || 'entrenador_virtual',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;