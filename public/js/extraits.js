document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.extrait-card');
  const modal = document.getElementById('extraitModal');
  const backdrop = document.getElementById('extraitModalBackdrop');
  const closeBtn = document.getElementById('extraitModalClose');
  const videoEl = document.getElementById('extraitModalVideo');
  const sourceEl = document.getElementById('extraitModalSource');

  function openModal(videoUrl) {
    if (!modal || !videoEl || !sourceEl) return;

    sourceEl.src = videoUrl;
    videoEl.load();
    modal.classList.add('open');
    videoEl.play().catch(() => {});
  }

  function closeModal() {
    if (!modal || !videoEl) return;
    modal.classList.remove('open');
    videoEl.pause();
  }

  cards.forEach(card => {
    const videoUrl = card.getAttribute('data-video');
    const playBtn = card.querySelector('.extrait-play-btn');

    const handler = (e) => {
      e.stopPropagation();
      if (videoUrl) {
        openModal(videoUrl);
      }
    };

    card.addEventListener('click', handler);
    if (playBtn) {
      playBtn.addEventListener('click', handler);
    }
  });

  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
});
