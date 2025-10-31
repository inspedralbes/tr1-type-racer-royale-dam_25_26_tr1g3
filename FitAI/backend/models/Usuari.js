// models/Usuari.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuari = sequelize.define('Usuari', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom_usuari: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'usuaris'
});

module.exports = Usuari;