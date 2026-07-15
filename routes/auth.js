const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { User, NewsletterSignup } = require('../models');
const { sendMail } = require('../services/mailer');
const { passport, googleConfigured } = require('../services/passport');

const router = express.Router();

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function startUserSession(req, user) {
  const returnTo = req.session.returnTo;

  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl || null
      };
      resolve(returnTo && returnTo.startsWith('/') ? returnTo : null);
    });
  });
}

// GET /login
router.get('/dash' ,(req, res) => {
    if (!req.session.user){
        return res.redirect('/')
    } else {
        return res.redirect('/videos/')
    }
});

router.get('/login', (req, res) => {
  const prefillEmail = req.query.email || '';
  const already = req.query.already === '1';
  if (already) {
    req.flash('error', 'Compte déjà créé : connecte-toi ou utilise “Mot de passe oublié”.');
  }
  res.render('auth/login', { prefillEmail, metaTitle: 'Connexion – OLYMP' });
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const loginWindowMs = 10 * 60 * 1000;
    const nowMs = Date.now();
    const failures = req.session.loginFailures || { count: 0, firstAt: nowMs };
    if (nowMs - failures.firstAt > loginWindowMs) {
      failures.count = 0;
      failures.firstAt = nowMs;
    }
    if (failures.count >= 6) {
      req.flash('error', 'Trop de tentatives. Réessaie dans quelques minutes.');
      return res.redirect('/login');
    }
    if (!email || !password) {
      req.session.loginFailures = { count: failures.count + 1, firstAt: failures.firstAt };
      req.flash('error', 'Email ou mot de passe incorrect');
      return res.redirect('/login');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.session.loginFailures = { count: failures.count + 1, firstAt: failures.firstAt };
      req.flash('error', 'Email ou mot de passe incorrect');
      return res.redirect('/login');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      req.session.loginFailures = { count: failures.count + 1, firstAt: failures.firstAt };
      req.flash('error', 'Email ou mot de passe incorrect');
      return res.redirect('/login');
    }

    const returnTo = await startUserSession(req, user);
    req.flash('success', 'Connexion réussie');

    const now = new Date();
    const active = await require('../models').Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active',
        endDate: { [require('sequelize').Op.gt]: now }
      }
    });

    if (active) {
      return res.redirect(returnTo || '/videos/');
    }

    return res.redirect('/payment/choose');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Erreur de connexion, réessaie dans un instant.');
    return res.redirect('/login');
  }
});

