import pool from '../config/database.js';

// --- Función de Ranking (Sin cambios) ---
export const getRanking = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT nom, repeticions_totals FROM usuaris WHERE repeticions_totals > 0 ORDER BY repeticions_totals DESC, nom ASC LIMIT 10'
    );
    const ranking = rows.map(r => ({
      jugador: r.nom,
      puntos: r.repeticions_totals
    }));
    res.json(ranking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// ======================================================
// LÓGICA DE RACHA (ACTUALIZADA A TU NUEVO SCHEMA)
// ======================================================

/**
 * Aquesta funció és cridada pel frontend amb POST /api/user/streak
 * Calcula la ratxa utilitzant lògica SQL, que és més robusta contra
 * problemes de zona horària.
 */
export const updateStreak = async (req, res) => {
  try {
    // 1. OBTENIR L'USUARI DE LA SESSIÓ
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });
    }

    // 2. EXECUTAR LA LÒGICA D'ACTUALITZACIÓ DIRECTAMENT A SQL
    // Aquesta consulta gestiona tots els casos:
    // - Si 'ultima_sessio' és AVUI (CURDATE()) -> 'ratxa' no canvia.
    // - Si 'ultima_sessio' és AHIR (CURDATE() - 1 dia) -> 'ratxa' s'incrementa.
    // - Si 'ultima_sessio' és més antiga o NULL -> 'ratxa' es reinicia a 1.
    // En tots els casos, 'ultima_sessio' s'actualitza a AVUI.
    await pool.execute(
      `UPDATE usuaris SET
          ratxa = CASE
            WHEN ultima_sessio = CURDATE() THEN ratxa
            WHEN ultima_sessio = (CURDATE() - INTERVAL 1 DAY) THEN ratxa + 1
            ELSE 1
          END,
          ultima_sessio = CURDATE()
        WHERE id = ?`,
      [userId]
    );

    // 3. OBTENIR LES DADES ACTUALITZADES PER TORNAR-LES AL FRONTEND
    const [rows] = await pool.execute(
      'SELECT ratxa, ultima_sessio FROM usuaris WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      // Això no hauria de passar si el pas 2 ha funcionat, però és una bona comprovació
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 4. TORNAR LA NOVA RATXA
    // (El frontend segueix rebent 'dias')
    res.json({ dias: rows[0].ratxa, ultimoAcceso: rows[0].ultima_sessio });

  } catch (error) {
    console.error('Error al actualizar la racha:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar la racha' });
  }
};


/**
 * Esta función es llamada por el frontend con GET /api/user/streak
 * Simplemente devuelve la racha guardada en la BD.
 */
export const getStreak = async (req, res) => {
  try {
    // 1. OBTENER EL USUARIO DE LA SESIÓN
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });
    }

    // 2. BUSCAR DATOS (¡NOMBRES ACTUALIZADOS!)
    const [rows] = await pool.execute('SELECT ratxa, ultima_sessio FROM usuaris WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 3. DEVOLVER DATOS (¡NOMBRES ACTUALIZADOS!)
    const streak = rows[0].ratxa || 0;
    res.json({ dias: streak, ultimoAcceso: rows[0].ultima_sessio });

  } catch (error) {
    console.error('Error al obtener la racha:', error);
    res.status(500).json({ message: 'Error del servidor al obtener la racha' });
  }
};