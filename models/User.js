const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
  },
  email: {
    type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING, allowNull: false
  },
  fullName: {
    type: DataTypes.STRING, allowNull: false
  },
  firstName: {
    type: DataTypes.STRING, allowNull: true
  },
  lastName: {
    type: DataTypes.STRING, allowNull: true
  },
  country: {
    type: DataTypes.STRING, allowNull: true
  },
  birthDate: {
    type: DataTypes.DATEONLY, allowNull: true
  },
  avatarUrl: {
    type: DataTypes.STRING, allowNull: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
  },
  googleId: {
    type: DataTypes.STRING, allowNull: true, unique: true
  },
  verifyToken: {
    type: DataTypes.STRING, allowNull: true
  },
  verifyTokenExpires: {
    type: DataTypes.DATE, allowNull: true
  },
  resetToken: {
    type: DataTypes.STRING, allowNull: true
  },
  resetTokenExpires: {
    type: DataTypes.DATE, allowNull: true
  }
});

module.exports = User;
