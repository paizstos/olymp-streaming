(() => {
  const STORAGE_KEY = 'olymp_cookie_consent_v1';
  const banner = document.getElementById('cookieBanner');
  const modal = document.getElementById('cookieModal');
  const analyticsInput = document.getElementById('cookieAnalytics');
  const marketingInput = document.getElementById('cookieMarketing');

  const defaultConsent = {
    necessary: true,
    analytics: false,
    marketing: false,
    savedAt: null
  };

  const readConsent = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultConsent, ...JSON.parse(raw) } : null;
    } catch (err) {
      return null;
    }
  };

  const writeConsent = (consent) => {
    const next = {
      ...defaultConsent,
      ...consent,
      necessary: true,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('olymp:cookie-consent', { detail: next }));
    return next;
  };

  const syncInputs = (consent = defaultConsent) => {
    if (analyticsInput) analyticsInput.checked = Boolean(consent.analytics);
    if (marketingInput) marketingInput.checked = Boolean(consent.marketing);
  };

  const showBanner = () => {
    if (banner) banner.hidden = false;
  };

  const hideBanner = () => {
    if (banner) banner.hidden = true;
  };

  const openModal = () => {
    syncInputs(readConsent() || defaultConsent);
    if (modal) {
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }
  };

  const save = (consent) => {
    writeConsent(consent);
    hideBanner();
    closeModal();
  };

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.matches('[data-cookie-accept]')) {
      save({ analytics: true, marketing: true });
    }

    if (target.matches('[data-cookie-reject]')) {
      save({ analytics: false, marketing: false });
    }

    if (target.matches('[data-cookie-customize], [data-cookie-settings]')) {
      openModal();
    }

    if (target.matches('[data-cookie-close]')) {
      closeModal();
    }

    if (target.matches('[data-cookie-save]')) {
      save({
        analytics: Boolean(analyticsInput?.checked),
        marketing: Boolean(marketingInput?.checked)
      });
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  const existing = readConsent();
  if (!existing) {
    showBanner();
  } else {
    syncInputs(existing);
  }
})();