// GET /register
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// POST /register
router.post('/register', async (req, res) => {
  const {
    password,
    passwordConfirm,
    firstName,
    lastName,
    birthDate,
    country,
    newsletter,
    acceptTerms
  } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    if (acceptTerms !== '1') {
      req.flash('error', 'Merci d’accepter les Conditions Générales.');
      return res.redirect('/register');
    }

    if (!firstName || !lastName || !birthDate || !country) {
      req.flash('error', 'Merci de compléter tous les champs.');
      return res.redirect('/register');
    }

    if (!email || !password || password.length < 6) {
      req.flash('error', 'Merci de saisir un email valide et un mot de passe de 6 caractères minimum.');
      return res.redirect('/register');
    }

    if (password !== passwordConfirm) {
      req.flash('error', 'Les mots de passe ne correspondent pas.');
      return res.redirect('/register');
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      req.flash('error', 'Compte déjà créé : connecte-toi ou utilise “Mot de passe oublié”.');
      return res.redirect(`/login?email=${encodeURIComponent(email)}&already=1`);
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash: hash,
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      birthDate,
      country,
      emailVerified: true,
      termsVersion: req.app.locals?.termsVersion || res.locals.termsVersion || '2026-07-15',
      termsAcceptedAt: new Date(),
      marketingConsentAt: newsletter === '1' ? new Date() : null,
      verifyToken: null,
      verifyTokenExpires: null
    });

    if (newsletter === '1') {
      try {
        await NewsletterSignup.create({
          email: user.email,
          country: country || null,
          acceptTerms: acceptTerms === '1',
          source: 'register'
        });
      } catch (err) {
        console.error('Newsletter signup (register) error:', err);
      }
    }

    const appUrl = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
    const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo_simple_192.png');
    const logoAttachment = fs.existsSync(logoPath)
      ? [{
          filename: 'olymp-logo.png',
          content: fs.readFileSync(logoPath),
          contentType: 'image/png',
          inlineContentId: 'olymp-logo'
        }]
      : [];
    const displayName = escapeHtml(user.fullName || 'Bienvenue');
    const paymentUrl = `${appUrl}/payment/choose`;

    // Email de bienvenue
    sendMail({
      to: user.email,
      subject: 'Bienvenue sur OLYMP',
      html: `
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Bienvenue sur OLYMP</title>
          </head>
          <body style="margin:0;padding:0;background:#020c17;color:#f7f9fc;font-family:Arial,Helvetica,sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020c17;margin:0;padding:32px 16px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#031a30;border:1px solid rgba(82,229,163,0.22);border-radius:18px;overflow:hidden;">
                    <tr>
                      <td style="padding:28px 28px 18px;background:#021528;border-bottom:1px solid rgba(255,255,255,0.08);">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="width:72px;vertical-align:middle;">
                              <img src="cid:olymp-logo" width="56" height="56" alt="OLYMP" style="display:block;border-radius:14px;background:#ffffff;">
                            </td>
                            <td style="vertical-align:middle;">
                              <p style="margin:0;color:#52e5a3;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">OLYMP Digital Media</p>
                              <h1 style="margin:6px 0 0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:800;">Bienvenue sur OLYMP</h1>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px 28px 10px;">
                        <p style="margin:0 0 18px;color:#f7f9fc;font-size:18px;line-height:1.5;">Bonjour ${displayName},</p>
                        <p style="margin:0 0 16px;color:#dbe7ff;font-size:16px;line-height:1.7;">Ton compte OLYMP a bien été créé. Tu peux maintenant choisir ton abonnement et accéder aux contenus streaming, sport, musique, business et exclusivités OLYMP.</p>
                        <p style="margin:0 0 26px;color:#a8b4c9;font-size:15px;line-height:1.7;">Merci de rejoindre la communauté. On te prépare une expérience pensée pour les fans, avec des lives, des coulisses et des contenus premium.</p>
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="border-radius:999px;background:#01b574;">
                              <a href="${paymentUrl}" style="display:inline-block;padding:14px 22px;color:#021528;text-decoration:none;font-size:15px;font-weight:800;">Choisir mon abonnement</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 28px 30px;">
                        <p style="margin:0;color:#7c879c;font-size:13px;line-height:1.6;">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="${paymentUrl}" style="color:#52e5a3;text-decoration:none;">${paymentUrl}</a></p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 28px;background:#020c17;border-top:1px solid rgba(255,255,255,0.08);">
                        <p style="margin:0;color:#a8b4c9;font-size:13px;line-height:1.6;">À très vite sur OLYMP.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Bienvenue ${user.fullName || ''} ! Ton compte OLYMP a bien été créé. Choisis ton abonnement ici : ${paymentUrl}`,
      attachments: logoAttachment
    }).catch(err => console.error('Send welcome email error:', err));

    // Plus de confirmation : on connecte et on envoie vers paiement
    await startUserSession(req, user);
    res.redirect('/payment/choose');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la création du compte');
    res.redirect('/register');
  }
});



/*=============== Extrait =============*/
// Page publique des extraits (accessible à tous)
router.get('/extraits', (req, res) => {
  const previews = [
    {
      id: 1,
      title: "Teaser AM26 – Dans le vestiaire",
      description: "30 secondes dans le vestiaire des Léopards avec notre influenceur star.",
      thumbnailUrl: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg",
      videoUrl: "videos/video_masuaku2.mp4",
    },
    {
      id: 2,
      title: "Micro-trottoir – Fans à Kinshasa",
      description: "Réactions à chaud des supporters, ambiance 100% OLYMP.",
      thumbnailUrl: "https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg",
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    {
      id: 3,
      title: "Coulisses du plateau OLYMP",
      description: "Les petites blagues hors antenne, que tu ne verras nulle part ailleurs.",
      thumbnailUrl: "https://images.pexels.com/photos/799091/pexels-photo-799091.jpeg",
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  ];

  res.render('videos/extraits', { previews });
});


// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Mot de passe oublié
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot');
});

