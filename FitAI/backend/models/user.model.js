import db from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Cerca un usuari per email o nom d'usuari.
 * @param {string} loginInput
 * @returns {Promise<Object|null>}
 */
export async function findUserByEmailOrName(loginInput) {
  const sql = 'SELECT * FROM usuaris WHERE email = ? OR nom = ?';
  const users = await db.query(sql, [loginInput, loginInput]);
  return users.length > 0 ? users[0] : null;
}

/**
 * Crea un nou usuari a la base de dades.
 * @param {string} nom
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('mysql2').ResultSetHeader>}
 */
export async function createUser(nom, email, password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const sql = 'INSERT INTO usuaris (nom, email, password) VALUES (?, ?, ?)';
  
  return await db.query(sql, [nom, email, hashedPassword]); 
}

/**
 * Actualitza les estadístiques d'un usuari després de completar una sessió.
 * @param {number} userId
 * @param {number} repsGuanyades
 * @returns {Promise<import('mysql2').ResultSetHeader>}
 */
export async function updateUserStats(userId, repsGuanyades) {
  const sql = `
    UPDATE usuaris 
    SET 
      repeticions_totals = repeticions_totals + ?,
      sessions_completades = sessions_completades + 1
    WHERE id = ?
  `;
  return await db.query(sql, [repsGuanyades, userId]);
}

/**
 * Elimina un usuari de la base de dades.
 * @param {number} userId
 * @returns {Promise<import('mysql2').ResultSetHeader>}
 */
export async function deleteUser(userId) {
  const sql = 'DELETE FROM usuaris WHERE id = ?';
  return await db.query(sql, [userId]);
}

/**
 * Obté el rànquing global d'usuaris.
 * @returns {Promise<Array>}
 */
export async function getGlobalRanking() {
  const sql = `
    SELECT nom, repeticions_totals 
    FROM usuaris 
    WHERE repeticions_totals > 0 
    ORDER BY repeticions_totals DESC, nom ASC 
    LIMIT 10
  `;
  const rows = await db.query(sql);
  return rows.map(r => ({
    jugador: r.nom,
    puntos: r.repeticions_totals
  }));
}