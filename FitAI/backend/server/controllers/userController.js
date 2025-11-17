import pool from '../config/database.js';

// ======================================================
// IMPORTS NOUS PER PUJAR IMATGES
// ======================================================
import multer from 'multer';
import path from 'path';

// ======================================================
// CONFIGURACIÓ DE MULTER (PER PUJAR IMATGES)
// ======================================================

// Defineix on es desaran els fitxers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // IMPORTANT: Assegura't que la carpeta 'public/uploads/profiles' existeixi!
    cb(null, 'public/uploads/profiles/');
  },
  filename: function (req, file, cb) {
    // Canvia el nom del fitxer per evitar conflictes
    const userId = req.session.userId; // Obtenim l'ID de la sessió
    const fileExt = path.extname(file.originalname); // Extensió (ex: .jpg)
    cb(null, `user-${userId}-${Date.now()}${fileExt}`);
  }
});

// Crea la instància de Multer amb la configuració d'emmagatzematge
const upload = multer({ storage: storage });

// ======================================================
// CONTROLADORS EXISTENTS (Ranking i Ratxa)
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
  // 1. Comprova que l'usuari està autenticat
  (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'No autoritzat' });
    }
    next();
  },
  
  // 2. Multer processa el fitxer anomenat 'profileImage'
  // (Aquest nom ha de coincidir amb el FormData del frontend)
  upload.single('profileImage'), 

  // 3. Executa la lògica per desar la ruta a la BD
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No s\'ha pujat cap fitxer.' });
      }

      // Aquesta és la ruta que es desarà a la BD (ex: /uploads/profiles/user-1-12345.jpg)
      const fotoUrl = `/uploads/profiles/${req.file.filename}`;

      // 4. Actualitza la BD amb la nova ruta de la foto
      await pool.execute(
        'UPDATE usuaris SET foto_url = ? WHERE id = ?',
        [fotoUrl, req.session.userId]
      );

      // 5. Obtenir l'usuari actualitzat per retornar-lo al frontend
      // (L'authStore espera que li retornis l'objecte d'usuari)
      const [rows] = await pool.execute(
        // Seleccionem només els camps segurs, SENSE la contrasenya
        'SELECT id, nom, email, foto_url, sessions_completades, repeticions_totals, ratxa, ultima_sessio FROM usuaris WHERE id = ?',
        [req.session.userId]
      );
      
      if (rows.length === 0) {
          return res.status(404).json({ message: 'Usuari no trobat després d\'actualitzar' });
      }

      const updatedUser = rows[0];

      // 6. Actualitza també la sessió del servidor
      req.session.user = updatedUser; 
      req.session.save((err) => {
        if (err) console.error("Error en desar la sessió:", err);
        
        // 7. Respon al frontend amb l'usuari actualitzat
        res.json(updatedUser);
      });

    } catch (error) {
      console.error('Error al pujar la imatge:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
];