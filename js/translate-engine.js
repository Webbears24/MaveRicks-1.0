/**
 * ============================================================
 *  MaverRicks Green Energy — Universal Free Translation Engine
 *  FIXED v4: Cache-bust redirect + proper cookie wipe
 * ============================================================
 */

(function () {
  "use strict";

  const LANGS = [
    { code: "en", gtCode: null,  label: "EN",     full: "English" },
    { code: "hi", gtCode: "hi",  label: "हिंदी", full: "Hindi"   },
    { code: "mr", gtCode: "mr",  label: "मराठी", full: "Marathi" },
  ];
  const STORAGE_KEY  = "mav_lang";
  const SWITCH_PARAM = "_mlsw"; // cache-bust URL param

  /* ── Cookie helpers ──────────────────────────────────────── */
  function getCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  /**
   * Nuke ALL googtrans cookie variants — path + domain combos
   * Browser cached translated DOM ke liye yahi zaroori hai
   */
  function nukeGoogCookie() {
    const exp  = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const host = window.location.hostname;
    const paths = ["/"];

    // Har possible path + domain combo pe nuke karo
    paths.forEach(p => {
      document.cookie = `googtrans=; path=${p}; ${exp}`;
      document.cookie = `googtrans=; path=${p}; domain=${host}; ${exp}`;
      document.cookie = `googtrans=; path=${p}; domain=.${host}; ${exp}`;
      // SameSite variants
      document.cookie = `googtrans=; path=${p}; ${exp}; SameSite=Lax`;
      document.cookie = `googtrans=; path=${p}; domain=${host}; ${exp}; SameSite=Lax`;
    });
  }

  function setGoogCookie(val) {
    nukeGoogCookie();
    if (val) {
      document.cookie = `googtrans=${val}; path=/`;
      document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname}`;
    }
  }

  /* ── Active lang detect ──────────────────────────────────── */
  function getActiveLang() {
    // URL param se bhi check karo (switch ke time pe set hota hai)
    const urlLang = new URLSearchParams(window.location.search).get(SWITCH_PARAM);
    if (urlLang) return urlLang;

    const cookie = getCookie("googtrans");
    if (!cookie || cookie === "/en/en") return "en";
    const m = cookie.match(/\/en\/(\w+)/);
    return m ? m[1] : "en";
  }

  /* ── THE REAL FIX: Cache-bust redirect ───────────────────────
     Problem: Google Translate DOM cache persist karta hai
     sirf reload se nahi jaata — cookie bhi clear nahi hoti
     reliably deployed environments pe.

     Solution:
     1. JS se cookie nuke karo
     2. URL mein ?_mlsw=LANG add karo (cache miss force)
     3. Hard navigate (location.href) — browser fresh request bhejta hai
     4. Page load hone par: cookie set karo (agar EN nahi)
        phir ?_mlsw param URL se hata do (clean URL)
  ──────────────────────────────────────────────────────────── */
  function switchLang(langCode) {
    // Step 1: Pehle SAARE cookies nuke karo
    nukeGoogCookie();
    localStorage.setItem(STORAGE_KEY, langCode);

    // Step 2: Clean URL banao (existing _mlsw hata do)
    const url    = new URL(window.location.href);
    url.searchParams.set(SWITCH_PARAM, langCode);

    // Step 3: Hard navigate with cache-bust
    window.location.href = url.toString();
  }

  /* ── On page load: process _mlsw param if present ───────── */
  function processSwitchParam() {
    const url    = new URL(window.location.href);
    const lang   = url.searchParams.get(SWITCH_PARAM);
    if (!lang) return;

    // Cookie set karo ab (page fresh load hua hai)
    if (lang === "en") {
      nukeGoogCookie();
    } else {
      setGoogCookie("/en/" + lang);
    }

    // URL se param hata do (clean URL)
    url.searchParams.delete(SWITCH_PARAM);
    window.history.replaceState(null, "", url.toString());
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

        if (lang === getActiveLang()) return;

        // Spinner + active state update
        const loading = document.getElementById("mlsw-loading");
        if (loading) loading.style.display = "inline-flex";
        sw.querySelectorAll(".mlsw-btn").forEach(b =>
          b.classList.toggle("active", b.dataset.lang === lang)
        );

        setTimeout(() => {
          switchLang(lang === "en" ? "en" : gt);
        }, 120);
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

  /* ── INIT ──────────────────────────────────────────────────── */
  function init() {
    hideGoogleBanner();
    processSwitchParam(); // _mlsw URL param handle karo sabse pehle
    loadGoogleTranslate();
    injectSwitcher();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();