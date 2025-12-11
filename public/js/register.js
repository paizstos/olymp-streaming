document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.form-step'));
  const submitBtn = document.getElementById('registerSubmit');

  // Par défaut, on active le mode progressif (tout reste visible si JS est désactivé)
  form.classList.add('form-step-enabled');
  steps.forEach((step, index) => {
    if (index > 0) step.classList.add('hidden-step');
  });

  const isFilled = (input) => {
    if (!input) return false;
    if (input.type === 'checkbox') return input.checked;
    return Boolean(input.value && input.value.trim().length);
  };

  const revealNext = () => {
    for (let i = 0; i < steps.length; i++) {
      const inputs = steps[i].querySelectorAll('input, select');
      const complete = Array.from(inputs).every(isFilled);
      if (!complete) break;
      const next = steps[i + 1];
      if (next) next.classList.remove('hidden-step');
    }
  };

  form.addEventListener('input', revealNext);
  form.addEventListener('change', revealNext);
  revealNext();

  // Scroll doux jusqu’au bouton quand on révèle des champs (meilleure UX mobile)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.type === 'attributes' && m.target.classList.contains('form-step') && !m.target.classList.contains('hidden-step')) {
        submitBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
  steps.forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));
});
