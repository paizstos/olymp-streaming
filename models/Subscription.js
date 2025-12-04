const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
  },
  type: { // 'daily' ou 'quarter'
    type: DataTypes.ENUM('daily', 'quarter'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: { // active, expired
    type: DataTypes.ENUM('active', 'expired'),
    defaultValue: 'active'
  }
});

module.exports = Subscription;
