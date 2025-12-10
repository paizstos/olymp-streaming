document.addEventListener('DOMContentLoaded', () => {
  const carouselItems = Array.from(document.querySelectorAll('.hero-carousel-item'));
  const bgVideo = document.getElementById('heroBgVideo');
  const bgSource = document.getElementById('heroBgSource');
  const heroTitle = document.getElementById('heroTitle');
  const heroDesc = document.getElementById('heroDescription');
  const heroTag = document.getElementById('heroTag');
  const heroMatchInfo = document.getElementById('heroMatchInfo');
  const heroWatchBtn = document.getElementById('heroWatchBtn');
  const heroExtractBtn = document.getElementById('heroExtractBtn');

  // Modal
  const extractModal = document.getElementById('heroExtractModal');
  const extractBackdrop = document.getElementById('heroExtractBackdrop');
  const extractClose = document.getElementById('heroExtractClose');
  const extractVideo = document.getElementById('heroExtractVideo');
  const extractSource = document.getElementById('heroExtractSource');

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

    // Le bouton "Voir l’extrait" utilisera la même vidéo
    heroExtractBtn.dataset.videoUrl = videoUrl || '';
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

  // Click sur une carte => on affiche cette vidéo + on reset le timer
  carouselItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      currentIndex = index;
      applyItem(currentIndex);
      startRotation();
    });
  });

  // Pause la rotation au survol du carrousel pour laisser le temps de lire
  if (heroCarousel) {
    heroCarousel.addEventListener('mouseenter', stopRotation);
    heroCarousel.addEventListener('mouseleave', startRotation);
  }

  // Bouton "Voir l’extrait"
  if (heroExtractBtn && extractModal && extractVideo && extractSource) {
    function openExtractModal() {
      const url = heroExtractBtn.dataset.videoUrl;
      if (!url) return;
      extractSource.src = url;
      extractVideo.load();
      extractModal.classList.add('open');
      extractVideo.play().catch(() => {});
      stopRotation();
    }

    function closeExtractModal() {
      extractModal.classList.remove('open');
      extractVideo.pause();
      startRotation();
    }

    heroExtractBtn.addEventListener('click', openExtractModal);
    extractBackdrop.addEventListener('click', closeExtractModal);
    extractClose.addEventListener('click', closeExtractModal);
  }

  // Effet d’apparition pour la section stats (IntersectionObserver)
  const statsSection = document.getElementById('leopardsStats');
  if (statsSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          statsSection.classList.add('visible');
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });

    observer.observe(statsSection);
  }
});
