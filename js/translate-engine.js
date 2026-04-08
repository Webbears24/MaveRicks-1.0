/**
 * ============================================================
 *  MaverRicks Green Energy — Universal Free Translation Engine
 *  FIXED: Cookie domain issue, active state on reload, EN restore
 * ============================================================
 */

(function () {
  "use strict";

  const LANGS = [
    { code: "en", gtCode: null,   label: "EN",     full: "English" },
    { code: "hi", gtCode: "hi",   label: "हिंदी", full: "Hindi"   },
    { code: "mr", gtCode: "mr",   label: "मराठी", full: "Marathi" },
  ];
  const STORAGE_KEY = "mav_lang";

  /* ── Cookie helpers ─────────────────────────────────────── */
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * FIX 1: Cookie domain problem
   * Deployed pe domain= set karne se cookie block ho sakta hai.
   * Sirf path=/ use karo — domain mat dena.
   */
  function setGoogCookie(val) {
    const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Pehle saare purane cookies clear karo
    document.cookie = "googtrans=; path=/; " + expires;
    document.cookie = "googtrans=; path=/; domain=" + window.location.hostname + "; " + expires;
    document.cookie = "googtrans=; path=/; domain=." + window.location.hostname + "; " + expires;

    if (val) {
      // Set WITHOUT domain — most reliable
      document.cookie = "googtrans=" + val + "; path=/";
    }
  }

  /* ── Detect current active language from cookie ─────────── */
  /**
   * FIX 2: Cookie se actual active language detect karo
   * localStorage sirf preference ke liye, active state = cookie
   */
  function getActiveLang() {
    const cookie = getCookie("googtrans");
    if (!cookie || cookie === "/en/en") return "en";
    const match = cookie.match(/\/en\/(\w+)/);
    if (match) return match[1];
    return "en";
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

  /* ── Trigger language change ────────────────────────────── */
  function triggerGoogleTranslate(langCode) {
    if (langCode === "en") {
      // FIX 3: English restore — cookie clear + reload
      setGoogCookie(null);
      localStorage.setItem(STORAGE_KEY, "en");

      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = "en";
        select.dispatchEvent(new Event("change"));
        // Widget ke baad bhi cookie check karo
        setTimeout(() => {
          const c = getCookie("googtrans");
          if (c && c !== "/en/en") {
            window.location.reload();
          }
        }, 1200);
      } else {
        window.location.reload();
      }
      return;
    }

    const cookieVal = "/en/" + langCode;
    setGoogCookie(cookieVal);
    localStorage.setItem(STORAGE_KEY, langCode);

    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    } else {
      window.location.reload();
    }
  }

  /* ── Build & inject floating switcher ───────────────────── */
  function injectSwitcher() {
    if (document.getElementById("mav-lang-switcher")) return;

    // FIX 2: Active = cookie se, localStorage nahi
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
        const lang   = this.dataset.lang;
        const gtCode = this.dataset.gt;
        const loading = document.getElementById("mlsw-loading");

        // Same language pe click karo to ignore
        if (lang === getActiveLang()) return;

        sw.querySelectorAll(".mlsw-btn").forEach((b) =>
          b.classList.toggle("active", b.dataset.lang === lang)
        );

        if (loading) loading.style.display = "inline-flex";
        setTimeout(() => {
          if (loading) loading.style.display = "none";
        }, 3000);

        triggerGoogleTranslate(lang === "en" ? "en" : gtCode);
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

    const currentCookie = getCookie("googtrans");
    const expectedCookie = "/en/" + saved;

    if (currentCookie === expectedCookie) return;

    // Cookie nahi hai — set karo
    setGoogCookie(expectedCookie);
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