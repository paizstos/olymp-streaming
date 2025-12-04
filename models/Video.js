const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
  },
  title: {
    type: DataTypes.STRING, allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  thumbnailUrl: {
    type: DataTypes.STRING
  },
  videoUrl: {
    type: DataTypes.STRING, allowNull: false
  },
  isLive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Video;
