const express = require('express');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize, User, Subscription, NewsletterSignup } = require('../models');
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
  const now = new Date();
  const [user, subscription, subscriptionHistory, newsletter] = await Promise.all([
    User.findByPk(req.session.user.id),
    Subscription.findOne({
      where: {
        userId: req.session.user.id,
        status: 'active',
        endDate: { [Op.gt]: now }
      },
      order: [['endDate', 'DESC']]
    }),
    Subscription.findAll({
      where: { userId: req.session.user.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    }),
    NewsletterSignup.findOne({
      where: { email: req.session.user.email },
      order: [['createdAt', 'DESC']]
    })
  ]);
  res.render('account', {
    user,
    subscription,
    subscriptionHistory,
    newsletterActive: Boolean(newsletter)
  });
});

router.get('/account/export', ensureAuth, async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  if (!user) {
    req.flash('error', 'Utilisateur introuvable');
    return res.redirect('/login');
  }

  const [subscriptions, newsletters] = await Promise.all([
    Subscription.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    }),
    NewsletterSignup.findAll({
      where: { email: user.email },
      order: [['createdAt', 'DESC']]
    })
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      birthDate: user.birthDate,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      googleLinked: Boolean(user.googleId),
      termsVersion: user.termsVersion,
      termsAcceptedAt: user.termsAcceptedAt,
      marketingConsentAt: user.marketingConsentAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    subscriptions: subscriptions.map(sub => ({
      type: sub.type,
      price: sub.price,
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status,
      createdAt: sub.createdAt
    })),
    newsletter: newsletters.map(item => ({
      email: item.email,
      country: item.country,
      source: item.source,
      acceptTerms: item.acceptTerms,
      createdAt: item.createdAt
    }))
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="olymp-donnees-${user.id}.json"`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

router.post('/account/newsletter', ensureAuth, async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  if (!user) {
    req.flash('error', 'Utilisateur introuvable');
    return res.redirect('/login');
  }

  if (req.body.newsletter === '1') {
    await NewsletterSignup.findOrCreate({
      where: { email: user.email, source: 'account' },
      defaults: {
        email: user.email,
        country: user.country || null,
        acceptTerms: true,
        source: 'account'
      }
    });
    user.marketingConsentAt = new Date();
    await user.save();
    req.flash('success', 'Newsletter activee.');
  } else {
    await NewsletterSignup.destroy({ where: { email: user.email } });
    user.marketingConsentAt = null;
    await user.save();
    req.flash('success', 'Newsletter desactivee.');
  }

  res.redirect('/account#confidentialite');
});

router.post('/account/password', ensureAuth, async (req, res) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  const user = await User.findByPk(req.session.user.id);
  if (!user) {
    req.flash('error', 'Utilisateur introuvable');
    return res.redirect('/login');
  }

  if (!newPassword || newPassword.length < 8 || newPassword !== newPasswordConfirm) {
    req.flash('error', 'Le nouveau mot de passe doit contenir au moins 8 caracteres et etre confirme.');
    return res.redirect('/account#securite');
  }

  const validCurrent = await bcrypt.compare(String(currentPassword || ''), user.passwordHash);
  if (!validCurrent) {
    req.flash('error', 'Mot de passe actuel incorrect. Si tu utilises Google, passe par mot de passe oublie.');
    return res.redirect('/account#securite');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  req.flash('success', 'Mot de passe mis a jour.');
  res.redirect('/account#securite');
});

router.post('/account/delete', ensureAuth, async (req, res) => {
  const { confirmDelete, password } = req.body;
  const user = await User.findByPk(req.session.user.id);
  if (!user) {
    req.flash('error', 'Utilisateur introuvable');
    return res.redirect('/login');
  }

  if (String(confirmDelete || '').trim() !== 'SUPPRIMER') {
    req.flash('error', 'Tape SUPPRIMER pour confirmer la suppression du compte.');
    return res.redirect('/account#confidentialite');
  }

  if (!user.googleId) {
    const validPassword = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!validPassword) {
      req.flash('error', 'Mot de passe incorrect.');
      return res.redirect('/account#confidentialite');
    }
  }

  await sequelize.transaction(async (transaction) => {
    await Subscription.destroy({ where: { userId: user.id }, transaction });
    await NewsletterSignup.destroy({ where: { email: user.email }, transaction });
    await user.destroy({ transaction });
  });

  req.session.destroy(() => {
    res.redirect('/?accountDeleted=1');
  });
});

router.get('/account/subscriptions', ensureAuth, async (req, res) => {
  const subscriptions = await Subscription.findAll({
    where: { userId: req.session.user.id },
    order: [['endDate', 'DESC']]
  });
  res.json({
    subscriptions: subscriptions.map(sub => ({
      type: sub.type,
      price: sub.price,
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status
    }))
  });
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
