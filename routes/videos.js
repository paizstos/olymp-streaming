const express = require('express');
const { Video } = require('../models');
const vimeoClient = require('../services/vimeoClient');
const { ensureAuth, ensureActiveSubscription } = require('./utils');

const router = express.Router();

/*// GET /videos - dashboard après login
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
*/



//============================= VIMEO =================================

// GET /videos – liste toutes les vidéos venant de Vimeo (protégé par abonnement actif)
router.get('/', ensureActiveSubscription, async (req, res) => {
  try {
    // Exemple : on récupère les vidéos de ton compte
    // "/me/videos" = les vidéos du propriétaire du token
    vimeoClient.request(
      {
        method: 'GET',
        path: '/me/videos',
        query: {
          per_page: 24,  // par ex. 24 vidéos par page
          sort: 'date',
          direction: 'desc'
        }
      },
      (error, body, statusCode, headers) => {
        if (error) {
          console.error('Erreur API Vimeo:', error);
          req.flash('error', "Impossible de charger les vidéos Vimeo pour l'instant.");
          return res.render('videos/index', { videos: [], vimeoError: true });
        }

        const vimeoVideos = body?.data || [];

        // On mappe les données Vimeo → format attendu par ta vue
        const videos = vimeoVideos.map((v) => {
          // Titre et description
          const title = v.name || 'Vidéo sans titre';
          const description = v.description || '';

          // Thumbnail (pictures.sizes contient différentes tailles)
          let thumbnailUrl = '';
          if (v.pictures && v.pictures.sizes && v.pictures.sizes.length > 0) {
            const best = v.pictures.sizes[v.pictures.sizes.length - 1];
            thumbnailUrl = best.link || '';
          }

          // URL de la page Vimeo (si tu veux l’ouvrir là-bas)
          const vimeoPageUrl = v.link; // ex: https://vimeo.com/123456789

          // URL du fichier vidéo (optionnel, si tu veux un <video> HTML5)
          // Il faut que ton token ait le scope "video_files"
          let videoFileUrl = '';
          if (v.files && v.files.length > 0) {
            // On prend le fichier progressive mp4 si dispo
            const progressive = v.files.find(f => f.quality === 'hd' && f.type === 'video/mp4')
              || v.files.find(f => f.type === 'video/mp4')
              || v.files[0];

            videoFileUrl = progressive.link || '';
          }

          // ID qu'on pourra utiliser pour /videos/:id (comme un alias)
          const id = v.uri ? v.uri.split('/').pop() : v.resource_key;
          const isLive = v.embed?.badges?.live.streaming
          console.log("thumbnailurl: ", thumbnailUrl, " isLive: ", isLive);
          //console.log(v);
          console.log(v.embed?.badges?.live.streaming); 

          return {
            id,                           // ex: "123456789"
            title,
            description,
            thumbnailUrl : thumbnailUrl || "/images/logo_olymp_blanc.png",
            videoUrl: videoFileUrl || vimeoPageUrl,  // si pas de mp4, on garde la page Vimeo
            vimeoPageUrl,
            isLive
          };
        });

        res.render('videos/index', { videos });
      }
    );
  } catch (err) {
    console.error('Erreur /videos:', err);
    req.flash('error', "Une erreur est survenue en chargeant les vidéos.");
    res.render('videos/index', { videos: [] });
  }
});

// Optionnel : page /videos/:id qui affiche une vidéo spécifique Vimeo
router.get('/:id', ensureActiveSubscription, async (req, res) => {
  const videoId = req.params.id;

  vimeoClient.request(
    {
      method: 'GET',
      path: `/videos/${videoId}`
    },
    (error, body, statusCode, headers) => {
      if (error) {
        console.error('Erreur API Vimeo (show):', error);
        req.flash('error', "Impossible de charger cette vidéo Vimeo.");
        return res.redirect('/videos');
      }

      const v = body;
      let thumbnailUrl = '';
      if (v.pictures && v.pictures.sizes && v.pictures.sizes.length > 0) {
        const best = v.pictures.sizes[v.pictures.sizes.length - 1];
        thumbnailUrl = best.link || '/images/logo_total.PNG';
      }

      let videoFileUrl = '';
      if (v.files && v.files.length > 0) {
        const progressive = v.files.find(f => f.quality === 'hd' && f.type === 'video/mp4')
          || v.files.find(f => f.type === 'video/mp4')
          || v.files[0];

        videoFileUrl = progressive.link || '';
      }

      // URL d’embed (préférence : player_embed_url de l’API, sinon extraction du HTML d’embed, sinon fallback simple)
      let embedUrl = v.player_embed_url || '';
      if (!embedUrl && v.embed && v.embed.html) {
        const match = v.embed.html.match(/src="([^"]+)"/);
        if (match && match[1]) embedUrl = match[1];
      }
      if (!embedUrl) {
        embedUrl = `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&dnt=1`;
      }

      const isLive = v.live && v.live.status === 'streaming';
      console.log("thumbnailurl: ", thumbnailUrl, " isLive: ", isLive);

      const video = {
        id: videoId,
        title: v.name || 'Vidéo sans titre',
        description: v.description || '',
        thumbnailUrl: thumbnailUrl || "/images/logo_olymp_blanc.png",
        videoUrl: videoFileUrl || v.link,
        videoFileUrl,
        embedUrl,
        vimeoPageUrl: v.link,
        isLive  // tu pourras détecter ça via tes propres métadonnées ou dossiers "live"
      };

      res.render('videos/show', { video });
    }
  );
});

module.exports = router;
