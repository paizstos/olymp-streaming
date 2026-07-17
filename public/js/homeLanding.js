document.addEventListener('DOMContentLoaded', () => {
  const carouselItems = Array.from(document.querySelectorAll('.hero-carousel-item'));
  const bgVideo = document.getElementById('heroBgVideo');
  const bgSource = document.getElementById('heroBgSource');
  const heroTitle = document.getElementById('heroTitle');
  const heroDesc = document.getElementById('heroDescription');
  const heroTag = document.getElementById('heroTag');
  const heroMatchInfo = document.getElementById('heroMatchInfo');
  const heroWatchBtn = document.getElementById('heroWatchBtn');

  let currentIndex = 0;
  let rotationTimer = null;
  const heroCarousel = document.getElementById('heroCarousel');

  if (!carouselItems.length) return;

  function setVideoThumbnail(item) {
    const thumb = item.querySelector('.hero-carousel-thumb');
    const videoUrl = item.getAttribute('data-video-url');

    if (!thumb || !videoUrl) return;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.src = videoUrl;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.addEventListener('loadedmetadata', () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 4;
      const targetTime = Math.min(Math.max(duration * 0.12, 0.8), 2.5);
      video.currentTime = Number.isFinite(targetTime) ? targetTime : 1;
    }, { once: true });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(video.videoWidth || 640, 1);
        canvas.height = Math.max(video.videoHeight || 360, 1);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        thumb.style.backgroundImage = `url('${thumbnailDataUrl}')`;
        const inlineVideo = item.querySelector('.hero-carousel-inline-video');
        if (inlineVideo) inlineVideo.poster = thumbnailDataUrl;
        item.classList.add('thumb-ready');
      } catch (err) {
        console.warn('Thumbnail video impossible:', err.message || err);
      } finally {
        cleanup();
      }
    }, { once: true });

    video.addEventListener('error', cleanup, { once: true });
    video.load();
  }

  function applyItem(index) {
    const item = carouselItems[index];
    if (!item) return;

    const videoUrl = item.getAttribute('data-video-url');
    const title = item.getAttribute('data-title');
    const description = item.getAttribute('data-description');
    const tag = item.getAttribute('data-tag');
    const matchInfo = item.getAttribute('data-match-info');
    const videoId = item.getAttribute('data-video-id');

    carouselItems.forEach(ci => {
      ci.classList.remove('active');
      ci.classList.remove('inline-video-ready');
      const inlineVideo = ci.querySelector('.hero-carousel-inline-video');
      if (inlineVideo) {
        inlineVideo.pause();
        try {
          inlineVideo.currentTime = 0;
        } catch (err) {
          // La video peut ne pas encore avoir charge ses metadonnees.
        }
      }
    });
    item.classList.add('active');

    if (bgSource && bgVideo && videoUrl) {
      bgSource.src = videoUrl;
      bgVideo.load();
      bgVideo.play().catch(() => {});
    }

    const activeInlineVideo = item.querySelector('.hero-carousel-inline-video');
    if (activeInlineVideo && videoUrl) {
      if (activeInlineVideo.getAttribute('src') !== videoUrl) {
        activeInlineVideo.setAttribute('src', videoUrl);
      }
      const showInlineVideo = () => {
        if (item.classList.contains('active')) {
          item.classList.add('inline-video-ready');
        }
      };
      activeInlineVideo.addEventListener('loadeddata', showInlineVideo, { once: true });
      activeInlineVideo.addEventListener('canplay', showInlineVideo, { once: true });
      activeInlineVideo.addEventListener('playing', showInlineVideo, { once: true });
      try {
        activeInlineVideo.currentTime = 0;
      } catch (err) {
        // La lecture repartira au debut des que les metadonnees seront disponibles.
      }
      activeInlineVideo.load();
      activeInlineVideo.play().catch(() => {});
    }

    if (heroTitle) heroTitle.textContent = title || '';
    if (heroDesc) heroDesc.textContent = description || '';
    if (heroTag) heroTag.textContent = tag || '';
    if (heroMatchInfo) heroMatchInfo.textContent = matchInfo || '';

    if (heroWatchBtn && videoId) {
      heroWatchBtn.href = `/videos/${videoId}`;
    }

  }

  function startRotation() {
    stopRotation();
    rotationTimer = setInterval(() => {
      currentIndex = (currentIndex + 1) % carouselItems.length;
      applyItem(currentIndex);
    }, 5000); // 5 secondes par vidéo
  }

  function stopRotation() {
    if (rotationTimer) {
      clearInterval(rotationTimer);
      rotationTimer = null;
    }
  }

  // Initialisation
  carouselItems.forEach(setVideoThumbnail);
  applyItem(currentIndex);
  startRotation();

  function previewItem(index, shouldStopRotation = true) {
    currentIndex = index;
    applyItem(currentIndex);
    if (shouldStopRotation) stopRotation();
  }

  // Souris, tactile et clavier => aperçu immédiat en arrière-plan.
  carouselItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      previewItem(index);
    });

    item.addEventListener('focusin', () => {
      previewItem(index);
    });

    item.addEventListener('click', () => {
      previewItem(index, false);
      startRotation();
    });
  });

  // Pause la rotation au survol du carrousel pour laisser le temps de lire
  if (heroCarousel) {
    heroCarousel.addEventListener('mouseenter', stopRotation);
    heroCarousel.addEventListener('pointerdown', stopRotation, { passive: true });
    heroCarousel.addEventListener('touchstart', stopRotation, { passive: true });
    heroCarousel.addEventListener('scroll', stopRotation, { passive: true });
    heroCarousel.addEventListener('mouseleave', startRotation);
  }
});
