const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');

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
  res.render('auth/login');
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

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
  res.redirect('/videos');
});

// GET /register
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// POST /register
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      req.flash('error', 'Un compte existe déjà avec cet email');
      return res.redirect('/register');
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash: hash,
      fullName
    });

    req.session.user = { id: user.id, email: user.email, fullName: user.fullName };
    // Directement après inscription -> page de choix de l’abonnement (fausse page de paiement)
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

module.exports = router;
