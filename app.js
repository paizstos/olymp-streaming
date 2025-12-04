const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const videosRoutes = require('./routes/videos');
const scoresRoutes = require('./routes/scores');


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
    secret: 'olymp-super-secret',
    resave: false,
    saveUninitialized: false
  })
);

app.use(flash());

// Middleware pour rendre user et messages accessibles dans les vues
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/payment', paymentRoutes);
app.use('/videos', videosRoutes);
app.use('/api/scores', scoresRoutes);


// Landing publique
app.get('/', (req, res) => {
  res.render('home');
});

// Sync DB puis start
sequelize
  .sync()
  .then(() => {
    console.log('DB ready');
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
    console.log('OLYMP streaming listening on port', PORT);
    });

  })
  .catch(err => console.error(err));
