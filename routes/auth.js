const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, NewsletterSignup } = require('../models');
const { sendMail } = require('../services/mailer');
const { passport, googleConfigured } = require('../services/passport');

const router = express.Router();

// GET /login
router.get('/dash' ,(req, res) => {
    if (!req.session.user){
        res.redirect('/')
    } else {
        res.redirect('/videos')
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
    const { email, password, newsletter, acceptTerms } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash('error', 'Email ou mot de passe incorrect');
      return res.redirect('/login');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      req.flash('error', 'Email ou mot de passe incorrect');
      return res.redirect('/login');
    }

    req.session.user = { id: user.id, email: user.email, fullName: user.fullName };
    req.flash('success', 'Connexion réussie');

    // Enregistre l’opt-in newsletter si demandé
    if (newsletter === '1') {
      try {
        await NewsletterSignup.create({
          email: user.email,
          country: null,
          acceptTerms: acceptTerms === '1',
          source: 'login'
        });
      } catch (err) {
        console.error('Newsletter signup error:', err);
      }
    }

    const now = new Date();
    const active = await require('../models').Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active',
        endDate: { [require('sequelize').Op.gt]: now }
      }
    });

    if (active) {
      return res.redirect('/videos');
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
    email,
    password,
    passwordConfirm,
    firstName,
    lastName,
    birthDate,
    country,
    newsletter,
    acceptTerms
  } = req.body;

  try {
    if (acceptTerms !== '1') {
      req.flash('error', 'Merci d’accepter les Conditions Générales.');
      return res.redirect('/register');
    }

    if (!firstName || !lastName || !birthDate || !country) {
      req.flash('error', 'Merci de compléter tous les champs.');
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

    // Email de bienvenue
    sendMail({
      to: user.email,
      subject: 'Bienvenue sur OLYMP',
      html: `<h2>Bienvenue ${user.fullName || ''} !</h2><p>Ton compte est créé. Tu peux accéder à ton espace et choisir un abonnement pour profiter du streaming.</p><p><a href="${req.protocol}://${req.get('host')}/payment/choose">Choisir mon abonnement</a></p>`,
      text: `Bienvenue ${user.fullName || ''} ! Ton compte est créé. Choisis ton abonnement ici : ${req.protocol}://${req.get('host')}/payment/choose`
    }).catch(err => console.error('Send welcome email error:', err));

    // Plus de confirmation : on connecte et on envoie vers paiement
    req.session.user = { id: user.id, email: user.email, fullName: user.fullName };
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
  const { email } = req.body;
  if (!email) {
    req.flash('error', 'Email requis');
    return res.redirect('/forgot-password');
  }

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

  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;

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
  return passport.authenticate('google', { failureRedirect: '/login', session: true }, () => {
    if (req.user) {
      req.session.user = {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.fullName
      };
    }
    res.redirect('/');
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
