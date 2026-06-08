/* ===== I18n Engine ===== */
const I18nEngine = {
  currentLang: 'es',
  translations: {},

  init() {
    this.currentLang = localStorage.getItem('gp-lang') || 'es';
    // Load from global objects set by script tags (works with file://)
    if (typeof window.__es !== 'undefined' && typeof window.__en !== 'undefined') {
      this.translations = this.currentLang === 'en' ? window.__en : window.__es;
      this.applyTranslation();
    } else {
      console.warn('[I18nEngine] Translation data not found. Ensure i18n/es.js and i18n/en.js are loaded.');
    }
    this.setupToggle();
  },

  // No loadTranslations needed — data is loaded via <script> tags (works with file://)

  applyTranslation() {
    // Collect all translation keys used in HTML for debugging
    const missingKeys = [];

    // Walk all [data-i18n] and replace textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.getNestedValue(key);
      if (!translation) {
        if (!missingKeys.includes(key)) missingKeys.push(key);
        return;
      }

      // Handle different element types
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', translation);
        }
      } else if (el.tagName === 'IMG') {
        el.setAttribute('alt', translation);
      } else {
        el.innerHTML = translation;
      }
    });

    // Handle aria-labels (separate from text content)
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const translation = this.getNestedValue(key);
      if (translation) el.setAttribute('aria-label', translation);
    });

    // Log missing keys (visible in browser console)
    if (missingKeys.length > 0) {
      console.warn('[I18nEngine] Missing translations for keys:', missingKeys);
    }

    // Update html lang
    document.documentElement.lang = this.currentLang === 'en' ? 'en' : 'es';

    // Determine page-specific meta key
    const metaSuffix = document.documentElement.getAttribute('data-i18n-meta') || '';
    const pageMeta = this.translations[`_meta${metaSuffix}`];

    // Update meta tags
    const metaTitle = document.querySelector('title');
    const metaDesc = document.querySelector('meta[name="description"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');

    if (metaTitle && pageMeta?.title) metaTitle.textContent = pageMeta.title;
    if (metaDesc && pageMeta?.description) metaDesc.setAttribute('content', pageMeta.description);
    if (ogDesc && pageMeta?.og_description) ogDesc.setAttribute('content', pageMeta.og_description);
    if (ogLocale) ogLocale.setAttribute('content', this.currentLang === 'en' ? 'en_US' : 'es_LA');

    // Update JSON-LD if present
    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld && pageMeta?.ld_description) {
      try {
        const data = JSON.parse(ld.textContent);
        data.description = pageMeta.ld_description;
        ld.textContent = JSON.stringify(data);
      } catch(e) {}
    }

    // Update toggle buttons text
    document.querySelectorAll('.lang-toggle').forEach(toggle => {
      toggle.textContent = this.currentLang === 'en' ? 'ES' : 'EN';
    });
  },

  getNestedValue(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.translations);
  },

  t(key) {
    return this.getNestedValue(key) || '';
  },

  setupToggle() {
    const toggles = document.querySelectorAll('.lang-toggle');
    if (!toggles.length) return;
    toggles.forEach(toggle => {
      toggle.textContent = this.currentLang === 'en' ? 'ES' : 'EN';
      toggle.addEventListener('click', () => {
        const newLang = this.currentLang === 'en' ? 'es' : 'en';
        this.currentLang = newLang;
        this.translations = newLang === 'en' ? window.__en : window.__es;
        this.applyTranslation();
        localStorage.setItem('gp-lang', newLang);
      });
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18nEngine.init());
} else {
  I18nEngine.init();
}

/* ===== FAQ Accordion ===== */
const faqTriggers = document.querySelectorAll('.faq-trigger');

faqTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.faq-item');
    if (!item) return;

    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    faqTriggers.forEach((node) => {
      node.setAttribute('aria-expanded', 'false');
      node.closest('.faq-item')?.classList.remove('is-open');
    });

    if (!expanded) {
      trigger.setAttribute('aria-expanded', 'true');
      item.classList.add('is-open');
    }
  });
});

const revealNodes = document.querySelectorAll('.reveal');

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -36px 0px'
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('visible'));
}

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobileNav');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');
const mobileNavClose = document.querySelector('.mobile-nav-close');
const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

function openMobileNav() {
  if (!mobileNav) return;
  mobileNav.classList.add('is-open');
  mobileNav.setAttribute('aria-hidden', 'false');
  if (mobileNavOverlay) mobileNavOverlay.classList.add('is-open');
  if (menuToggle) {
    menuToggle.classList.add('is-active');
    menuToggle.setAttribute('aria-expanded', 'true');
  }
  document.body.classList.add('mobile-nav-open');
  if (mobileNavClose) mobileNavClose.focus();
}

function closeMobileNav() {
  if (!mobileNav) return;
  mobileNav.classList.remove('is-open');
  mobileNav.setAttribute('aria-hidden', 'true');
  if (mobileNavOverlay) mobileNavOverlay.classList.remove('is-open');
  if (menuToggle) {
    menuToggle.classList.remove('is-active');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  document.body.classList.remove('mobile-nav-open');
  if (menuToggle) menuToggle.focus();
}

if (menuToggle) menuToggle.addEventListener('click', openMobileNav);
if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);

mobileNavLinks.forEach((link) => {
  link.addEventListener('click', closeMobileNav);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('is-open')) {
    closeMobileNav();
  }
});

const telefonoInput = document.getElementById('telefono');
const viaPreferidaGroup = document.getElementById('via-preferida-group');

if (telefonoInput && viaPreferidaGroup) {
  telefonoInput.addEventListener('input', () => {
    if (telefonoInput.value.trim() !== '') {
      viaPreferidaGroup.style.display = 'block';
    } else {
      viaPreferidaGroup.style.display = 'none';
    }
  });
}

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    const existingStatus = contactForm.querySelector('.form-status');
    if (existingStatus) existingStatus.remove();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = I18nEngine.t('contact.form.sending') || 'Enviando...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: {
          'Accept': 'application/json'
        }
      });

      const statusDiv = document.createElement('div');
      statusDiv.className = 'form-status';

      if (response.ok) {
        statusDiv.classList.add('success');
        statusDiv.textContent = I18nEngine.t('contact.form.success') || '¡Gracias! Su mensaje ha sido enviado correctamente. Nos pondremos en contacto pronto.';
        contactForm.reset();
        if (viaPreferidaGroup) viaPreferidaGroup.style.display = 'none';
      } else {
        statusDiv.classList.add('error');
        const data = await response.json();
        statusDiv.textContent = data.error || (I18nEngine.t('contact.form.error') || 'Hubo un problema al enviar el mensaje. Por favor intente de nuevo.');
      }

      contactForm.appendChild(statusDiv);
    } catch (error) {
      const statusDiv = document.createElement('div');
      statusDiv.className = 'form-status error';
      statusDiv.textContent = I18nEngine.t('contact.form.error_connection') || 'Hubo un error de conexión. Por favor intente de nuevo.';
      contactForm.appendChild(statusDiv);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}
