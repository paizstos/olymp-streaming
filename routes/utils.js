const { Subscription } = require('../models');
const { Op } = require('sequelize');

function ensureAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Veuillez vous connecter pour continuer');
    return res.redirect('/login');
  }
  next();
}

// Vérifie s’il a un abonnement actif
async function ensureActiveSubscription(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Veuillez vous connecter pour continuer');
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
    req.flash('error', 'Vous devez avoir un abonnement actif pour accéder au stream');
    return res.redirect('/payment/choose');
  }

  next();
}

module.exports = { ensureAuth, ensureActiveSubscription };
