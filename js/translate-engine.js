/**
 * ============================================================
 *  MaverRicks Green Energy — Translation Engine
 *  Vercel / CDN Safe — No cookie dependency
 * ============================================================
 */
(function () {
  "use strict";

  const LANGS = [
    { code: "en", gtCode: null, label: "EN", full: "English" },
    { code: "hi", gtCode: "hi", label: "हिंदी", full: "Hindi" },
    { code: "mr", gtCode: "mr", label: "मराठी", full: "Marathi" },
  ];

  const STORAGE_KEY = "mav_lang";

  /* ─── COOKIE NUKE (belt + suspenders) ─────────────── */
  function nukeAllCookies() {
    const host = window.location.hostname;
    const past = "expires=Thu,01 Jan 1970 00:00:00 GMT";
    [
      `googtrans=;path=/;${past}`,
      `googtrans=;path=/;domain=${host};${past}`,
      `googtrans=;path=/;domain=.${host};${past}`,
    ].forEach(c => { document.cookie = c; });
  }

  /* ─── HIDE GOOGLE BANNER ───────────────────────────── */
  function hideGoogleUI() {
    const s = document.createElement("style");
    s.textContent = `
      .goog-te-banner-frame,.goog-te-balloon-frame,
      .goog-tooltip,.goog-tooltip-content,
      #goog-gt-tt,.skiptranslate { display:none!important; }
      body { top:0!important; }
      font { display:contents!important; }
    `;
    document.head.appendChild(s);
  }

  /* ─── INJECT GOOGLE TRANSLATE WIDGET ──────────────── */
  function injectGTWidget(targetLang, cb) {
    // Remove old widget if exists
    const oldScript = document.getElementById("gt-script");
    const oldDiv = document.getElementById("google_translate_element");
    if (oldScript) oldScript.remove();
    if (oldDiv) oldDiv.remove();
    if (window.google && window.google.translate) {
      delete window.google.translate;
    }

    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
    document.body.appendChild(div);

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "hi,mr,en",
          autoDisplay: false,
        },
        "google_translate_element"
      );
      // Wait for widget to render then trigger
      setTimeout(function () {
        const combo = document.querySelector(".goog-te-combo");
        if (combo && targetLang) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event("change"));
        }
        if (cb) cb();
      }, 800);
    };

    const script = document.createElement("script");
    script.id = "gt-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&t=" + Date.now();
    script.async = true;
    document.head.appendChild(script);
  }

  /* ─── SWITCH TO ENGLISH (restore original) ─────────── */
  function switchToEnglish() {
    nukeAllCookies();
    localStorage.setItem(STORAGE_KEY, "en");

    // Method 1: Try Google's own "show original" mechanism
    const bar = document.querySelector(".goog-te-banner-frame");
    if (bar) {
      try {
        const barDoc = bar.contentDocument || bar.contentWindow.document;
        const showOrigBtn = barDoc.querySelector("[id='rev']") ||
          barDoc.querySelector("a");
        if (showOrigBtn) showOrigBtn.click();
      } catch (e) { }
    }

    // Method 2: Use combo select = en
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = "en";
      combo.dispatchEvent(new Event("change"));
      // After brief moment, hard reload to clear all translation state
      setTimeout(function () {
        nukeAllCookies();
        // Reload with cache bust, no lang param
        window.location.href = cleanUrl() + "?_r=" + Date.now() + "#";
      }, 500);
      return;
    }

    // Method 3: Hard reload — cleanest fallback
    nukeAllCookies();
    window.location.href = cleanUrl() + "?_r=" + Date.now();
  }

  /* ─── GET CLEAN URL (remove our params) ────────────── */
  function cleanUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("_r");
    url.searchParams.delete("_mlsw");
    url.searchParams.delete("_t");
    return url.origin + url.pathname;
  }

  /* ─── SWITCH TO A LANGUAGE ──────────────────────────── */
  function switchLang(langCode) {
    if (langCode === "en") {
      switchToEnglish();
      return;
    }

    localStorage.setItem(STORAGE_KEY, langCode);

    // Set googtrans cookie
    const val = "/en/" + langCode;
    nukeAllCookies();
    document.cookie = "googtrans=" + val + ";path=/;SameSite=Lax";
    document.cookie = "googtrans=" + val + ";path=/;domain=" + window.location.hostname + ";SameSite=Lax";

    // Try combo select first (widget already loaded)
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change"));
      return;
    }

    // Widget not loaded yet — reload with cookie (cookie will auto-trigger GT)
    window.location.href = cleanUrl() + "?_r=" + Date.now();
  }

  /* ─── INJECT SWITCHER UI ────────────────────────────── */
  function injectSwitcher() {
    if (document.getElementById("mav-lang-switcher")) return;

    const saved = getActiveLang();

    const sw = document.createElement("div");
    sw.id = "mav-lang-switcher";
    sw.className = "notranslate";
    sw.setAttribute("translate", "no");

    sw.innerHTML =
      '<div class="mlsw-inner">' +
      '<span class="mlsw-globe notranslate" translate="no"><i class="fa fa-globe"></i></span>' +
      '<div class="mlsw-btns">' +
      LANGS.map(function (l) {
        return '<button class="mlsw-btn' + (l.code === saved ? ' active' : '') + '" ' +
          'data-lang="' + l.code + '" data-gt="' + (l.gtCode || '') + '" ' +
          'translate="no">' + l.label + '</button>';
      }).join('') +
      '</div>' +
      '<span class="mlsw-loading" id="mlsw-loading" style="display:none;">' +
      '<span class="mlsw-spinner"></span>' +
      '</span>' +
      '</div>' +
      '<div class="mlsw-tooltip">भाषा बदलें / भाषा बदला</div>';

    document.body.appendChild(sw);

    sw.querySelectorAll(".mlsw-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const lang = this.dataset.lang;
        const gtCode = this.dataset.gt;
        const current = getActiveLang();

        if (lang === current) return;

        // Update UI immediately
        sw.querySelectorAll(".mlsw-btn").forEach(function (b) {
          b.classList.toggle("active", b.dataset.lang === lang);
        });

        // Show loader
        const loader = document.getElementById("mlsw-loading");
        if (loader) loader.style.display = "inline-flex";

        switchLang(lang === "en" ? "en" : gtCode);
      });
    });

    sw.addEventListener("mouseenter", function () {
      const tip = sw.querySelector(".mlsw-tooltip");
      if (tip) tip.style.opacity = "1";
    });
    sw.addEventListener("mouseleave", function () {
      const tip = sw.querySelector(".mlsw-tooltip");
      if (tip) tip.style.opacity = "0";
    });
  }

  /* ─── GET ACTIVE LANG ───────────────────────────────── */
  function getActiveLang() {
    // If _r param exists → this is a clean reload → return EN
    if (window.location.search.indexOf("_r=") !== -1) {
      return "en";
    }

    // Check cookie
    const cookieMatch = document.cookie.match(/googtrans=\/en\/(\w+)/);
    if (cookieMatch && cookieMatch[1] !== "en") {
      return cookieMatch[1];
    }

    return localStorage.getItem(STORAGE_KEY) || "en";
  }

  /* ─── AUTO RESTORE ON LOAD ──────────────────────────── */
  function autoRestore() {
    // Clean reload → nuke everything, stay English
    if (window.location.search.indexOf("_r=") !== -1) {
      nukeAllCookies();
      localStorage.setItem(STORAGE_KEY, "en");
      // Clean URL silently
      const clean = cleanUrl();
      window.history.replaceState(null, "", clean);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY) || "en";

    if (saved === "en") {
      nukeAllCookies();
      return;
    }

    // Non-English: ensure cookie is set for Google to auto-translate
    const hasCookie = document.cookie.indexOf("googtrans=/en/" + saved) !== -1;
    if (!hasCookie) {
      const val = "/en/" + saved;
      document.cookie = "googtrans=" + val + ";path=/;SameSite=Lax";
      document.cookie = "googtrans=" + val + ";path=/;domain=" + window.location.hostname + ";SameSite=Lax";
    }
  }

  /* ─── INIT ──────────────────────────────────────────── */
  function init() {
    hideGoogleUI();
    autoRestore();

    const saved = localStorage.getItem(STORAGE_KEY) || "en";

    // Load Google Translate widget
    if (!document.getElementById("gt-script")) {
      const div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
      document.body.appendChild(div);

      window.googleTranslateElementInit = function () {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", includedLanguages: "hi,mr,en", autoDisplay: false },
          "google_translate_element"
        );
      };

      const script = document.createElement("script");
      script.id = "gt-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.head.appendChild(script);
    }

    injectSwitcher();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();