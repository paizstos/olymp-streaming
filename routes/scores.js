const express = require('express');
const router = express.Router();

/**
 * MOCK pour les scores.
 * Plus tard, tu remplaceras ça par un appel réel à football-data.org ou API-FOOTBALL.
 */
function getMockMatches() {
  return [
    {
      competition: 'CAN 2025',
      homeTeam: 'Sénégal',
      awayTeam: 'Cameroun',
      homeScore: 3,
      awayScore: 1,
      status: 'FINISHED',
      minute: 90,
      kickoffTime: '14:00'
    },
    {
      competition: 'CAN 2025',
      homeTeam: 'SUD-AF',
      awayTeam: 'Madagascar',
      homeScore: 1,
      awayScore: 0,
      status: 'IN_PLAY', // IN_PLAY, FINISHED, SCHEDULED, MI-TEMPS
      minute: 17,
      kickoffTime: '20:00'
    },
    {
      competition: 'CAN 2025',
      homeTeam: 'Libye',
      awayTeam: 'Gabon',
      homeScore: 3,
      awayScore: 1,
      status: 'MI-TEMPS',
      minute: 45,
      kickoffTime: '14:00'
    },
    {
      competition: 'CAN 2025',
      homeTeam: 'Maroc',
      awayTeam: 'RD Congo',
      homeScore: 0,
      awayScore: 10,
      status: 'IN_PLAY', // IN_PLAY, FINISHED, SCHEDULED, MI-TEMPS
      minute: 67,
      kickoffTime: '20:00'
    },
    {
      competition: 'CAN 2025',
      homeTeam: 'Maurit',
      awayTeam: 'Tunisie',
      homeScore: 1,
      awayScore: 2,
      status: 'IN_PLAY', // IN_PLAY, FINISHED, SCHEDULED, MI-TEMPS
      minute: 67,
      kickoffTime: '20:00'
    },
    {
      competition: 'CAN 2025',
      homeTeam: 'Niger',
      awayTeam: 'Mali',
      homeScore: 0,
      awayScore: 0,
      status: 'SCHEDULED',
      minute: null,
      kickoffTime: '17:00'
    },
  ];
}

/**
 * GET /api/scores/today
 * Tous les matchs du jour (mock)
 */
router.get('/today', async (req, res) => {
  // TODO plus tard: appeler l'API de ton choix et mapper le résultat
  const matches = getMockMatches();
  res.json({ matches });
});

/**
 * GET /api/scores/live
 * Uniquement les matchs en cours
 */
router.get('/live', async (req, res) => {
  const all = getMockMatches();
  const matches = all.filter(m => m.status === 'IN_PLAY');
  res.json({ matches });
});

/**
 * GET /api/scores/upcoming
 * Matchs à venir
 */
router.get('/upcoming', async (req, res) => {
  const all = getMockMatches();
  const matches = all.filter(m => m.status === 'SCHEDULED');
  res.json({ matches });
});

module.exports = router;
