const { Subscription } = require('../models');
const { Op } = require('sequelize');

function ensureAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Veuillez vous connecter pour continuer');
    if (req.method === 'GET') req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

// Vérifie s’il a un abonnement actif
async function ensureActiveSubscription(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Veuillez vous connecter pour continuer');
    if (req.method === 'GET') req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }

  const now = new Date();

  const active = await Subscription.findOne({
    where: {
      userId: req.session.user.id,
      status: 'active',
      endDate: { [Op.gt]: now }
    }
  });

  if (!active) {
    req.flash('error', 'Un abonnement actif est nécessaire pour accéder à cette page.');
    return res.redirect('/payment/choose');
  }

  next();
}

module.exports = { ensureAuth, ensureActiveSubscription };
