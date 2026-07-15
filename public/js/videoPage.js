document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('videoSearchInput');
  const filterButtons = Array.from(document.querySelectorAll('[data-video-filter]'));
  const cards = Array.from(document.querySelectorAll('[data-video-card]'));
  const emptyState = document.getElementById('videoEmptyState');
  let activeFilter = 'all';

  const applyVideoFilters = () => {
    const query = String(searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card => {
      const text = `${card.dataset.title || ''} ${card.dataset.description || ''}`.toLowerCase();
      const kind = card.dataset.kind || 'replay';
      const matchesText = !query || text.includes(query);
      const matchesFilter = activeFilter === 'all' || kind === activeFilter;
      const visible = matchesText && matchesFilter;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;
  };

  if (searchInput) searchInput.addEventListener('input', applyVideoFilters);
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.videoFilter || 'all';
      filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));
      applyVideoFilters();
    });
  });

  const scoresSidebar = document.querySelector('.scores-sidebar');
  const scoresToggleBtn = document.getElementById('scoresToggle');

  if (scoresSidebar && scoresToggleBtn) {
    const icon = scoresToggleBtn.querySelector('.scores-toggle-icon');

    scoresToggleBtn.addEventListener('click', () => {
      scoresSidebar.classList.toggle('collapsed');
      if (icon) icon.textContent = scoresSidebar.classList.contains('collapsed') ? '>' : '<';
    });
  }

  loadLiveScores();
});

async function loadLiveScores() {
  const listEl = document.getElementById('liveScoresList');
  if (!listEl) return;

  try {
    const res = await fetch('/api/scores/today');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const matches = data.matches || [];

    if (!matches.length) {
      listEl.innerHTML = '<p class="scores-placeholder">Aucun match aujourd\\'hui.</p>';
      return;
    }

    listEl.innerHTML = '';
    matches.forEach(match => {
      const row = document.createElement('div');
      row.className = 'score-row';

      const minuteLabel =
        match.status === 'FINISHED'
          ? 'Termine'
          : match.status === 'SCHEDULED'
          ? (match.kickoffTime || 'Prochainement')
          : match.status === 'MI-TEMPS'
          ? (match.kickoffTime || 'Mi-temps')
          : (match.minute ? `${match.minute}'` : 'En cours');

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
