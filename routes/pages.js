const express = require('express');
const router = express.Router();
const { NewsletterSignup } = require('../models');
const { ensureActiveSubscription } = require('./utils');

router.get('/about', (req, res) => {
  res.render('pages/about');
});

router.get('/contact', (req, res) => {
  res.render('pages/contact');
});

router.get('/terms', (req, res) => {
  res.render('pages/terms');
});

router.get('/privacy', (req, res) => {
  res.render('pages/privacy');
});

router.get('/cookies', (req, res) => {
  res.render('pages/cookies');
});

router.get('/music', ensureActiveSubscription, (req, res) => {
  res.render('pages/music', { comingSoon: true });
});

router.get('/leopards', ensureActiveSubscription, (req, res) => {
  res.render('pages/leopards', { comingSoon: false, exclusif: true });
});

router.get('/business', ensureActiveSubscription, (req, res) => {
  res.render('pages/business', { comingSoon: true });
});

router.get('/comedie', ensureActiveSubscription, (req, res) => {
  res.render('pages/comedie', { comingSoon: true });
});

router.get('/sport', ensureActiveSubscription, (req, res) => {
  res.render('pages/sport', { comingSoon: true });
});

router.post('/contact', async (req, res) => {
  const fullName = String(req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const topic = String(req.body.topic || '').trim();
  const message = String(req.body.message || '').trim();
  const { newsletter } = req.body;

  if (!fullName || !email || !topic || !message) {
    req.flash('error', 'Merci de remplir tous les champs.');
    return res.redirect('/contact');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length > 2000 || fullName.length > 120) {
    req.flash('error', 'Merci de vérifier les informations saisies.');
    return res.redirect('/contact');
  }

  if (newsletter === '1') {
    try {
      await NewsletterSignup.create({
        email,
        country: null,
        acceptTerms: true,
        source: `contact-${topic}`
      });
    } catch (err) {
      console.error('Newsletter contact save error:', err);
    }
  }

  req.flash('success', 'Message envoyé. Merci pour ton retour !');
  res.redirect('/contact');
});

module.exports = router;
