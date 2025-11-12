import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'nodeuser',
  password: process.env.DB_PASSWORD || 'nodepass',
  database: process.env.DB_NAME || 'entrenador_virtual',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Pool de connexions a la base de dades creat correctament.');

/**
 * Funció 'helper' per a queries simples que no necessiten una transacció.
 * Agafa una connexió del pool, l'executa i l'allibera automàticament.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
async function query(sql, params = []) {
  try {
    // pool.execute és la forma segura d'usar 'prepared statements'
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error executant la query:', error.message);
    throw error;
  }
}

/**
 * Funció 'helper' per obtenir una connexió explícita del pool.
 * Això és necessari per fer TRANSACCIONS (múltiples operacions).
 * IMPORTANT: Qui demana la connexió és responsable d'alliberar-la amb connection.release().
 * @returns {Promise<import('mysql2/promise').PoolConnection>} Una connexió del pool.
 */
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error obtenint una connexió del pool:', error.message);
    throw error;
  }
}

export default {
  query,
  getConnection
};