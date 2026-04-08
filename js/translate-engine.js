/**
 * ============================================================
 *  MaverRicks Green Energy — Universal Free Translation Engine
 *  FIXED v3: Hard reload on every language switch
 * ============================================================
 */

(function () {
  "use strict";

  const LANGS = [
    { code: "en", gtCode: null,  label: "EN",     full: "English" },
    { code: "hi", gtCode: "hi",  label: "हिंदी", full: "Hindi"   },
    { code: "mr", gtCode: "mr",  label: "मराठी", full: "Marathi" },
  ];
  const STORAGE_KEY = "mav_lang";

  /* ── Cookie helpers ──────────────────────────────────────── */
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setGoogCookie(val) {
    const exp = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Clear all variants pehle
    document.cookie = "googtrans=; path=/; " + exp;
    document.cookie = "googtrans=; path=/; domain=" + window.location.hostname + "; " + exp;
    document.cookie = "googtrans=; path=/; domain=." + window.location.hostname + "; " + exp;
    if (val) {
      document.cookie = "googtrans=" + val + "; path=/";
    }
  }

  /* ── Active lang = cookie se read karo ──────────────────── */
  function getActiveLang() {
    const cookie = getCookie("googtrans");
    if (!cookie || cookie === "/en/en") return "en";
    const match = cookie.match(/\/en\/(\w+)/);
    return match ? match[1] : "en";
  }

  /* ── KEY FIX: Har switch pe cookie set + hard reload ──────
     Google Translate widget already translated page pe
     select.dispatchEvent kabhi kaam nahi karta reliably.
     Isliye: cookie set karo → reload → Google auto-translate.
  ──────────────────────────────────────────────────────────── */
  function switchLang(langCode) {
    if (langCode === "en") {
      setGoogCookie(null);
      localStorage.setItem(STORAGE_KEY, "en");
    } else {
      setGoogCookie("/en/" + langCode);
      localStorage.setItem(STORAGE_KEY, langCode);
    }
    window.location.reload();
  }

  /* ── Load Google Translate Widget ───────────────────────── */
  function loadGoogleTranslate() {
    if (document.getElementById("google-translate-script")) return;

    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.cssText = "position:absolute;top:-9999px;left:-9999px;visibility:hidden;";
    document.body.appendChild(div);

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
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);
  }

  /* ── Build & inject floating switcher ───────────────────── */
  function injectSwitcher() {
    if (document.getElementById("mav-lang-switcher")) return;

    const activeLang = getActiveLang();
    localStorage.setItem(STORAGE_KEY, activeLang);

    const sw = document.createElement("div");
    sw.id = "mav-lang-switcher";
    sw.className = "notranslate";
    sw.setAttribute("translate", "no");

    sw.innerHTML = `
      <div class="mlsw-inner">
        <span class="mlsw-globe"><i class="fa fa-globe"></i></span>
        <div class="mlsw-btns" id="mlsw-btns">
          ${LANGS.map(l => `
            <button
              class="mlsw-btn ${l.code === activeLang ? "active" : ""}"
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

    sw.querySelectorAll(".mlsw-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const lang = this.dataset.lang;
        const gt   = this.dataset.gt;

        // Same language — kuch mat karo
        if (lang === getActiveLang()) return;

        // Spinner dikhao phir switch
        const loading = document.getElementById("mlsw-loading");
        if (loading) loading.style.display = "inline-flex";

        // Active state turant update karo (before reload)
        sw.querySelectorAll(".mlsw-btn").forEach(b =>
          b.classList.toggle("active", b.dataset.lang === lang)
        );

        // Thoda delay taaki spinner dikh sake, phir reload
        setTimeout(() => {
          switchLang(lang === "en" ? "en" : gt);
        }, 150);
      });
    });

    sw.addEventListener("mouseenter", () => {
      const tip = document.getElementById("mlsw-tooltip");
      if (tip) tip.style.opacity = "1";
    });
    sw.addEventListener("mouseleave", () => {
      const tip = document.getElementById("mlsw-tooltip");
      if (tip) tip.style.opacity = "0";
    });
  }

  /* ── Hide Google banner ──────────────────────────────────── */
  function hideGoogleBanner() {
    const style = document.createElement("style");
    style.textContent = `
      .goog-te-banner-frame, #goog-gt-tt,
      .goog-te-balloon-frame, .goog-tooltip,
      .goog-tooltip-content { display: none !important; }
      .goog-te-menu-value:hover { text-decoration: none !important; }
      body { top: 0 !important; }
      .skiptranslate { display: none !important; }
      font { display: contents !important; }
    `;
    document.head.appendChild(style);
  }

  /* ── Auto restore on page load ───────────────────────────── */
  function autoRestoreLang() {
    const saved = localStorage.getItem(STORAGE_KEY) || "en";
    if (saved === "en") return;

    const current  = getCookie("googtrans");
    const expected = "/en/" + saved;
    if (current === expected) return;

    // Cookie missing — set karo (Google widget auto-translate karega)
    setGoogCookie(expected);
  }

  /* ── INIT ──────────────────────────────────────────────────── */
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