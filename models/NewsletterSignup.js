const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewsletterSignup = sequelize.define('NewsletterSignup', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  country: { type: DataTypes.STRING, allowNull: true },
  acceptTerms: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  source: { type: DataTypes.STRING, allowNull: false, defaultValue: 'login' }
});

module.exports = NewsletterSignup;
