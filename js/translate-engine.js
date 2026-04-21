/**
 * ============================================================
 *  MaverRicks Green Energy — Universal Translation Engine
 *  FINAL FIXED VERSION (Vercel + Cache Safe)
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
  const SWITCH_PARAM = "_mlsw";

  /* ================= COOKIE HELPERS ================= */

  function getCookie(name) {
    const m = document.cookie.match(
      new RegExp("(?:^|;\\s*)" + name + "=([^;]*)")
    );
    return m ? decodeURIComponent(m[1]) : null;
  }

  function nukeGoogCookie() {
    const exp = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const host = window.location.hostname;

    document.cookie = `googtrans=; path=/; ${exp}`;
    document.cookie = `googtrans=; path=/; domain=${host}; ${exp}`;
    document.cookie = `googtrans=; path=/; domain=.${host}; ${exp}`;
  }

  function setGoogCookie(val) {
    nukeGoogCookie();

    if (val) {
      document.cookie = `googtrans=${val}; path=/; SameSite=Lax`;
      document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname}; SameSite=Lax`;
    }
  }

  /* ================= LANG DETECTION ================= */

  function getActiveLang() {
    const urlLang = new URLSearchParams(window.location.search).get(
      SWITCH_PARAM
    );
    if (urlLang) return urlLang;

    const cookie = getCookie("googtrans");
    if (!cookie || cookie === "/en/en") return "en";

    const m = cookie.match(/\/en\/(\w+)/);
    return m ? m[1] : "en";
  }

  /* ================= SWITCH LANGUAGE ================= */

  function switchLang(langCode) {
    nukeGoogCookie();
    localStorage.setItem(STORAGE_KEY, langCode);

    const url = new URL(window.location.href);
    url.searchParams.set(SWITCH_PARAM, langCode);

    /* 🔥 FIX: Force hard reload with cache bust */
    window.location.replace(url.toString() + "&_t=" + Date.now());
  }

  /* ================= PROCESS SWITCH ================= */

  function processSwitchParam() {
    const url = new URL(window.location.href);
    const lang = url.searchParams.get(SWITCH_PARAM);

    if (!lang) return;

    if (lang === "en") {
      nukeGoogCookie();
    } else {
      setGoogCookie("/en/" + lang);
    }

    /* 🔥 Ensure HTML lang updates */
    document.documentElement.lang = lang;

    /* Clean URL */
    url.searchParams.delete(SWITCH_PARAM);
    url.searchParams.delete("_t");
    window.history.replaceState(null, "", url.toString());
  }

  /* ================= LOAD GOOGLE TRANSLATE ================= */

  function loadGoogleTranslate() {
    if (document.getElementById("google-translate-script")) return;

    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.cssText =
      "position:absolute;top:-9999px;left:-9999px;visibility:hidden;";
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
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);
  }

  /* ================= SWITCHER UI ================= */

  function injectSwitcher() {
    if (document.getElementById("mav-lang-switcher")) return;

    const activeLang = getActiveLang();

    const sw = document.createElement("div");
    sw.id = "mav-lang-switcher";
    sw.className = "notranslate";

    sw.innerHTML = `
      <div class="mlsw-inner">
        ${LANGS.map(
      (l) => `
          <button
            class="mlsw-btn ${l.code === activeLang ? "active" : ""}"
            data-lang="${l.code}"
            data-gt="${l.gtCode || ""}"
          >${l.label}</button>
        `
    ).join("")}
      </div>
    `;

    document.body.appendChild(sw);

    sw.querySelectorAll(".mlsw-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const lang = this.dataset.lang;
        const gt = this.dataset.gt;

        if (lang === getActiveLang()) return;

        switchLang(lang === "en" ? "en" : gt);
      });
    });
  }

  /* ================= HIDE GOOGLE UI ================= */

  function hideGoogleBanner() {
    const style = document.createElement("style");
    style.textContent = `
      .goog-te-banner-frame,
      .goog-te-balloon-frame,
      .goog-tooltip,
      .goog-tooltip-content {
        display: none !important;
      }
      body { top: 0 !important; }
      .skiptranslate { display: none !important; }
      font { display: contents !important; }
    `;
    document.head.appendChild(style);
  }

  /* ================= INIT ================= */

  function init() {
    hideGoogleBanner();
    processSwitchParam();
    loadGoogleTranslate();
    injectSwitcher();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();