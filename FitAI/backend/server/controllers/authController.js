import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/user.model.js';

// Registre usuari
export const registerUser = async (req, res) => {
  const { nom, email, password } = req.body;
  if (!nom || !email || !password) {
    return res.status(400).json({ message: 'Tots els camps són obligatoris' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      nom,
      email,
      password: hashedPassword
    });

    res.status(201).json({ message: 'Usuari registrat!' });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Aquest email ja està registrat' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Login (CORREGIT)
export const loginUser = async (req, res) => {
  const { email: loginInput, password } = req.body;
  if (!loginInput || !password) {
    return res.status(400).json({ message: 'Usuari/Email i contrasenya obligatoris' });
  }
  try {
    // Utilitza metode Sequilize
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginInput },
          { nom: loginInput }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Credencials incorrectes' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credencials incorrectes' });
    }

    // ===== CANVI CLAU AQUÍ =====
    // Desem les claus individuals que l'altre controlador espera
    req.session.userId = user.id;
    req.session.userName = user.nom;

    // També desem l'objecte 'user' que les funcions d'AQUEST arxiu esperen
    // (com getCurrentUser i updateUser)
    req.session.user = { id: user.id, nom: user.nom, email: user.email };

    // Fem servir .save() per assegurar que la sessió es desa abans de respondre
    req.session.save((err) => {
      if (err) {
        console.error('Error en desar la sessió:', err);
        return res.status(500).json({ message: 'Error en iniciar sessió' });
      }
      // Responem al client un cop la sessió està desada
      res.json(req.session.user);
    });
    // ===========================

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Funció per obtenir l'usuari actual
// Funció per obtenir l'usuari actual (CORREGIDA)
export const getCurrentUser = async (req, res) => {
  // 1. Verifiquem si hi ha sessió
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'No autenticat' });
  }

  try {
    // 2. Agafem l'ID guardat a la sessió
    const userId = req.session.user.id;

    // 3. Consultem la Base de Dades en temps real (Sequelize)
    // User.findByPk busca per Primary Key (ID)
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // IMPORTANT: No enviem la contrasenya
    });

    if (!user) {
      // Si l'usuari es va esborrar de la BD però encara té cookie
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    // 4. (Opcional) Actualitzem la sessió per mantenir-la fresca
    // Això ajuda si altres parts fan servir req.session.user
    req.session.user = { 
        id: user.id, 
        nom: user.nom, 
        email: user.email,
        // Pots afegir altres camps si vols tenir-los en sessió, 
        // però el important és el retorn del JSON
    };

    // 5. Retornem l'usuari FESC de la base de dades amb les noves reps
    res.json(user);

  } catch (error) {
    console.error('Error a getCurrentUser:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Funció per tancar sessió
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "No s'ha pogut tancar la sessió" });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sessió tancada' });
  });
};

// Consultar usuari per ID
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId, {
            attributes: ['id', 'nom', 'email', 'repeticions_totals', 'sessions_completades'] // Excloem la contrasenya
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuari no trobat' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Actualitzar dades d'usuari
export const updateUser = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticat' });
        }
        const { nom, email } = req.body;

        const [updated] = await User.update({ nom, email }, {
            where: { id: userId }
        });

        if (updated) {
            res.json({ message: 'Usuari actualitzat correctament' });
        } else {
            res.status(404).json({ message: 'Usuari no trobat' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};