(function () {
  "use strict";

  function getActiveNavItem() {
    const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    if (pathname === "/") return "home";
    if (pathname === "/how-it-works") return "how-it-works";
    if (pathname === "/about") return "about";
    if (pathname === "/login") return "get-started";
    return "";
  }

  function updateActiveNavItem() {
    const activeItem = getActiveNavItem();
    document.querySelectorAll("[data-nav-item]").forEach((link) => {
      const isCurrent = Boolean(activeItem) && link.dataset.navItem === activeItem;
      link.classList.toggle("is-active", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.PriceCheckNavbar = { updateActive: updateActiveNavItem };
  updateActiveNavItem();
  window.addEventListener("hashchange", updateActiveNavItem);
  window.addEventListener("popstate", updateActiveNavItem);
})();
