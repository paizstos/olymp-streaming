const express = require('express');
const { User, Subscription } = require('../models');
const { ensureAuth } = require('./utils');

const router = express.Router();

function cleanText(value) {
  return String(value || '').trim();
}

function isAllowedAvatarUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

router.get('/account', ensureAuth, async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  const subscription = await Subscription.findOne({
    where: { userId: req.session.user.id, status: 'active' },
    order: [['endDate', 'DESC']]
  });
  res.render('account', { user, subscription });
});

router.post('/account', ensureAuth, async (req, res) => {
  const { firstName, lastName, country, birthDate, avatarUrl } = req.body;
  const user = await User.findByPk(req.session.user.id);
  if (!user) {
    req.flash('error', 'Utilisateur introuvable');
    return res.redirect('/login');
  }

  user.firstName = cleanText(firstName) || user.firstName;
  user.lastName = cleanText(lastName) || user.lastName;
  user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName;
  user.country = cleanText(country) || null;
  user.birthDate = birthDate || null;
  const nextAvatarUrl = cleanText(avatarUrl);
  if (!nextAvatarUrl) {
    user.avatarUrl = null;
  } else if (nextAvatarUrl === user.avatarUrl || isAllowedAvatarUrl(nextAvatarUrl)) {
    user.avatarUrl = nextAvatarUrl;
  } else {
    req.flash('error', 'Photo de profil invalide. Merci de réimporter une image.');
    return res.redirect('/account');
  }
  await user.save();

  req.session.user.fullName = user.fullName;
  req.session.user.avatarUrl = user.avatarUrl;
  req.flash('success', 'Profil mis à jour');
  res.redirect('/account');
});

module.exports = router;
