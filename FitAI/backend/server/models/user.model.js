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
  // ===== CAMPS FOTO I RATXA =====
  // ===============================================
  foto_url: {
    type: DataTypes.STRING,
    allowNull: true, 
    defaultValue: null
  },
  ratxa: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ultima_sessio: {
    type: DataTypes.DATEONLY, 
    allowNull: true
  },
  
  // ===============================================
  // ===== ESTADÍSTIQUES =====
  // ===============================================

  repeticions_totals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // 🔴 AFEGIT NOU: TEMPS TOTAL
  temps_total: {
    type: DataTypes.INTEGER, // Guardem segons com a enter
    defaultValue: 0,         // Valor per defecte 0
    allowNull: false         // O true, depèn de com tinguis la DB, però millor false amb default 0
  },
  // --------------------------

  sessions_completades: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'usuaris',
  timestamps: false
});

export default User;