import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const User = sequelize.define('usuaris', {
  
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
  

  repeticions_totals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  temps_total: {
    type: DataTypes.INTEGER, 
    defaultValue: 0,         
    allowNull: false   
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