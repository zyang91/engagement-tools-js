const SELECTORS = {
  introPanel: '#intro-panel',
  mapPanel: '#map-panel',
  consentCheckbox: '#consent-checkbox',
  consentButton: '#consent-button',
};

/**
 * Wire up the introductory consent flow before exposing the map UI.
 * @param {Object} [config] Optional configuration.
 * @param {Function} [config.onConsent] Callback fired after user agrees.
 */
export function setupIntroFlow({ onConsent } = {}) {
  const elements = queryElements();
  if (!elements) {
    console.warn('Intro flow could not find required DOM elements.');
    return;
  }

  const { introPanel, mapPanel, consentCheckbox, consentButton } = elements;
  let consentComplete = false;

  consentCheckbox.addEventListener('change', () => {
    consentButton.disabled = !consentCheckbox.checked;
  });

  consentButton.addEventListener('click', () => {
    if (consentComplete || consentButton.disabled) {
      return;
    }
    consentComplete = true;
    revealMap(introPanel, mapPanel);
    if (typeof onConsent === 'function') {
      onConsent();
    }
  });
}

function queryElements() {
  const introPanel = document.querySelector(SELECTORS.introPanel);
  const mapPanel = document.querySelector(SELECTORS.mapPanel);
  const consentCheckbox = document.querySelector(SELECTORS.consentCheckbox);
  const consentButton = document.querySelector(SELECTORS.consentButton);

  if (!introPanel || !mapPanel || !consentCheckbox || !consentButton) {
    return null;
  }

  return { introPanel, mapPanel, consentCheckbox, consentButton };
}

function revealMap(introPanel, mapPanel) {
  introPanel.classList.add('is-hidden');
  mapPanel.classList.remove('is-hidden');
  document.body.classList.add('map-mode');
  mapPanel.setAttribute('tabindex', '-1');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  mapPanel.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  mapPanel.focus({ preventScroll: true });
  mapPanel.addEventListener('blur', () => mapPanel.removeAttribute('tabindex'), { once: true });
}
