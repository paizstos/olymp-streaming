document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('heroInfluencerCard');
  const playBtn = document.getElementById('heroPlayBtn');
  const modal = document.getElementById('heroVideoModal');
  const backdrop = document.getElementById('heroVideoBackdrop');
  const closeBtn = document.getElementById('heroVideoCloseBtn');
  const mainVideo = document.getElementById('heroMainVideo');
  const bgVideo = document.getElementById('heroBgVideo');

  function openModal() {
    if (!modal) return;
    modal.classList.add('open');

    // Repartir la vidéo principale du début
    if (mainVideo) {
      mainVideo.currentTime = 0;
      mainVideo.play().catch(() => {});
    }

    // Optionnel : baisser le volume de fond si tu veux garder le bg
    if (bgVideo) {
      bgVideo.muted = true;
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');

    if (mainVideo) {
      mainVideo.pause();
    }
  }

  if (card) {
    card.addEventListener('click', (e) => {
      // éviter double déclenchement si on clique sur le bouton
      if (e.target && e.target.id === 'heroPlayBtn') return;
      openModal();
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
});
