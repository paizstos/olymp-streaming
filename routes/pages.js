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

router.get('/music', ensureActiveSubscription, (req, res) => {
  res.render('pages/music', { comingSoon: true });
});

router.get('/leopards', ensureActiveSubscription, (req, res) => {
  res.render('pages/leopards', { comingSoon: false, exclusif: true });
});

router.get('/business', ensureActiveSubscription, (req, res) => {
  res.render('pages/business', { comingSoon: true });
});

router.get('/sport', (req, res) => {
  res.render('pages/sport', { comingSoon: true });
});

router.post('/contact', async (req, res) => {
  const { fullName, email, topic, message, newsletter } = req.body;
  if (!fullName || !email || !topic || !message) {
    req.flash('error', 'Merci de remplir tous les champs.');
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
