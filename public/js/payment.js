document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.pricing-grid');
  if (!form) return;

  const cards = Array.from(form.querySelectorAll('.pricing-card'));

  const selectCard = (card) => {
    const input = card.querySelector('input[type="radio"]');
    if (input) input.checked = true;
    cards.forEach(c => c.classList.toggle('selected', c === card));
  };

  cards.forEach(card => {
    card.addEventListener('click', () => selectCard(card));
    const btn = card.querySelector('button');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        selectCard(card);
        form.closest('form')?.requestSubmit();
      });
    }
  });
});
