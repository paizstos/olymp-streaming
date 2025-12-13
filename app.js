// Charge le .env avant toute dépendance pour rendre les variables disponibles (SMTP, Google OAuth)
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  lines.forEach(line => {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

const { sequelize, Subscription, User } = require('./models');
const { DataTypes } = require('sequelize');

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const videosRoutes = require('./routes/videos');
const scoresRoutes = require('./routes/scores');
const pagesRoutes = require('./routes/pages');
const accountRoutes = require('./routes/account');
const { passport } = require('./services/passport');

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-olymp-secret';
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_GOAL_TOKEN = process.env.ADMIN_GOAL_TOKEN || null;

const app = express();

// EJS + statiques
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
  session({
    name: 'olymp.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 jours
    }
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Middleware pour rendre user et messages accessibles dans les vues
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.subscriptionActive = false;

  if (req.session?.user) {
    try {
      const now = new Date();
      const active = await Subscription.findOne({
        where: {
          userId: req.session.user.id,
          status: 'active',
          endDate: { [require('sequelize').Op.gt]: now }
        }
      });
      res.locals.subscriptionActive = Boolean(active);
    } catch (err) {
      console.error('[session] Erreur vérif abonnement actif:', err);
    }
  }

  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', pagesRoutes);
app.use('/', accountRoutes);

// Routes publiques API (scores, goal overlay admin token)
app.use('/api/scores', scoresRoutes);

/* ==================== GOAL ANIM ROUTES ===================== */
// ---- GESTION SIMPLE DU "GOAL RDC" EN MÉMOIRE ----
let goalRdcFlag = false;

const requireGoalAdmin = (req, res, next) => {
  if (!ADMIN_GOAL_TOKEN) {
    console.warn('[goal] ADMIN_GOAL_TOKEN manquant : route /admin/goal-rdc bloquée.');
    return res.status(503).json({ error: 'ADMIN_GOAL_TOKEN non configuré' });
  }

  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_GOAL_TOKEN) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  next();
};

// Endpoint ADMIN pour déclencher un but (à appeler à la main pour l'instant)
app.post('/admin/goal-rdc', requireGoalAdmin, (req, res) => {
  goalRdcFlag = true;
  console.log('⚽ GOAL RDC déclenché (flag = true)');
  res.sendStatus(204);
});

// Endpoint API appelé par le front toutes les X secondes
app.get('/api/goal-rdc', (req, res) => {
  if (goalRdcFlag) {
    goalRdcFlag = false;
    return res.json({
      goal: true,
      team: 'RDC',
      message: 'But pour les Léopards !'
    });
  }
  res.json({ goal: false });
});

// Protection : toute page nécessite une session utilisateur
const requireAuth = (req, res, next) => {
  const publicPaths = [
    '/',
    '/extraits',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify',
    '/verify/pending'
  ];
  if (publicPaths.includes(req.path) || publicPaths.some(p => p !== '/' && req.path.startsWith(p))) {
    return next();
  }
  if (req.session.user) return next();
  return res.redirect('/login');
};

app.use(requireAuth);

app.use('/payment', paymentRoutes);
app.use('/videos', videosRoutes);


// Landing publique
app.get('/', (req, res) => {
  res.render('home');
});

// Ajout défensif des colonnes manquantes sur Users (pour les bases déjà créées en prod)
async function patchUserSchema() {
  try {
    const qi = sequelize.getQueryInterface();
    const table = await qi.describeTable('Users');
    const candidates = {
      firstName: { type: DataTypes.STRING, allowNull: true },
      lastName: { type: DataTypes.STRING, allowNull: true },
      country: { type: DataTypes.STRING, allowNull: true },
      birthDate: { type: DataTypes.DATEONLY, allowNull: true },
      avatarUrl: { type: DataTypes.STRING, allowNull: true },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
      verifyToken: { type: DataTypes.STRING, allowNull: true },
      verifyTokenExpires: { type: DataTypes.DATE, allowNull: true },
      resetToken: { type: DataTypes.STRING, allowNull: true },
      resetTokenExpires: { type: DataTypes.DATE, allowNull: true }
    };
    for (const [column, definition] of Object.entries(candidates)) {
      if (!table[column]) {
        await qi.addColumn('Users', column, definition);
        console.log(`[db] colonne ajoutée: Users.${column}`);
      }
    }
  } catch (err) {
    console.error('[db] Patch Users schema error:', err.message || err);
  }
}

// Sync DB puis start
const start = () => {
  const alter = true; // aligne le schéma (ajoute les colonnes manquantes type firstName, lastName…)
  sequelize
    .sync({ alter })
    .then(() => patchUserSchema())
    .then(() => {
      console.log('DB ready');
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log('OLYMP streaming listening on port', PORT);
      });
    })
    .catch(err => console.error(err));
};

if (require.main === module) {
  start();
}

app.use((req, res) => {
  res.status(404).render('404', { metaTitle: 'Page introuvable – OLYMP' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { metaTitle: 'Erreur serveur – OLYMP' });
});

module.exports = app;
