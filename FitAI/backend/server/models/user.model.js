import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const User = sequelize.define('usuaris', {
  // Recorda lo del id auto-increment del Sequilize
  // (Correcte! Sequelize ho fa per defecte)
  
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // ===============================================
  // ===== CAMPS NOUS AFEGITS =====
  // ===============================================

  // Camp per a la foto de perfil
  foto_url: {
    type: DataTypes.STRING,
    allowNull: true, // Ha de ser 'true' per si l'usuari no té foto
    defaultValue: null
  },

  // Camps per a la ratxa (streak)
  ratxa: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ultima_sessio: {
    type: DataTypes.DATEONLY, // Perfecte per comparar amb CURDATE()
    allowNull: true
  },
  
  // ===============================================
  // ===============================================

  repeticions_totals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sessions_completades: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'usuaris',
  timestamps: false
});

export default User;