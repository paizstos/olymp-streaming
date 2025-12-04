const express = require('express');
const { Subscription } = require('../models');
const { ensureAuth } = require('./utils');

const router = express.Router();

// GET /payment/choose
router.get('/choose', ensureAuth, (req, res) => {
  res.render('payment/choose');
});

// POST /payment/subscribe
router.post('/subscribe', ensureAuth, async (req, res) => {
  const { plan } = req.body; // 'daily' ou 'quarter'

  const now = new Date();
  let end = new Date(now);
  let price;

  if (plan === 'daily') {
    end.setDate(end.getDate() + 1);
    price = 0.99;
  } else if (plan === 'quarter') {
    end.setMonth(end.getMonth() + 3); // ~ 3 mois
    price = 5.99;
  } else {
    req.flash('error', 'Formule inconnue');
    return res.redirect('/payment/choose');
  }

  await Subscription.create({
    type: plan,
    price,
    startDate: now,
    endDate: end,
    status: 'active',
    userId: req.session.user.id
  });

  // Ici tu intégrerais plus tard IllicoCash / Rawbank
  req.flash('success', 'Abonnement activé (simulation de paiement réussie)');
  res.redirect('/videos');
});

module.exports = router;
