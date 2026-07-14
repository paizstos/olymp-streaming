const express = require('express');
const youtubeClient = require('../services/youtubeClient');
const { ensureActiveSubscription } = require('./utils');

const router = express.Router();

async function renderVideosIndex(req, res) {
  try {
    if (!youtubeClient.configured) {
      return res.render('videos/index', {
        videos: [],
        liveVideo: null,
        channelUrl: youtubeClient.channelUrl,
        youtubeMissingConfig: youtubeClient.getMissingConfig()
      });
    }

    const [videos, liveVideo] = await Promise.all([
      youtubeClient.listChannelVideos(),
      youtubeClient.getLiveVideo()
    ]);

    const visibleVideos = liveVideo
      ? videos.filter(video => video.id !== liveVideo.id)
      : videos;

    res.render('videos/index', {
      videos: visibleVideos,
      liveVideo,
      channelUrl: youtubeClient.channelUrl
    });
  } catch (err) {
    console.warn('Erreur /videos:', err.message || err);
    req.flash('error', "Impossible de charger les videos YouTube pour l'instant.");
    res.render('videos/index', {
      videos: [],
      liveVideo: null,
      channelUrl: youtubeClient.channelUrl,
      youtubeError: true
    });
  }
}

router.get('', ensureActiveSubscription, renderVideosIndex);
router.get('/', ensureActiveSubscription, renderVideosIndex);

router.get('/:id', ensureActiveSubscription, async (req, res) => {
  try {
    if (!youtubeClient.configured) {
      req.flash('error', 'Les videos YouTube ne sont pas encore configurees.');
      return res.redirect('/videos');
    }

    const video = await youtubeClient.getVideoById(req.params.id);
    if (!video) {
      req.flash('error', 'Video introuvable.');
      return res.redirect('/videos');
    }

    res.render('videos/show', { video });
  } catch (err) {
    console.error('Erreur API YouTube (show):', err);
    req.flash('error', 'Impossible de charger cette video YouTube.');
    res.redirect('/videos');
  }
});

module.exports = router;
