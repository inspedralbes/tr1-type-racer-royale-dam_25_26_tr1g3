import db from '../config/database.js';

/**
 * RAD-3: Actualització en temps real dels resultats individuals.
 * Insereix o actualitza les repeticions d'un usuari en una sala específica.
 * L'ús de 'ON DUPLICATE KEY UPDATE' és perfecte per a aquest cas.
 * @param {number} usuariId 
 * @param {number} salaId 
 * @param {string} exercici 
 * @param {number} repeticions 
 * @returns {Promise<any>}
 */
export async function actualitzarResultatsParticipant(usuariId, salaId, exercici, repeticions) {
  const sql = `
    INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions) 
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE repeticions = VALUES(repeticions)
  `;
  return await db.query(sql, [usuariId, salaId, exercici, repeticions]);
}

/**
 * RAD-3: Càlcul i consulta de classificacions (leaderboard) d'una sala.
 * Combina informació de 'participacions' i 'usuaris' (JOIN) per mostrar el nom.
 * @param {number} salaId - L'ID de la sala.
 * @returns {Promise<Array>} Una llista d'usuaris ordenada per repeticions.
 */
export async function obtenirLeaderboardSala(salaId) {
    const sql = `
        SELECT 
            u.id AS userId,
            u.nom AS userName,
            p.repeticions AS reps
        FROM participacions p
        JOIN usuaris u ON p.usuari_id = u.id
        WHERE p.sala_id = ?
        ORDER BY p.repeticions DESC, u.nom ASC
    `;
    const [rows] = await db.query(sql, [salaId]);
    return rows;
}