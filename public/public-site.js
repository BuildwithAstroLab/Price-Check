(function () {
  "use strict";

  const STORAGE_KEY = "pricecheck_theme";

  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch {}

    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    const toggle = document.getElementById("theme-toggle-btn");
    if (!toggle) return;

    const isLight = theme === "light";
    toggle.setAttribute("aria-pressed", String(isLight));
    toggle.setAttribute(
      "aria-label",
      isLight ? "Switch to premium dark mode" : "Switch to classy light mode",
    );
    toggle.title = isLight
      ? "Switch to premium dark mode"
      : "Switch to classy light mode";
  }

  function updateTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    applyTheme(theme);
  }

  function wireThemeToggle() {
    const existing = document.getElementById("theme-toggle-btn");
    if (existing) {
      existing.addEventListener("click", () => {
        const nextTheme =
          document.documentElement.getAttribute("data-theme") === "light"
            ? "dark"
            : "light";
        updateTheme(nextTheme);
      });
      return;
    }

    const header = document.querySelector("header.public-nav, header.nav");
    if (!header) return;

    const wrap = document.createElement("div");
    wrap.className = "public-theme-toggle-wrap";

    const button = document.createElement("button");
    button.id = "theme-toggle-btn";
    button.type = "button";
    button.className = "theme-toggle-btn";
    button.setAttribute("aria-label", "Switch appearance mode");
    button.setAttribute("aria-pressed", "false");
    button.title = "Switch appearance mode";
    button.innerHTML = `
      <svg class="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      </svg>
      <svg class="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
    `;

    button.addEventListener("click", () => {
      const nextTheme =
        document.documentElement.getAttribute("data-theme") === "light"
          ? "dark"
          : "light";
      updateTheme(nextTheme);
    });

    wrap.appendChild(button);
    header.appendChild(wrap);
  }

  const menuButton = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-public-menu]");
  if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
  }

  applyTheme(getPreferredTheme());
  wireThemeToggle();

  function addNavLink(nav, label, href, className = "", navItem = "") {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (className) link.className = className;
    if (navItem) link.dataset.navItem = navItem;
    nav.appendChild(link);
  }

  function renderAuthenticatedNavbar(user) {
    const nav = document.querySelector("[data-public-menu]");
    const header = document.querySelector("header.public-nav");
    if (!nav || !header) return;
    nav.replaceChildren();
    addNavLink(nav, "Dashboard", "/estimate");
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const rolePermissions = {
      Owner: ["pricing", "access", "analytics", "telemetry"],
      "Super Admin": ["pricing", "access", "analytics", "telemetry"],
      "Pricing Manager": ["pricing", "analytics"],
      Analyst: ["analytics"],
    };
    const allowed = permissions.length
      ? permissions
      : rolePermissions[user.role] || (user.isAdmin ? ["analytics"] : []);
    if (allowed.length) addNavLink(nav, "Admin", "/admin");

    const account = document.createElement("details");
    account.className = "public-account-menu";
    const summary = document.createElement("summary");
    summary.textContent = user.name || user.email || "Account";
    account.appendChild(summary);
    const signout = document.createElement("button");
    signout.type = "button";
    signout.className = "auth-signout";
    signout.textContent = "Sign out";
    signout.addEventListener("click", async () => {
      signout.disabled = true;
      try {
        const response = await fetch("/api/auth/signout", { method: "POST" });
        if (!response.ok) throw new Error("Sign out could not be completed.");
        document.body.dataset.authState = "public";
        renderPublicNavbar();
      } catch {
        signout.disabled = false;
      }
    });
    account.appendChild(signout);
    nav.appendChild(account);
    header.classList.add("is-authenticated");
    window.PriceCheckNavbar?.updateActive();
  }

  function renderPublicNavbar() {
    const nav = document.querySelector("[data-public-menu]");
    const header = document.querySelector("header.public-nav");
    if (!nav || !header) return;
    nav.replaceChildren();
    addNavLink(nav, "Home", "/", "", "home");
    addNavLink(nav, "How it works", "/how-it-works", "", "how-it-works");
    addNavLink(nav, "About", "/about", "", "about");
    addNavLink(
      nav,
      "Get started",
      "/login",
      "btn nav-public-cta",
      "get-started",
    );
    header.classList.remove("is-authenticated");
    window.PriceCheckNavbar?.updateActive();
  }

  async function updateCtas() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const { user } = await response.json();
      if (user) {
        document.body.dataset.authState = "authenticated";
        renderAuthenticatedNavbar(user);
        document.querySelectorAll("[data-estimate-cta]").forEach((link) => {
          link.href = "/estimate";
        });
      } else {
        document.body.dataset.authState = "public";
        renderPublicNavbar();
      }
    } catch {
      document.body.dataset.authState = "public";
      renderPublicNavbar();
    }
  }

  updateCtas();
})();
