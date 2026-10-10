(function () {
  "use strict";

  const STORAGE_KEY = "pricecheck_theme";
  let themeToggleWrap = null;
  let themeTogglePlaceholder = null;
  const mobileNavigation = window.matchMedia("(max-width: 767px)");

  function placeThemeToggle(menu) {
    if (!themeToggleWrap || !themeTogglePlaceholder) return;
    if (mobileNavigation.matches && menu) {
      menu.appendChild(themeToggleWrap);
    } else {
      themeTogglePlaceholder.after(themeToggleWrap);
    }
  }

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
    toggle.setAttribute("aria-checked", String(!isLight));
    toggle.setAttribute("aria-label", "Dark mode");
    toggle.title = "Dark mode";
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
      themeToggleWrap = existing.closest(".public-theme-toggle-wrap");
      const menu = document.querySelector("[data-public-menu]");
      if (themeToggleWrap && menu) {
        themeTogglePlaceholder = document.createComment(
          "Theme toggle desktop position",
        );
        themeToggleWrap.before(themeTogglePlaceholder);
        placeThemeToggle(menu);
        mobileNavigation.addEventListener("change", () =>
          placeThemeToggle(menu),
        );
      }
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
    button.setAttribute("role", "switch");
    button.setAttribute("aria-label", "Dark mode");
    button.setAttribute("aria-checked", "false");
    button.title = "Dark mode";
    button.innerHTML = `
      <span class="theme-toggle-label">Dark mode</span>
      <span class="theme-toggle-switch" aria-hidden="true">
        <span class="theme-toggle-thumb"></span>
      </span>
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
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
      menu.classList.remove("is-open");
      document.body.classList.remove("public-menu-open");
      menuButton
        .querySelector(".menu-toggle-icon")
        ?.classList.remove("is-open");
    };

    menuButton.setAttribute("aria-label", "Open navigation menu");
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      menuButton.setAttribute(
        "aria-label",
        open ? "Open navigation menu" : "Close navigation menu",
      );
      menuButton.title = open ? "Open navigation menu" : "Close navigation menu";
      menu.classList.toggle("is-open", !open);
      document.body.classList.toggle("public-menu-open", !open);
      menuButton
        .querySelector(".menu-toggle-icon")
        ?.classList.toggle("is-open", !open);
    });

    menu.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        menuButton.getAttribute("aria-expanded") === "true" &&
        event.target instanceof Node &&
        !menu.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuButton.getAttribute("aria-expanded") === "true"
      ) {
        closeMenu();
        menuButton.focus();
      }
    });

    window
      .matchMedia("(min-width: 768px)")
      .addEventListener("change", closeMenu);
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
    placeThemeToggle(nav);
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
    placeThemeToggle(nav);
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
