import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

export const registerUser = async (req, res) => {
  const { nom, email, password } = req.body;
  if (!nom || !email || !password) {
    return res.status(400).json({ message: 'Tots els camps són obligatoris' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await pool.execute(
      'INSERT INTO usuaris (nom, email, password) VALUES (?, ?, ?)',
      [nom, email, hashedPassword]
    );
    res.status(201).json({ message: 'Usuari registrat!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Aquest email ja està registrat' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const loginUser = async (req, res) => {
  const { email: loginInput, password } = req.body;
  if (!loginInput || !password) {
    return res.status(400).json({ message: 'Usuari/Email i contrasenya obligatoris' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM usuaris WHERE email = ? OR nom = ?',
      [loginInput, loginInput]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Credencials incorrectes' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credencials incorrectes' });
    }
    req.session.user = { id: user.id, nom: user.nom, email: user.email };
    res.json(req.session.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getCurrentUser = (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'No autenticat' });
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "No s'ha pogut tancar la sessió" });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sessió tancada' });
  });
};