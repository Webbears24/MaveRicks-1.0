/**
 * ============================================================
 *  MaverRicks Green Energy — Universal Free Translation Engine
 *  Uses Google Translate Widget (FREE — no API key needed)
 * ============================================================
 */

(function () {
  "use strict";

  const LANGS = [
    { code: "en", gtCode: null, label: "EN",     full: "English" },
    { code: "hi", gtCode: "hi", label: "हिंदी", full: "Hindi"   },
    { code: "mr", gtCode: "mr", label: "मराठी", full: "Marathi" },
  ];
  const STORAGE_KEY = "mav_lang";

  /* ── COOKIE HELPERS ──────────────────────────────────── */
  function setCookie(name, value) {
    document.cookie = name + "=" + value + "; path=/";
    document.cookie = name + "=" + value + "; path=/; domain=" + window.location.hostname;
  }

  function deleteCookie(name) {
    var past = "Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = name + "=; expires=" + past + "; path=/";
    document.cookie = name + "=; expires=" + past + "; path=/; domain=" + window.location.hostname;
    document.cookie = name + "=; expires=" + past + "; path=/; domain=." + window.location.hostname;
  }

  /* ── DETECT CLEAN EN RELOAD ──────────────────────────── */
  function isCleanReload() {
    return window.location.search.indexOf("notranslate=1") !== -1;
  }

  /* ── LOAD GOOGLE TRANSLATE ───────────────────────────── */
  function loadGoogleTranslate() {
    if (document.getElementById("google-translate-script")) return;

    var div = document.createElement("div");
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

    var script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);
  }

  /* ── RESTORE ENGLISH ─────────────────────────────────── */
  function restoreEnglish() {
    // 1. Nuke the cookie
    deleteCookie("googtrans");
    localStorage.setItem(STORAGE_KEY, "en");

    // 2. Try widget select first
    var select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = "en";
      select.dispatchEvent(new Event("change"));
    }

    // 3. After brief delay, hard reload WITHOUT googtrans cookie
    setTimeout(function () {
      deleteCookie("googtrans"); // delete again in case widget re-set it
      // Use ?notranslate=1 so we know this is a clean EN load
      var cleanUrl = window.location.pathname + "?notranslate=1";
      window.location.replace(cleanUrl);
    }, 400);
  }

  /* ── SWITCH TO LANGUAGE ──────────────────────────────── */
  function switchLang(langCode) {
    if (langCode === "en") {
      restoreEnglish();
      return;
    }

    var cookieVal = "/en/" + langCode;
    setCookie("googtrans", cookieVal);

    var select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    } else {
      window.location.reload();
    }
  }

  /* ── INJECT SWITCHER UI ──────────────────────────────── */
  function injectSwitcher() {
    if (document.getElementById("mav-lang-switcher")) return;

    // On clean reload, force EN active
    var saved = isCleanReload() ? "en" : (localStorage.getItem(STORAGE_KEY) || "en");
    if (isCleanReload()) localStorage.setItem(STORAGE_KEY, "en");

    var sw = document.createElement("div");
    sw.id = "mav-lang-switcher";
    sw.className = "notranslate";
    sw.setAttribute("translate", "no");

    sw.innerHTML =
      '<div class="mlsw-inner">' +
        '<span class="mlsw-globe"><i class="fa fa-globe"></i></span>' +
        '<div class="mlsw-btns" id="mlsw-btns">' +
          LANGS.map(function (l) {
            return '<button class="mlsw-btn ' + (l.code === saved ? "active" : "") + '" ' +
              'data-lang="' + l.code + '" data-gt="' + (l.gtCode || "") + '" ' +
              'title="' + l.full + '" translate="no">' + l.label + '</button>';
          }).join("") +
        '</div>' +
        '<span class="mlsw-loading" id="mlsw-loading" style="display:none;">' +
          '<span class="mlsw-spinner"></span>' +
        '</span>' +
      '</div>' +
      '<div class="mlsw-tooltip" id="mlsw-tooltip">भाषा बदलें / भाषा बदला</div>';

    document.body.appendChild(sw);

    sw.querySelectorAll(".mlsw-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang    = this.dataset.lang;
        var gtCode  = this.dataset.gt;
        var loading = document.getElementById("mlsw-loading");

        sw.querySelectorAll(".mlsw-btn").forEach(function (b) {
          b.classList.toggle("active", b.dataset.lang === lang);
        });

        localStorage.setItem(STORAGE_KEY, lang);

        if (loading) loading.style.display = "inline-flex";
        setTimeout(function () {
          if (loading) loading.style.display = "none";
        }, 2500);

        switchLang(lang === "en" ? "en" : gtCode);
      });
    });

    sw.addEventListener("mouseenter", function () {
      var tip = document.getElementById("mlsw-tooltip");
      if (tip) tip.style.opacity = "1";
    });
    sw.addEventListener("mouseleave", function () {
      var tip = document.getElementById("mlsw-tooltip");
      if (tip) tip.style.opacity = "0";
    });
  }

  /* ── HIDE GOOGLE BANNER ──────────────────────────────── */
  function hideGoogleBanner() {
    var style = document.createElement("style");
    style.textContent =
      ".goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame," +
      ".goog-tooltip,.goog-tooltip-content{display:none!important;}" +
      ".goog-te-menu-value:hover{text-decoration:none!important;}" +
      "body{top:0!important;}" +
      ".skiptranslate{display:none!important;}" +
      "font{display:contents!important;}";
    document.head.appendChild(style);
  }

  /* ── AUTO RESTORE LAST LANG ON PAGE LOAD ────────────── */
  function autoRestoreLang() {
    // Clean EN reload — nuke cookie, do nothing else
    if (isCleanReload()) {
      deleteCookie("googtrans");
      return;
    }

    var saved = localStorage.getItem(STORAGE_KEY) || "en";

    if (saved === "en") {
      // Always nuke cookie when saved lang is EN
      deleteCookie("googtrans");
      return;
    }

    // Non-EN: set cookie if not already set
    if (document.cookie.indexOf("googtrans=/en/" + saved) === -1) {
      setCookie("googtrans", "/en/" + saved);
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