router.post('/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    req.flash('error', 'Email requis');
    return res.redirect('/forgot-password');
  }

  const nowMs = Date.now();
  if (req.session.lastPasswordResetRequestAt && nowMs - req.session.lastPasswordResetRequestAt < 2 * 60 * 1000) {
    req.flash('success', 'Si un compte existe, un email a été envoyé.');
    return res.redirect('/forgot-password');
  }
  req.session.lastPasswordResetRequestAt = nowMs;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    req.flash('success', 'Si un compte existe, un email a été envoyé.');
    return res.redirect('/forgot-password');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  user.resetToken = hash;
  user.resetTokenExpires = expires;
  await user.save();

  const appUrl = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  sendMail({
    to: user.email,
    subject: 'Réinitialise ton mot de passe OLYMP',
    text: `Bonjour ${user.fullName || ''},\n\nTu as demandé à réinitialiser ton mot de passe.\nLien (valide 1h) : ${resetUrl}\n\nSi tu n’es pas à l’origine de cette demande, ignore ce message.`,
    html: `<h2>Réinitialise ton mot de passe</h2>
           <p>Bonjour ${user.fullName || ''},</p>
           <p>Tu as demandé à réinitialiser ton mot de passe.</p>
           <p><a href="${resetUrl}">Clique ici</a> (lien valable 1h).</p>
           <p>Si tu n’es pas à l’origine de cette demande, ignore ce message.</p>`
  }).catch(err => console.error('Send reset email error:', err));

  req.flash('success', 'Si un compte existe, un email a été envoyé.');
  res.redirect('/forgot-password');
});

// Google OAuth
router.get('/auth/google', (req, res, next) => {
  if (!googleConfigured) {
    req.flash('error', 'Connexion Google indisponible (configuration manquante)');
    return res.redirect('/login');
  }
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/auth/google/callback', (req, res, next) => {
  if (!googleConfigured) {
    req.flash('error', 'Connexion Google indisponible (configuration manquante)');
    return res.redirect('/login');
  }
  return passport.authenticate('google', { failureRedirect: '/login', session: true }, async () => {
    try {
      if (req.user) {
        await startUserSession(req, req.user);
      }
      res.redirect('/');
    } catch (err) {
      next(err);
    }
  })(req, res, next);
});

router.get('/reset-password', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    req.flash('error', 'Lien invalide');
    return res.redirect('/login');
  }
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    where: {
      resetToken: hash,
      resetTokenExpires: { [require('sequelize').Op.gt]: new Date() }
    }
  });

  if (!user) {
    req.flash('error', 'Lien expiré ou invalide');
    return res.redirect('/login');
  }

  res.render('auth/reset', { token });
});

// Vérification email
router.get('/verify/pending', (req, res) => {
  res.render('verifyPending');
});

router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    req.flash('error', 'Lien invalide');
    return res.redirect('/login');
  }
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    where: {
      verifyToken: hash,
      verifyTokenExpires: { [require('sequelize').Op.gt]: new Date() }
    }
  });

  if (!user) {
    req.flash('error', 'Lien expiré ou invalide');
    return res.redirect('/login');
  }

  user.emailVerified = true;
  user.verifyToken = null;
  user.verifyTokenExpires = null;
  await user.save();

  req.session.user = { id: user.id, email: user.email, fullName: user.fullName };
  res.render('verifySuccess');
});

router.post('/reset-password', async (req, res) => {
  const { token, password, passwordConfirm } = req.body;
  if (!token || !password || !passwordConfirm) {
    req.flash('error', 'Données manquantes');
    return res.redirect('/login');
  }
  if (password.length < 6) {
    req.flash('error', 'Le mot de passe doit contenir au moins 6 caractères.');
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }
  if (password !== passwordConfirm) {
    req.flash('error', 'Les mots de passe ne correspondent pas.');
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    where: {
      resetToken: hash,
      resetTokenExpires: { [require('sequelize').Op.gt]: new Date() }
    }
  });

  if (!user) {
    req.flash('error', 'Lien expiré ou invalide');
    return res.redirect('/login');
  }

  const newHash = await bcrypt.hash(password, 10);
  user.passwordHash = newHash;
  user.resetToken = null;
  user.resetTokenExpires = null;
  await user.save();

  req.flash('success', 'Mot de passe mis à jour, connecte-toi.');
  res.redirect('/login');
});

module.exports = router;
