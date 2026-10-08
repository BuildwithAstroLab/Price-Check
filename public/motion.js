/**
 * PriceCheck Coherent Motion System — Runtime Helper
 * Restrained, responsive, accessible, zero business logic side-effects
 */
(function () {
  "use strict";

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function initScrollReveal() {
    if (prefersReducedMotion.matches) return;

    // Elements to reveal on scroll
    const selectors = [
      ".reveal-on-scroll",
      ".public-section",
      ".feature-card",
      ".price-card",
      ".step-card",
      ".faq-item",
      ".hero-pricing-preview",
      ".public-grid",
      ".card",
    ];

    const targets = document.querySelectorAll(selectors.join(", "));
    if (!targets.length) return;

    targets.forEach((el) => {
      if (!el.classList.contains("reveal-on-scroll")) {
        el.classList.add("reveal-on-scroll");
      }
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
      );

      targets.forEach((el) => observer.observe(el));
    } else {
      // Fallback for older browsers
      targets.forEach((el) => el.classList.add("is-revealed"));
    }
  }

  function initRangeSliders() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach((input) => {
      const updateTrack = () => {
        const min = Number(input.min) || 0;
        const max = Number(input.max) || 100;
        const val = Number(input.value) || 0;
        const pct = ((val - min) / (max - min)) * 100;
        input.style.setProperty("--range-pct", `${pct}%`);
      };

      input.addEventListener("input", updateTrack);
      updateTrack();
    });
  }

  function initKeyboardFocus() {
    // Distinguish keyboard navigation from mouse clicks for focus rings
    window.addEventListener("keydown", function handleKeydown(e) {
      if (e.key === "Tab") {
        document.body.classList.add("user-is-tabbing");
      }
    });

    window.addEventListener("mousedown", function handleMousedown() {
      document.body.classList.remove("user-is-tabbing");
    });
  }

  function updateThemeToggleState() {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (!toggleBtn) return;

    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    toggleBtn.setAttribute("aria-pressed", String(isLight));
    toggleBtn.setAttribute(
      "aria-label",
      isLight ? "Switch to premium dark mode" : "Switch to classy light mode",
    );
    toggleBtn.title = isLight
      ? "Switch to premium dark mode"
      : "Switch to classy light mode";
  }

  function initThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (!toggleBtn) return;

    updateThemeToggleState();

    toggleBtn.addEventListener("click", function () {
      const isLight =
        document.documentElement.getAttribute("data-theme") === "light";
      const nextTheme = isLight ? "dark" : "light";

      document.documentElement.classList.add("theme-transition");
      if (nextTheme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }

      try {
        localStorage.setItem("pricecheck_theme", nextTheme);
      } catch (e) {}

      updateThemeToggleState();

      setTimeout(function () {
        document.documentElement.classList.remove("theme-transition");
      }, 250);
    });
  }

  // Initialize once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initThemeToggle();
      initScrollReveal();
      initRangeSliders();
      initKeyboardFocus();
    });
  } else {
    initThemeToggle();
    initScrollReveal();
    initRangeSliders();
    initKeyboardFocus();
  }
})();
