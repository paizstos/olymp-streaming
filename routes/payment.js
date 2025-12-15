const express = require('express');
const { Subscription, User } = require('../models');
const { sendMail } = require('../services/mailer');
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
    price = 6.99;
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

  // Email de confirmation d'abonnement
  const user = await User.findByPk(req.session.user.id);
  const offerName = plan === 'daily' ? 'Premium · Jour' : plan === 'quarter' ? 'Premium · Pass CAN' : 'Premium';
  sendMail({
    to: user?.email,
    subject: `Confirmation abonnement ${offerName}`,
    html: `<h2>Merci pour ton abonnement ${offerName}</h2><p>Ton accès est actif jusqu’au ${end.toISOString().slice(0,10)}.</p><p>Bon streaming sur OLYMP !</p>`,
    text: `Merci pour ton abonnement ${offerName}. Actif jusqu’au ${end.toISOString().slice(0,10)}. Bon streaming sur OLYMP !`
  }).catch(err => console.error('Send subscription email error:', err));

  // Ici tu intégrerais plus tard IllicoCash / Rawbank
  req.flash('success', 'Abonnement activé (simulation de paiement réussie)');
  res.redirect('/videos');
});

module.exports = router;
