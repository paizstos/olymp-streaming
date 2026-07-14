const https = require('https');

const apiKey = process.env.YOUTUBE_API_KEY;
const channelId = process.env.YOUTUBE_CHANNEL_ID;
const channelUrl = process.env.YOUTUBE_CHANNEL_URL || (channelId ? `https://www.youtube.com/channel/${channelId}` : '');
const defaultMaxResults = Number(process.env.YOUTUBE_MAX_RESULTS || 100);
const configured = Boolean(apiKey && channelId);

function getMissingConfig() {
  const missing = [];
  if (!apiKey) missing.push('YOUTUBE_API_KEY');
  if (!channelId) missing.push('YOUTUBE_CHANNEL_ID');
  return missing;
}

function requestYouTube(path, params = {}) {
  if (!configured) {
    const error = new Error(`${getMissingConfig().join(' / ')} manquant(s).`);
    error.code = 'YOUTUBE_CONFIG_MISSING';
    return Promise.reject(error);
  }

  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.searchParams.set('key', apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const body = data ? JSON.parse(data) : {};
            if (res.statusCode < 200 || res.statusCode >= 300) {
              const message = body?.error?.message || `Erreur YouTube API ${res.statusCode}`;
              return reject(new Error(message));
            }
            resolve(body);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function getBestThumbnail(thumbnails = {}) {
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    '/images/logo_olymp_blanc.png'
  );
}

function mapSearchItem(item) {
  const videoId = item?.id?.videoId;
  const snippet = item?.snippet || {};

  return {
    id: videoId,
    title: snippet.title || 'Video sans titre',
    description: snippet.description || '',
    thumbnailUrl: getBestThumbnail(snippet.thumbnails),
    embedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1` : '',
    youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : channelUrl,
    publishedAt: snippet.publishedAt,
    isLive: snippet.liveBroadcastContent === 'live'
  };
}

function mapVideoItem(item) {
  const videoId = item?.id;
  const snippet = item?.snippet || {};
  const isLive = Boolean(item?.liveStreamingDetails?.actualStartTime && !item?.liveStreamingDetails?.actualEndTime);

  return {
    id: videoId,
    title: snippet.title || 'Video sans titre',
    description: snippet.description || '',
    thumbnailUrl: getBestThumbnail(snippet.thumbnails),
    embedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1` : '',
    youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : channelUrl,
    publishedAt: snippet.publishedAt,
    isLive
  };
}

async function listChannelVideos(limit = defaultMaxResults) {
  if (!configured) return [];

  const target = Math.max(1, Math.min(limit, 500));
  const videos = [];
  let pageToken = '';

  while (videos.length < target) {
    const body = await requestYouTube('search', {
      part: 'snippet',
      channelId,
      maxResults: Math.min(target - videos.length, 50),
      order: 'date',
      pageToken,
      type: 'video'
    });

    videos.push(...(body.items || []).map(mapSearchItem).filter(video => video.id));
    if (!body.nextPageToken) break;
    pageToken = body.nextPageToken;
  }

  return videos;
}

async function getLiveVideo() {
  if (!configured) return null;

  const body = await requestYouTube('search', {
    part: 'snippet',
    channelId,
    eventType: 'live',
    maxResults: 1,
    type: 'video'
  });

  const live = (body.items || []).map(mapSearchItem).find(video => video.id);
  return live ? { ...live, isLive: true } : null;
}

async function getVideoById(videoId) {
  if (!configured) return null;

  const body = await requestYouTube('videos', {
    part: 'snippet,liveStreamingDetails',
    id: videoId,
    maxResults: 1
  });

  const item = (body.items || [])[0];
  return item ? mapVideoItem(item) : null;
}

module.exports = {
  channelUrl,
  configured,
  getMissingConfig,
  getLiveVideo,
  getVideoById,
  listChannelVideos
};
