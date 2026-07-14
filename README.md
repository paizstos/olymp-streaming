# OLYMP Streaming (Node + Express + EJS + Sequelize)

Plateforme de streaming CAN 2025 avec paywall, auth email + Google OAuth, chaine YouTube, pages statiques et PWA.

## Prerequis
- Node 18+
- npm

## Installation
```bash
npm install
```

## Configuration
Copie `.env.example` en `.env` et remplis les variables :
- `SESSION_SECRET`, `NODE_ENV`, `ADMIN_GOAL_TOKEN`
- `PUBLIC_APP_URL` avec l'URL publique du site, utilisee pour les liens et le logo dans les emails.
- Resend (`RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`) pour les emails. `RESEND_FROM` doit utiliser un domaine verifie dans Resend.
- Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`) pour les photos de profil stockees dans le cloud via un upload preset non signe.
- SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) reste disponible en fallback si Resend n'est pas configure.
- Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`)
- YouTube (`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `YOUTUBE_CHANNEL_URL`, `YOUTUBE_MAX_RESULTS`)

## Seed (SQLite dev)
```bash
npm run seed
```

## Lancer
```bash
npm start
```
Le serveur ecoute sur `http://localhost:3000`.

## Tests
```bash
npm test
```
(Supertest minimal pour les routes JSON, Playwright optionnel a ajouter selon besoin)

## Routes principales
- Public : `/`, `/extraits`, `/about`, `/contact`, auth (login/register/forgot/reset/verify)
- Protegees (login + abonnement actif) : `/videos`, `/videos/:id`, `/account`, `/payment/*`, `/sport`, `/music`, `/business`, `/comedie`, `/leopards`

## Notes
- SQLite en dev (`olymp.db`), Postgres si `DATABASE_URL`.
- YouTube Data API v3 doit etre configuree pour charger la chaine et detecter le live.
- Resend ou SMTP doit etre configure pour les mails (inscription/reset/verify).
- Pour les avatars Cloudinary, cree un upload preset non signe limite aux images et renseigne son nom dans `CLOUDINARY_UPLOAD_PRESET`.
