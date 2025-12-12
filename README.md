# OLYMP Streaming (Node + Express + EJS + Sequelize)

Plateforme de streaming CAN 2025 avec paywall, auth (email + Google OAuth), Vimeo, pages statiques, PWA.

## Prérequis
- Node 18+
- npm

## Installation
```bash
npm install
```

## Configuration
Copie `.env.example` en `.env` et remplis les variables :
- `SESSION_SECRET`, `NODE_ENV`, `ADMIN_GOAL_TOKEN`
- SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) pour les emails
- Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`)
- Vimeo (`VIMEO_CLIENT_ID`, `VIMEO_CLIENT_SECRET`, `VIMEO_ACCESS_TOKEN`)

## Seed (SQLite dev)
```bash
npm run seed
```

## Lancer
```bash
npm start
```
Le serveur écoute sur `http://localhost:3000`.

## Tests
```bash
npm test
```
(Supertest minimal pour les routes JSON, Playwright optionnel à ajouter selon besoin)

## Routes principales
- Public : `/`, `/extraits`, `/about`, `/contact`, auth (login/register/forgot/reset/verify)
- Protégées (login + abonnement actif) : `/videos`, `/videos/:id`, `/account`, `/payment/*`, `/sport`, `/music`, `/business`, `/leopards`

## Notes
- SQLite en dev (`olymp.db`), Postgres si `DATABASE_URL`.
- Vimeo nécessite des tokens valides (pas de fallback en prod).
- Google OAuth et SMTP doivent être configurés pour les mails (inscription/RESET/verify).
