const sequelize = require('../config/database');
const User = require('./User');
const Subscription = require('./Subscription');
const Video = require('./Video');

// Relations
User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Subscription,
  Video
};
