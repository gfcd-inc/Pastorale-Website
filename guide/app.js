/* ============================================
   Pastorale Guest Guide – App Controller
   ============================================ */

(function () {
  'use strict';

  // ─── State ───
  let currentLang = 'ja';
  let currentSection = 'home';
  let translations = {};

  // ─── DOM refs ───
  const tabButtons = document.querySelectorAll('.tab-nav__btn');
  const sections = document.querySelectorAll('.section');
  const langButtons = document.querySelectorAll('.lang-btn');
  const homeCards = document.querySelectorAll('.home-card[data-goto]');
  const copyButtons = document.querySelectorAll('.copy-btn');

  // ─── Section Navigation ───
  function switchSection(sectionId) {
    currentSection = sectionId;

    sections.forEach((s) => s.classList.remove('active'));
    tabButtons.forEach((b) => b.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
    }

    const activeTab = document.querySelector(`.tab-nav__btn[data-section="${sectionId}"]`);
    if (activeTab) activeTab.classList.add('active');
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      switchSection(btn.dataset.section);
    });
  });

  homeCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(card.dataset.goto);
    });
  });

  // ─── Language Switching ───
  async function loadLanguage(lang) {
    try {
      const res = await fetch(`data/content-${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      translations = await res.json();
      currentLang = lang;
      applyTranslations();
      updateLangButtons();
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    } catch (err) {
      console.error(`Failed to load language: ${lang}`, err);
    }
  }

  function applyTranslations() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (translations[key] === undefined) return;

      // For elements with list items (ol, ul) or formatted HTML
      if (el.tagName === 'OL' || el.tagName === 'UL') {
        el.innerHTML = translations[key];
      } else if (translations[key].includes('<li>')) {
        el.innerHTML = translations[key];
      } else {
        el.textContent = translations[key];
      }
    });

    // Aria labels
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.dataset['i18nAria'];
      if (translations[key]) {
        el.setAttribute('aria-label', translations[key]);
      }
    });
  }

  function updateLangButtons() {
    langButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
  }

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang !== currentLang) {
        loadLanguage(btn.dataset.lang);
      }
    });
  });

  // ─── Copy to Clipboard ───
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.copy;
      const target = document.getElementById(targetId);
      if (!target) return;

      const text = target.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1500);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1500);
      }
    });
  });

  // ─── Service Worker Registration ───
  async function registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('sw.js');
      } catch (err) {
        console.error('SW registration failed:', err);
      }
    }
  }

  // ─── Init ───
  function init() {
    // Detect browser language for initial load
    const browserLang = navigator.language?.slice(0, 2);
    const supportedLangs = ['ja', 'en', 'zh'];
    const initialLang = supportedLangs.includes(browserLang) ? browserLang : 'ja';

    loadLanguage(initialLang);
    registerSW();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
