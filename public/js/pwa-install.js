(() => {
  const installBtn = () => document.getElementById('pwaInstallBtn');
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = installBtn();
    if (btn) btn.style.display = 'inline-flex';
  });

  window.addEventListener('appinstalled', () => {
    const btn = installBtn();
    if (btn) btn.style.display = 'none';
  });

  document.addEventListener('click', async e => {
    const btn = installBtn();
    if (!btn || e.target !== btn) return;
    if (!deferredPrompt) {
      // Pas de prompt dispo (ex: iOS), on redirige vers le manifest pour infos
      window.location.href = '/manifest.webmanifest';
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      btn.textContent = 'Installation en cours…';
    }
    deferredPrompt = null;
  });
})();
