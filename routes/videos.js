const express = require('express');
const { Video } = require('../models');
const { ensureAuth, ensureActiveSubscription } = require('./utils');

const router = express.Router();

// GET /videos - dashboard après login
router.get('/', ensureAuth, async (req, res) => {
  const videos = await Video.findAll({ order: [['isLive', 'DESC'], ['id', 'DESC']] });
  res.render('videos/index', { videos });
});

// GET /videos/:id - page vidéo
router.get('/:id', ensureActiveSubscription, async (req, res) => {
  const video = await Video.findByPk(req.params.id);
  if (!video) {
    req.flash('error', 'Vidéo introuvable');
    return res.redirect('/videos');
  }
  res.render('videos/show', { video });
});

module.exports = router;
