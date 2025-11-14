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
 * Esta función es llamada por el frontend con POST /api/user/streak
 * Calcula la racha usando las columnas `ratxa` y `ultima_sessio`
 */
export const updateStreak = async (req, res) => {
  try {
    // 1. OBTENER EL USUARIO DE LA SESIÓN
    // (Asegúrate de que 'req.session.userId' se guarda correctamente en tu authController)
    const userId = req.session.userId; 
    
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });
    }

    // 2. OBTENER FECHAS
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Pone la hora a medianoche para comparar solo días

    // 3. OBTENER DATOS ACTUALES (¡NOMBRES ACTUALIZADOS!)
    const [rows] = await pool.execute('SELECT ratxa, ultima_sessio FROM usuaris WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 4. DESESTRUCTURAR (¡NOMBRES ACTUALIZADOS!)
    let { ratxa, ultima_sessio } = rows[0];
    let newStreak = ratxa || 0; // Si es null, empieza en 0

    if (ultima_sessio) {
      // 5. EL USUARIO YA HA INICIADO SESIÓN ANTES
      const lastLogin = new Date(ultima_sessio);
      // No hace falta .setHours(0,0,0,0) porque la BD ya guarda solo DATE

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1); // Calcula la fecha de ayer

      if (lastLogin.getTime() === today.getTime()) {
        // 5a. Ya ha iniciado sesión hoy. No hacer nada.
        // newStreak se queda igual
      } else if (lastLogin.getTime() === yesterday.getTime()) {
        // 5b. Inició sesión ayer. ¡Es una racha! Incrementar.
        newStreak++;
      } else {
        // 5c. Ha faltado días. Resetear la racha a 1.
        newStreak = 1;
      }
    } else {
      // 6. ESTE ES EL PRIMER INICIO DE SESIÓN
      newStreak = 1;
    }

    // 7. ACTUALIZAR LA BASE DE DATOS (¡NOMBRES ACTUALIZADOS Y CURDATE()!)
    // Usamos CURDATE() porque la columna `ultima_sessio` es de tipo DATE
    await pool.execute('UPDATE usuaris SET ratxa = ?, ultima_sessio = CURDATE() WHERE id = ?', [newStreak, userId]);

    // 8. DEVOLVER LA NUEVA RACHA AL FRONTEND
    // (El frontend no cambia, sigue esperando 'dias')
    res.json({ dias: newStreak, ultimoAcceso: new Date() });

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