// models/Sala.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sala = sequelize.define('Sala', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 'creador_id' esta en l'associació en server.js
}, {
  tableName: 'sales'
});

module.exports = Sala;