const express = require('express');
const { User } = require('../models');
const { ensureAuth } = require('./utils');

const router = express.Router();

router.get('/account', ensureAuth, async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  res.render('account', { user });
});

router.post('/account', ensureAuth, async (req, res) => {
  const { firstName, lastName, country, birthDate, avatarUrl } = req.body;
  const user = await User.findByPk(req.session.user.id);
  if (!user) {
    req.flash('error', 'Utilisateur introuvable');
    return res.redirect('/login');
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName;
  user.country = country || null;
  user.birthDate = birthDate || null;
  user.avatarUrl = avatarUrl || null;
  await user.save();

  req.session.user.fullName = user.fullName;
  req.flash('success', 'Profil mis à jour');
  res.redirect('/account');
});

module.exports = router;
