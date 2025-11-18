import pool from '../config/database.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // <--- 1. IMPORTANTE: Importar 'fs'
import { fileURLToPath } from 'url';

// Configuració de __dirname per a ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// CONFIGURACIÓ DE MULTER (PER PUJAR IMATGES)
// ======================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ruta absoluta on volem guardar la imatge
    const uploadPath = path.join(__dirname, '../../../', 'frontend/public/uploads');
    
    // 2. IMPORTANT: Comprovar si la carpeta existeix, si no, crear-la
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`Carpeta creada: ${uploadPath}`);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const userId = req.session.userId; 
    const fileExt = path.extname(file.originalname); 
    cb(null, `user-${userId}-${Date.now()}${fileExt}`);
  }
});

// Crea la instància de Multer amb la configuració d'emmagatzematge
// Configuración completa de Multer
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // máximo 10MB
  fileFilter: (req, file, cb) => {
    // Permite cualquier tipo de imagen
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("El archivo no es una imagen. Solo se permiten imágenes."));
    }
    cb(null, true);
  }
});


// ======================================================
// CONTROLADORS EXISTENTS (Ranking i Ratxa) - SENSE CANVIS
// ======================================================

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

// --- Lógica de Ratxa (Sin cambios) ---
export const updateStreak = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });
    }

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

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ dias: rows[0].ratxa, ultimoAcceso: rows[0].ultima_sessio });

  } catch (error) {
    console.error('Error al actualizar la racha:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar la racha' });
  }
};

// --- Lógica de Ratxa (Sin cambios) ---
export const getStreak = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado. Inicie sesión.' });
    }

    const [rows] = await pool.execute('SELECT ratxa, ultima_sessio FROM usuaris WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const streak = rows[0].ratxa || 0;
    res.json({ dias: streak, ultimoAcceso: rows[0].ultima_sessio });

  } catch (error) {
    console.error('Error al obtener la racha:', error);
    res.status(500).json({ message: 'Error del servidor al obtener la racha' });
  }
};

// ======================================================
// NOVA FUNCIÓ PER PUJAR LA FOTO DE PERFIL
// ======================================================
export const updateProfilePicture = [
  // 1. Comprobación de sesión
  (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    next();
  },

  // 2. Multer con gestión de errores
  (req, res, next) => {
    upload.single('profileImage')(req, res, function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },

  // 3. Lógica para guardar la foto
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se ha subido ninguna imagen.' });
      }

      // URL accesible desde el frontend
      const fotoUrl = `/uploads/${req.file.filename}`;


      await pool.execute(
        'UPDATE usuaris SET foto_url = ? WHERE id = ?',
        [fotoUrl, req.session.userId]
      );

      const [rows] = await pool.execute(
        'SELECT id, nom, email, foto_url, sessions_completades, repeticions_totals, ratxa, ultima_sessio FROM usuaris WHERE id = ?',
        [req.session.userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const updatedUser = rows[0];
      req.session.user = updatedUser;

      req.session.save(() => {
        res.json({
          message: "Foto actualizada correctamente",
          user: updatedUser
        });
      });

    } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
];
