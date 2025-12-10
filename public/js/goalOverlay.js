document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('goalOverlay');
  if (!overlay) return;

  let isShowing = false;

  function showGoalAnimation(payload) {
    if (isShowing) return; // évite de spam si plusieurs réponses arrivent en même temps
    isShowing = true;
    overlay.classList.add('visible');

    // Auto-hide après 5s
    setTimeout(() => {
      overlay.classList.remove('visible');
      isShowing = false;
    }, 5000);
  }

  // Fermer à la main si on clique
  overlay.addEventListener('click', () => {
    overlay.classList.remove('visible');
    isShowing = false;
  });

  // Polling toutes les 2 secondes
  async function pollGoal() {
    try {
      const res = await fetch('/api/goal-rdc', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (data.goal) {
        console.log('⚽ GOAL reçu depuis API :', data);
        showGoalAnimation(data);
      }
    } catch (err) {
      console.warn('Erreur poll /api/goal-rdc :', err.message);
    } finally {
      // relancer dans 2 secondes
      setTimeout(pollGoal, 2000);
    }
  }

  pollGoal();
});
