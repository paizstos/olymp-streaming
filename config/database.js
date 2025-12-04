const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './olymp.db',
  logging: false
});

module.exports = sequelize;
