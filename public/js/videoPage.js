document.addEventListener('DOMContentLoaded', () => {
  // Toggle sidebar scores (à gauche)
  const scoresSidebar = document.querySelector('.scores-sidebar');
  const scoresToggleBtn = document.getElementById('scoresToggle');

  if (scoresSidebar && scoresToggleBtn) {
    const icon = scoresToggleBtn.querySelector('.scores-toggle-icon');

    scoresToggleBtn.addEventListener('click', () => {
      scoresSidebar.classList.toggle('collapsed');

      if (scoresSidebar.classList.contains('collapsed')) {
        icon.textContent = '⮞'; // flèche vers la droite (rouvrir)
      } else {
        icon.textContent = '⮜'; // flèche vers la gauche (fermer)
      }
    });
  }

  // Charger les scores au chargement de la page
  loadLiveScores();

  // Optionnel: rafraîchir toutes les 60 secondes
  // setInterval(loadLiveScores, 60000);
});

/**
 * Appelle /api/scores/today et remplit la sidebar
 */
async function loadLiveScores() {
  const listEl = document.getElementById('liveScoresList');
  if (!listEl) return;

  try {
    const res = await fetch('/api/scores/today');
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    const data = await res.json();
    const matches = data.matches || [];

    if (!matches.length) {
      listEl.innerHTML = '<p class="scores-placeholder">Aucun match aujourd\'hui.</p>';
      return;
    }

    listEl.innerHTML = '';

    matches.forEach(match => {
      const row = document.createElement('div');
      row.className = 'score-row';

      var minuteLabel =
        match.status === 'FINISHED'
          ? 'Terminé'
          : match.status === 'SCHEDULED'
          ? (match.kickoffTime || 'Prochainement')
          :match.status === 'MI-TEMPS'
          ? (match.kickoffTime || 'Mi-Temps')
          : (match.minute ? match.minute + '\'' : 'En cours');
      

      row.innerHTML = `
        <div class="score-teams">
          <span class="score-team">${match.homeTeam}</span>
          <span class="score-score">${match.homeScore} - ${match.awayScore}</span>
          <span class="score-team">${match.awayTeam}</span>
        </div>
        <div class="score-meta">
          <span class="score-competition">${match.competition}</span>
          <span class="score-minute">${minuteLabel}</span>
        </div>
      `;

      listEl.appendChild(row);
    });
  } catch (err) {
    console.error('Erreur chargement scores:', err);
    listEl.innerHTML = '<p class="scores-placeholder">Impossible de charger les scores.</p>';
  }
}
