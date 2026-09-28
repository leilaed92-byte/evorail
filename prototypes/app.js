/* EvoRail prototype interaction layer: small, dependency-free and shared by every screen. */
(function () {
  "use strict";

  const ICONS = {
    rail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v11a6 6 0 0 0 12 0V3M6 7h12M8 19l-2 2M16 19l2 2M9 14h6"/></svg>',
    overview: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    documents: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20.5H6zM14 3.5v4h4M9 12h6M9 16h6"/></svg>',
    drawings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 18 4.5-4.5M8.5 20l-4-4 10.75-10.75a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3zM14 6l4 4M3 21h18"/></svg>',
    transmittals: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v11H4zM8 3.5h8M8 10.5h8M8 14.5h5"/></svg>',
    reviews: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v11H9l-5 4zM8 10h8M8 13.5h5"/></svg>',
    "my-work": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.4 3.1-5.5 7-5.5s6.3 2.1 7 5.5"/></svg>',
    organizations: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V7l8-4 8 4v13M8 20v-6h8v6M7 9h.01M12 9h.01M17 9h.01M3 20h18"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6M4 5v14"/></svg>'
  };

  const NAV = [
    { label: "Overview", href: "overview.html", icon: "overview" },
    { label: "Documents", href: "mdr.html", icon: "documents" },
    { label: "Drawings", href: "drawings.html", icon: "drawings" },
    { label: "Transmittals", href: "transmittals.html", icon: "transmittals" },
    { label: "Reviews", href: "review.html", icon: "reviews" },
    { label: "My Work", href: "my-work.html", icon: "my-work" },
    { label: "Organizations", href: "organizations.html", icon: "organizations" }
  ];

  function icon(name, className) {
    return '<span class="' + (className || "icon") + '">' + (ICONS[name] || ICONS.arrow) + "</span>";
  }

  function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function enhanceBrand() {
    const brand = document.querySelector(".brand");
    if (!brand || brand.querySelector(".brand-mark")) return;
    brand.insertAdjacentHTML("afterbegin", '<span class="brand-mark" aria-hidden="true">' + ICONS.rail + "</span>");
    if (!document.querySelector(".infra-signature")) {
      brand.insertAdjacentHTML("afterend", '<div class="infra-signature"><strong>Ingénierie infrastructure ferroviaire</strong><span>Alger · depuis 2005 · +213 20 318 194</span></div>');
    }
  }

  function enhanceSideRail() {
    const root = document.documentElement;
    const collapsed = window.localStorage.getItem("evorail-nav-collapsed") === "true";
    if (collapsed) root.classList.add("nav-collapsed");

    document.querySelectorAll(".side").forEach(function (side) {
      const brand = side.querySelector(".brand");
      if (!brand) return;

      if (!side.querySelector(".side-toggle")) {
        brand.insertAdjacentHTML("afterend", '<button class="side-toggle" type="button" aria-label="Collapse navigation" title="Collapse navigation">' + ICONS.collapse + "</button>");
      }
      if (!side.querySelector(".side-search")) {
        const project = side.querySelector(".proj");
        const markup = '<button class="side-search" type="button" aria-label="Search project">' + icon("search", "nav-icon") + '<span>Search project</span><kbd>⌘K</kbd></button>';
        if (project) project.insertAdjacentHTML("afterend", markup);
        else brand.insertAdjacentHTML("afterend", markup);
      }

      if (!side.querySelector(".side-footer")) {
        const strong = document.querySelector(".who strong");
        const name = strong ? strong.textContent.trim() : "Sara Mehdi";
        const initials = name.split(/\s+/).map(function (part) { return part.charAt(0); }).join("").slice(0, 2).toUpperCase();
        side.insertAdjacentHTML("beforeend", '<div class="side-footer"><span class="avatar" aria-hidden="true">' + initials + '</span><span class="account-copy"><strong>' + name + '</strong><small>Document controller</small></span></div>');
      }

      const toggle = side.querySelector(".side-toggle");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("aria-label", collapsed ? "Expand navigation" : "Collapse navigation");
      toggle.setAttribute("title", collapsed ? "Expand navigation" : "Collapse navigation");
      toggle.addEventListener("click", function () {
        const next = !root.classList.contains("nav-collapsed");
        root.classList.toggle("nav-collapsed", next);
        window.localStorage.setItem("evorail-nav-collapsed", String(next));
        document.querySelectorAll(".side-toggle").forEach(function (button) {
          button.setAttribute("aria-expanded", String(!next));
          button.setAttribute("aria-label", next ? "Expand navigation" : "Collapse navigation");
          button.setAttribute("title", next ? "Expand navigation" : "Collapse navigation");
        });
      });

      const sideSearch = side.querySelector(".side-search");
      sideSearch.addEventListener("click", openPalette);
    });
  }

  function enhanceNavigation() {
    const navByLabel = NAV.reduce(function (map, page) {
      map[page.label.toLowerCase()] = page.icon;
      return map;
    }, {});

    document.querySelectorAll(".side a").forEach(function (link) {
      if (link.querySelector(".nav-icon")) return;
      const label = link.textContent.trim();
      link.innerHTML = icon(navByLabel[label.toLowerCase()] || "overview", "nav-icon") + "<span>" + label + "</span>";
    });
  }

  function enhanceTopbar() {
    const search = document.querySelector(".search");
    if (search && !search.querySelector(".search-icon")) {
      const searchText = search.textContent.trim();
      search.innerHTML = icon("search", "search-icon") + '<span>' + searchText + '</span><kbd class="search-hint">⌘ K</kbd>';
      search.setAttribute("role", "button");
      search.setAttribute("tabindex", "0");
      search.setAttribute("aria-label", "Search project");
      search.addEventListener("click", openPalette);
      search.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPalette();
        }
      });
    }

    const who = document.querySelector(".who");
    if (who && !who.querySelector(".avatar")) {
      const strong = who.querySelector("strong");
      const name = strong ? strong.textContent.trim() : "E";
      const initials = name.split(/\s+/).map(function (part) { return part.charAt(0); }).join("").slice(0, 2).toUpperCase();
      who.insertAdjacentHTML("afterbegin", '<span class="avatar" aria-hidden="true">' + initials + "</span>");
      const avatar = who.querySelector(".avatar");
      const copy = document.createElement("span");
      copy.className = "who-copy";
      Array.from(who.childNodes).filter(function (node) { return node !== avatar; }).forEach(function (node) { copy.appendChild(node); });
      who.appendChild(copy);
    }

    const top = document.querySelector(".top");
    if (!top || top.querySelector(".top-actions")) return;
    top.insertAdjacentHTML("beforeend", '<div class="top-actions"><button class="icon-button" type="button" aria-label="Notifications" title="Notifications">' + icon("bell") + '<span class="notification-dot" aria-hidden="true"></span></button><button class="icon-button theme-toggle" type="button" aria-label="Toggle appearance" title="Toggle appearance">' + icon("moon") + "</button></div>");
    const themeButton = top.querySelector(".theme-toggle");
    const savedTheme = window.localStorage.getItem("infrasoft-theme");
    if (savedTheme === "dark") document.body.classList.add("theme-dark");
    updateThemeButton(themeButton);
    themeButton.addEventListener("click", function () {
      document.body.classList.toggle("theme-dark");
      const theme = document.body.classList.contains("theme-dark") ? "dark" : "light";
      window.localStorage.setItem("infrasoft-theme", theme);
      updateThemeButton(themeButton);
      showToast(theme === "dark" ? "Dark appearance enabled" : "Light appearance enabled");
    });
  }

  function updateThemeButton(button) {
    if (!button) return;
    const dark = document.body.classList.contains("theme-dark");
    button.innerHTML = icon(dark ? "sun" : "moon");
    button.setAttribute("aria-label", dark ? "Use light appearance" : "Use dark appearance");
    button.setAttribute("title", dark ? "Use light appearance" : "Use dark appearance");
  }

  function buildPalette() {
    if (document.querySelector(".command-palette")) return;
    const palette = document.createElement("div");
    palette.className = "command-palette";
    palette.innerHTML = '<div class="palette-card" role="dialog" aria-modal="true" aria-labelledby="palette-title"><div class="palette-heading"><span id="palette-title">Jump to</span><button class="palette-close" type="button" aria-label="Close search">' + icon("close") + '</button></div><label class="sr-only" for="palette-input">Search pages</label><div class="palette-search">' + icon("search") + '<input id="palette-input" class="palette-input" type="search" placeholder="Search pages and registers" autocomplete="off"></div><div class="palette-list"></div><div class="palette-foot"><span>Navigate</span><kbd>↑</kbd><kbd>↓</kbd><span>Open</span><kbd>↵</kbd><span>Close</span><kbd>esc</kbd></div></div>';
    document.body.appendChild(palette);
    const input = palette.querySelector(".palette-input");
    const list = palette.querySelector(".palette-list");

    function render(query) {
      const term = (query || "").toLowerCase().trim();
      const items = NAV.filter(function (page) { return !term || page.label.toLowerCase().indexOf(term) >= 0; });
      list.innerHTML = items.length ? items.map(function (page, index) {
        const active = index === 0 ? " active" : "";
        return '<a class="palette-item' + active + '" href="' + page.href + '">' + icon(page.icon) + '<span><strong>' + page.label + '</strong><small>Line A workspace</small></span>' + icon("arrow", "palette-arrow") + "</a>";
      }).join("") : '<div class="palette-empty">No matching workspace found.</div>';
    }

    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePalette();
      if (event.key === "Enter") {
        const first = list.querySelector(".palette-item");
        if (first) window.location.href = first.href;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const items = Array.from(list.querySelectorAll(".palette-item"));
        if (!items.length) return;
        const active = items.findIndex(function (item) { return item.classList.contains("active"); });
        const next = event.key === "ArrowDown" ? (active + 1) % items.length : (active - 1 + items.length) % items.length;
        items.forEach(function (item, index) { item.classList.toggle("active", index === next); });
      }
    });
    palette.querySelector(".palette-close").addEventListener("click", closePalette);
    palette.addEventListener("click", function (event) { if (event.target === palette) closePalette(); });
    palette._render = render;
  }

  function openPalette() {
    buildPalette();
    const palette = document.querySelector(".command-palette");
    const input = palette.querySelector(".palette-input");
    palette.classList.add("open");
    input.value = "";
    palette._render("");
    window.setTimeout(function () { input.focus(); }, 0);
  }

  function closePalette() {
    const palette = document.querySelector(".command-palette");
    if (palette) palette.classList.remove("open");
  }

  function addKeyboardShortcuts() {
    document.addEventListener("keydown", function (event) {
      const target = event.target;
      const typing = target && (["INPUT", "TEXTAREA", "SELECT"].indexOf(target.tagName) >= 0 || target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        openPalette();
      } else if (event.key === "Escape") {
        closePalette();
      }
    });
  }

  function addRevealMotion() {
    const targets = document.querySelectorAll(".panel, .stat, .table-wrap, .sheet, .viewer, .banner, .index > a");
    if (!targets.length) return;
    targets.forEach(function (element, index) {
      element.classList.add("reveal");
      element.style.setProperty("--reveal-delay", Math.min(index * 45, 360) + "ms");
    });
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (element) { element.classList.add("is-visible"); });
      return;
    }
    const observer = new IntersectionObserver(function (entries, observerRef) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observerRef.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    targets.forEach(function (element) { observer.observe(element); });
  }

  function addRowLinks() {
    document.querySelectorAll("tbody tr").forEach(function (row) {
      const link = row.querySelector("a[href]");
      if (!link || row.dataset.rowLinkReady) return;
      row.dataset.rowLinkReady = "true";
      row.addEventListener("click", function (event) {
        if (event.target.closest("a, button, input, select, textarea, label")) return;
        window.location.href = link.href;
      });
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && document.activeElement === row) window.location.href = link.href;
      });
      row.tabIndex = 0;
    });
  }

  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    enhanceBrand();
    enhanceSideRail();
    enhanceNavigation();
    enhanceTopbar();
    buildPalette();
    addKeyboardShortcuts();
    addRevealMotion();
    addRowLinks();
    document.documentElement.dataset.page = currentPage();
  });
})();
