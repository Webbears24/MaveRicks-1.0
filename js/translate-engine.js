/**
 * ============================================================
 *  MaverRicks Green Energy — Universal Free Translation Engine
 *  Uses Google Translate Widget (FREE — no API key needed)
 *
 *  HOW TO USE — Har page ke <head> tag mein sirf ye 2 lines:
 *
 *  <link  rel="stylesheet" href="js/translate-engine.css">
 *  <script src="js/translate-engine.js"></script>
 *
 *  Bas! Kuch aur karne ki zaroorat nahi.
 * ============================================================
 */

(function () {
  "use strict";

  /* ── CONFIG ─────────────────────────────────────────── */
  const LANGS = [
    { code: "en", gtCode: null,    label: "EN",      full: "English" },
    { code: "hi", gtCode: "hi",    label: "हिंदी",  full: "Hindi"   },
    { code: "mr", gtCode: "mr",    label: "मराठी",  full: "Marathi" },
  ];
  const STORAGE_KEY = "mav_lang";

  /* ── INJECT GOOGLE TRANSLATE SCRIPT (once) ──────────── */
  function loadGoogleTranslate() {
    if (document.getElementById("google-translate-script")) return;

    // Hidden container required by Google Translate widget
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.cssText = "position:absolute;top:-9999px;left:-9999px;visibility:hidden;";
    document.body.appendChild(div);

    // Define callback before loading script
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "hi,mr,en",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
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

  /* ── TRIGGER GOOGLE TRANSLATE TO A LANGUAGE ─────────── */
  function triggerGoogleTranslate(langCode) {
    // Google Translate sets a cookie named googtrans=/en/LANG
    // Setting this cookie + reloading triggers translation
    if (langCode === "en") {
      // Remove translation — restore original
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "googtrans=; path=/; domain=" + window.location.hostname + "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // Try to use Google's own restore if widget loaded
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = "en";
        select.dispatchEvent(new Event("change"));
      } else {
        // Fallback: reload without cookie
        window.location.reload();
      }
      return;
    }

    // Set googtrans cookie for target language
    const cookieVal = "/en/" + langCode;
    document.cookie = "googtrans=" + cookieVal + "; path=/";
    document.cookie =
      "googtrans=" + cookieVal +
      "; path=/; domain=" + window.location.hostname;

    // Try using widget select element if available
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    } else {
      // Widget not ready yet — reload, cookie will trigger auto-translate
      window.location.reload();
    }
  }

  /* ── BUILD & INJECT FLOATING SWITCHER ───────────────── */
  function injectSwitcher() {
    if (document.getElementById("mav-lang-switcher")) return;

    const sw = document.createElement("div");
    sw.id = "mav-lang-switcher";
    sw.className = "notranslate"; // prevent Google from translating the switcher itself
    sw.setAttribute("translate", "no");

    const saved = localStorage.getItem(STORAGE_KEY) || "en";

    sw.innerHTML = `
      <div class="mlsw-inner">
        <span class="mlsw-globe"><i class="fa fa-globe"></i></span>
        <div class="mlsw-btns" id="mlsw-btns">
          ${LANGS.map(l => `
            <button
              class="mlsw-btn ${l.code === saved ? "active" : ""}"
              data-lang="${l.code}"
              data-gt="${l.gtCode || ""}"
              title="${l.full}"
              translate="no"
            >${l.label}</button>
          `).join("")}
        </div>
        <span class="mlsw-loading" id="mlsw-loading" style="display:none;">
          <span class="mlsw-spinner"></span>
        </span>
      </div>
      <div class="mlsw-tooltip" id="mlsw-tooltip">भाषा बदलें / भाषा बदला</div>
    `;

    document.body.appendChild(sw);

    // Button click handler
    sw.querySelectorAll(".mlsw-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const lang    = this.dataset.lang;
        const gtCode  = this.dataset.gt;
        const loading = document.getElementById("mlsw-loading");

        // Update active state
        sw.querySelectorAll(".mlsw-btn").forEach((b) =>
          b.classList.toggle("active", b.dataset.lang === lang)
        );

        localStorage.setItem(STORAGE_KEY, lang);

        // Show spinner briefly
        if (loading) loading.style.display = "inline-flex";
        setTimeout(() => {
          if (loading) loading.style.display = "none";
        }, 2500);

        triggerGoogleTranslate(lang === "en" ? "en" : gtCode);
      });
    });

    // Hover tooltip
    sw.addEventListener("mouseenter", () => {
      const tip = document.getElementById("mlsw-tooltip");
      if (tip) tip.style.opacity = "1";
    });
    sw.addEventListener("mouseleave", () => {
      const tip = document.getElementById("mlsw-tooltip");
      if (tip) tip.style.opacity = "0";
    });
  }

  /* ── HIDE GOOGLE'S OWN UGLY BANNER ──────────────────── */
  function hideGoogleBanner() {
    const style = document.createElement("style");
    style.textContent = `
      /* Hide Google Translate top bar / banner */
      .goog-te-banner-frame, #goog-gt-tt,
      .goog-te-balloon-frame, .goog-tooltip,
      .goog-tooltip-content { display: none !important; }
      .goog-te-menu-value:hover { text-decoration: none !important; }
      body { top: 0 !important; }
      .skiptranslate { display: none !important; }
      /* Fix font rendering after Google Translate */
      font { display: contents !important; }
    `;
    document.head.appendChild(style);
  }

  /* ── AUTO RESTORE LAST LANGUAGE ─────────────────────── */
  function autoRestoreLang() {
    const saved = localStorage.getItem(STORAGE_KEY) || "en";
    if (saved === "en") return;

    // Check if page already has the googtrans cookie (means already translated)
    const alreadyTranslated = document.cookie.includes("googtrans=/en/" + saved);
    if (!alreadyTranslated) {
      // Set cookie so Google auto-translates on next load
      document.cookie = "googtrans=/en/" + saved + "; path=/";
      document.cookie =
        "googtrans=/en/" + saved +
        "; path=/; domain=" + window.location.hostname;
    }
  }

  /* ── INIT ────────────────────────────────────────────── */
  function init() {
    hideGoogleBanner();
    autoRestoreLang();
    loadGoogleTranslate();
    injectSwitcher();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();