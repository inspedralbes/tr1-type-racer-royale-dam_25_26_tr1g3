import pool from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Multer (para subir imágenes)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../', 'frontend/public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const userId = req.session.userId; 
    const fileExt = path.extname(file.originalname); 
    cb(null, `user-${userId}-${Date.now()}${fileExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("El archivo no es una imagen. Solo se permiten imágenes."));
    }
    cb(null, true);
  }
});

// ==========================
// FUNCIONES EXISTENTES
// ==========================

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

export const updateStreak = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });

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

    const [rows] = await pool.execute(
      'SELECT ratxa, ultima_sessio FROM usuaris WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({ dias: rows[0].ratxa, ultimoAcceso: rows[0].ultima_sessio });

  } catch (error) {
    console.error('Error al actualizar la racha:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar la racha' });
  }
};

export const getStreak = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });

    const [rows] = await pool.execute('SELECT ratxa, ultima_sessio FROM usuaris WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({ dias: rows[0].ratxa || 0, ultimoAcceso: rows[0].ultima_sessio });

  } catch (error) {
    console.error('Error al obtener la racha:', error);
    res.status(500).json({ message: 'Error del servidor al obtener la racha' });
  }
};

// ==========================
// NUEVA FUNCIÓN: getMe (ACTUALIZADA)
// ==========================
export const getMe = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'No autorizado' });

  const [rows] = await pool.execute(
    `SELECT 
        id,
        nom,
        email,
        foto_url,
        sessions_completades,
        repeticions_totals,
        temps_total,       -- <--- ¡AÑADE ESTA LÍNEA AQUÍ!
        ratxa,
        ultima_sessio
     FROM usuaris 
     WHERE id = ?`,
    [req.session.userId]
  );

  if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

  res.json(rows[0]);
};
// ==========================
// FUNCIÓN EXISTENTE: updateProfilePicture
// ==========================
export const updateProfilePicture = [
  (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ message: 'No autorizado' });
    next();
  },
  (req, res, next) => {
    upload.single('profileImage')(req, res, function (err) {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No se ha subido ninguna imagen.' });

      const fotoUrl = `/uploads/${req.file.filename}`;

      await pool.execute(
        'UPDATE usuaris SET foto_url = ? WHERE id = ?',
        [fotoUrl, req.session.userId]
      );

      const [rows] = await pool.execute(
        'SELECT id, nom, email, foto_url, sessions_completades, repeticions_totals, ratxa, ultima_sessio FROM usuaris WHERE id = ?',
        [req.session.userId]
      );

      if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

      const updatedUser = rows[0];
      req.session.user = updatedUser;

      req.session.save(() => {
        res.json({ message: "Foto actualizada correctamente", user: updatedUser });
      });

    } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
];

// ==========================
// NUEVA FUNCIÓN: saveSessionStats (CORREGIDA CON TIEMPO)
// ==========================
export const saveSessionStats = async (req, res) => {
  try {
    // 1. Verificamos sesión
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });
    }

    // 2. Recibimos los datos del frontend
    const { reps, time } = req.body;
    
    // Convertimos a números. Si llega null o undefined, ponemos 0.
    const repsNum = Number(reps) || 0;
    const timeNum = Number(time) || 0; // <--- AHORA SÍ LO USAMOS

    // 3. EJECUTAMOS SQL UPDATE
    // IMPORTANTE: Asegúrate de que la columna 'temps_total' existe en tu base de datos
    await pool.execute(
      `UPDATE usuaris 
       SET 
         repeticions_totals = repeticions_totals + ?, 
         sessions_completades = sessions_completades + 1,
         temps_total = IFNULL(temps_total, 0) + ?  -- Sumamos el tiempo (si es null, empieza en 0)
       WHERE id = ?`,
      [repsNum, timeNum, userId]
    );

    // 4. Recuperamos el usuario actualizado para refrescar la sesión
    const [rows] = await pool.execute(
      `SELECT 
          id, nom, email, 
          sessions_completades, 
          repeticions_totals, 
          temps_total, 
          foto_url 
       FROM usuaris WHERE id = ?`,
      [userId]
    );

    const updatedUser = rows[0];

    // Actualizamos la sesión del backend
    if (req.session.user) {
        req.session.user = { ...req.session.user, ...updatedUser };
        req.session.save();
    }

    // Respondemos al frontend
    res.json({ 
      message: 'Entrenamiento guardado correctamente', 
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error al guardar estadísticas:', error);
    
    // Si el error es porque falta la columna, avisamos claro
    if (error.code === 'ER_BAD_FIELD_ERROR') {
       return res.status(500).json({ message: "Error: La columna 'temps_total' no existe en la base de datos." });
    }
    
    res.status(500).json({ message: 'Error de base de datos al guardar stats' });
  }
};