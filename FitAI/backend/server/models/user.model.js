import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const User = sequelize.define('usuaris', {
  // Recorda lo del id auto-increment del Sequilize
  
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