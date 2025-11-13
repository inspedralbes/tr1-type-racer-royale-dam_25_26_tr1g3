import pool from '../config/database.js';

function generarCodiAcces(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const crearSala = async (req, res) => {
  const creador_id = req.session.user?.id;
  if (!creador_id) {
    return res.status(401).json({ message: 'No autenticat' });
  }
  let codi_acces;
  let sala;
  let attempts = 0;
  do {
    codi_acces = generarCodiAcces(6);
    try {
      const [result] = await pool.execute(
        'INSERT INTO sales (creador_id, codi_acces, estat) VALUES (?, ?, ?)',
        [creador_id, codi_acces, 'esperant']
      );
      sala = { id: result.insertId, creador_id, codi_acces, estat: 'esperant' };
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        console.error(error);
        return res.status(500).json({ message: 'Error del servidor al crear sala' });
      }
    }
    attempts++;
  } while (!sala && attempts < 10);
  if (!sala) {
    return res.status(500).json({ message: "No s'ha pogut crear la sala (massa intents)" });
  }
  console.log(`Sala creada: ${codi_acces} per usuari ${creador_id}`);
  res.status(201).json(sala);
};

export const unirSala = async (req, res) => {
  const { codi_acces } = req.body;
  if (!codi_acces) {
    return res.status(400).json({ message: "Codi d'accés requerit" });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sales WHERE codi_acces = ? AND estat = ?',
      [codi_acces.toUpperCase(), 'esperant']
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sala no trobada o ja està en curs' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};