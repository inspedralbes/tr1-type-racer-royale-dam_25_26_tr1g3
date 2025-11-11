import db from '../config/database.js';

function generarCodiAcces(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; //Paleta
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Intenta crear una sala amb un codi generat aleatòriament.
 * Si el codi ja existeix (molt improbable), ho reintenta fins a 10 vegades.
 * @param {number} creadorId
 * @returns {Promise<Object>}
 */

export async function crearNovaSala(creadorId) {
  let attempts = 0;
  while (attempts < 10) {
    const codiAcces = generarCodiAcces(6);
    try {
      const sql = 'INSERT INTO sales (creador_id, codi_acces, estat) VALUES (?, ?, ?)';
      
      // LÍNIA CORREGIDA: Hem eliminat els claudàtors [ ]
      const result = await db.query(sql, [creadorId, codiAcces, 'esperant']);
      
      return { id: result.insertId, creador_id: creadorId, codi_acces: codiAcces, estat: 'esperant' };
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }
    attempts++;
  }
  throw new Error('No s\'ha pogut generar un codi d\'accés únic per a la sala.');
}

/**
 * Busca una sala pel seu codi d'accés que estigui en estat 'esperant'.
 * @param {string} codiAcces
 * @returns {Promise<Object|null>}
 */
export async function buscarSalaPerCodi(codiAcces) {
  const sql = "SELECT * FROM sales WHERE codi_acces = ? AND estat = 'esperant'";
  const [rows] = await db.query(sql, [codiAcces.toUpperCase()]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Obté una llista de totes les sales que estan esperant jugadors.
 * Utilitza un JOIN per obtenir el nom del creador.
 * @returns {Promise<Array>}
 */
export async function llistarSalesDisponibles() {
    const sql = `
        SELECT s.id, s.codi_acces, s.estat, u.nom AS nom_creador
        FROM sales s
        JOIN usuaris u ON s.creador_id = u.id
        WHERE s.estat = 'esperant'
        ORDER BY s.data_creacio DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
}

/**
 * Canvia l'estat d'una sala a 'en_curs'.
 * @param {string} codiAcces
 * @returns {Promise<any>}
 */
export async function iniciarSala(codiAcces) {
  const sql = "UPDATE sales SET estat = 'en_curs' WHERE codi_acces = ? AND estat = 'esperant'";
  return await db.query(sql, [codiAcces]);
}