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

  function applyItem(index) {
    const item = carouselItems[index];
    if (!item) return;

    const videoUrl = item.getAttribute('data-video-url');
    const title = item.getAttribute('data-title');
    const description = item.getAttribute('data-description');
    const tag = item.getAttribute('data-tag');
    const matchInfo = item.getAttribute('data-match-info');
    const videoId = item.getAttribute('data-video-id');

    carouselItems.forEach(ci => ci.classList.remove('active'));
    item.classList.add('active');

    if (bgSource && bgVideo && videoUrl) {
      bgSource.src = videoUrl;
      bgVideo.load();
      bgVideo.play().catch(() => {});
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

    item.addEventListener('touchstart', () => {
      previewItem(index);
    }, { passive: true });

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
    heroCarousel.addEventListener('touchstart', stopRotation, { passive: true });
    heroCarousel.addEventListener('mouseleave', startRotation);
  }
});
