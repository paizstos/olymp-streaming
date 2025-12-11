const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback'
} = process.env;

const googleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id);
  done(null, user);
});

if (googleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const fullName = profile.displayName || `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim();
          const googleId = profile.id;
          const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

          let user = await User.findOne({ where: { googleId } });
          if (!user && email) {
            user = await User.findOne({ where: { email } });
          }

          if (!user) {
            user = await User.create({
              googleId,
              email: email || `google_${googleId}@placeholder.local`,
              fullName: fullName || 'Utilisateur Google',
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              emailVerified: true,
              passwordHash: randomPasswordHash
            });
          } else {
            user.googleId = user.googleId || googleId;
            user.emailVerified = true;
            if (!user.passwordHash) {
              user.passwordHash = randomPasswordHash;
            }
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

if (!googleConfigured) {
  console.warn('[auth] Google OAuth non configuré (GOOGLE_CLIENT_ID/SECRET manquants)');
}

module.exports = { passport, googleConfigured };
