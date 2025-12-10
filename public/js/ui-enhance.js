(() => {
  const progress = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');

  const update = () => {
    const scrolled = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? Math.min((scrolled / height) * 100, 100) : 0;

    if (progress) {
      progress.style.transform = `scaleX(${ratio / 100})`;
      progress.style.opacity = ratio > 2 ? '1' : '0';
    }

    if (backToTop) {
      backToTop.classList.toggle('visible', scrolled > 220);
    }
  };

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
