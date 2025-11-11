import db from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Cerca un usuari per email o nom d'usuari.
 * @param {string} loginInput - L'email o nom d'usuari.
 * @returns {Promise<Object|null>} L'objecte usuari o null si no es troba.
 */
export async function findUserByEmailOrName(loginInput) {
  const sql = 'SELECT * FROM usuaris WHERE email = ? OR nom = ?';
  const users = await db.query(sql, [loginInput, loginInput]);
  return users.length > 0 ? users[0] : null;
}

/**
 * Crea un nou usuari a la base de dades.
 * @param {string} nom - El nom de l'usuari.
 * @param {string} email - L'email de l'usuari.
 * @param {string} password - La contrasenya sense encriptar.
 * @returns {Promise<import('mysql2').ResultSetHeader>} El resultat de la inserció.
 */
export async function createUser(nom, email, password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const sql = 'INSERT INTO usuaris (nom, email, password) VALUES (?, ?, ?)';
  return await db.query(sql, [nom, email, hashedPassword]);
}

/**
 * Actualitza les estadístiques d'un usuari després de completar una sessió.
 * Aquesta funció és un bon exemple d'un UPDATE.
 * @param {number} userId - L'ID de l'usuari.
 * @param {number} repsGuanyades - Les repeticions guanyades en la sessió.
 * @returns {Promise<import('mysql2').ResultSetHeader>} El resultat de l'actualització.
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
 * Aquesta funció és un bon exemple d'un DELETE.
 * @param {number} userId - L'ID de l'usuari a eliminar.
 * @returns {Promise<import('mysql2').ResultSetHeader>} El resultat de l'eliminació.
 */
export async function deleteUser(userId) {
  // Gràcies a 'ON DELETE CASCADE' a la teva BBDD, 
  // en eliminar un usuari, també s'eliminaran les seves sales i participacions.
  const sql = 'DELETE FROM usuaris WHERE id = ?';
  return await db.query(sql, [userId]);
}

/**
 * Obté el rànquing global d'usuaris.
 * @returns {Promise<Array>} Una llista dels millors usuaris.
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
  // Mapegem a la nova estructura que espera el frontend
  return rows.map(r => ({
    jugador: r.nom,
    puntos: r.repeticions_totals
  }));
}