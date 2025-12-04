const { Sequelize } = require('sequelize');

let sequelize;

// Si Railway ou prod fournit DATABASE_URL → on utilise Postgres
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : undefined
    }
  });
} else {
  // Sinon, on reste en SQLite en local
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './olymp.db',
    logging: false
  });
}

module.exports = sequelize;
