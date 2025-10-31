// models/ParticipantSala.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParticipantSala = sequelize.define('ParticipantSala', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipus_exercici: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  durada_segons: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  repeticions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'participants_sala'
});

module.exports = ParticipantSala;