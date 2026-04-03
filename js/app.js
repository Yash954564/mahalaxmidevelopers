(() => {
  "use strict";

  /* ===== CONFIG ===== */
  const CONFIG = {
    phone: "+917499654371",
    whatsappNumber: "917499654371",
    whatsappDefault: "Hi, I'm interested in plots in Nagpur. Please share pricing, approvals, and site visit details.",
    // Paste your Google Apps Script Web App URL here:
    sheetsEndpoint: "https://script.google.com/macros/s/AKfycbwYF7HzX5pChD8b1YaRvHZi5EpHLAcNVcqSEFiwvu1KdSl1nSO2tPnEsKGJUNG0Yph1Zg/exec",
    popupDelayMs: 30000,
    heroIntervalMs: 5000,
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ===== YEAR ===== */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== MOBILE MENU ===== */
  const mobileToggle = $("#mobileToggle");
  const mobileMenu = $("#mobileMenu");
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("is-open");
      mobileToggle.setAttribute("aria-expanded", open);
      mobileToggle.innerHTML = open ? "&times;" : "&#9776;";
    });
    // Close on link click
    $$("a", mobileMenu).forEach(a =>
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("is-open");
        mobileToggle.innerHTML = "&#9776;";
      })
    );
  }

  /* ===== WHATSAPP LINKS ===== */
  function waUrl(msg) {
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg.trim())}`;
  }

  $$("[data-wa]").forEach(el => {
    const key = el.getAttribute("data-wa") || "general";
    const msg = key === "general"
      ? CONFIG.whatsappDefault
      : `Hi, I want details for: ${key.replace(/-/g, " ")}. Please share price, approvals & site visit options.`;
    el.href = waUrl(msg);
    el.target = "_blank";
    el.rel = "noopener";
  });

  /* ===== HERO CAROUSEL ===== */
  function initHeroCarousel() {
    const root = $("[data-hero]");
    if (!root) return;
    const imgs = $$("img", root);
    if (imgs.length < 2) return;

    // Skip if user prefers reduced motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let idx = 0;
    setInterval(() => {
      imgs[idx].classList.remove("is-active");
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add("is-active");
    }, CONFIG.heroIntervalMs);
  }

  /* ===== GENERIC SLIDER ===== */
  function initSliders() {
    $$("[data-slider-prev], [data-slider-next]").forEach(btn => {
      const dir = btn.hasAttribute("data-slider-prev") ? -1 : 1;
      const sliderId = btn.getAttribute("data-slider-prev") || btn.getAttribute("data-slider-next");
      const track = $(`#${sliderId}`);
      if (!track) return;

      btn.addEventListener("click", () => {
        const slides = $$(".slider-slide", track);
        if (!slides.length) return;

        const slideWidth = slides[0].offsetWidth + 24; // gap
        track.scrollBy({ left: dir * slideWidth, behavior: "smooth" });
      });
    });

    // Update counters and progress on scroll
    $$(".slider-track").forEach(track => {
      track.addEventListener("scroll", () => updateSliderUI(track), { passive: true });
      // Initial
      setTimeout(() => updateSliderUI(track), 100);
    });
  }

  function updateSliderUI(track) {
    const id = track.id;
    if (!id) return;

    const slides = $$(".slider-slide", track);
    if (!slides.length) return;

    const slideW = slides[0].offsetWidth + 24; // slide + gap
    const visibleSlides = Math.round(track.clientWidth / slideW) || 1;
    const total = slides.length;

    // Calculate current index (0-based) based on scroll position
    const idx = Math.round(track.scrollLeft / slideW);

    // Ensure we don't exceed total - visibleSlides
    const maxIdx = Math.max(0, total - visibleSlides);
    const clampedIdx = Math.min(idx, maxIdx);

    // Update Counter: Show the range or just the current "page" focus
    // Following user request: "desktop we show 3 cards... it still count 1"
    // We'll show the index of the first visible card in the view
    const current = Math.min(idx + 1, total);
    const countEl = $(`#${id.replace("Slider", "Count")}`);
    if (countEl) {
      countEl.textContent = `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    }

    // Update Progress Bar: Account for visible window
    // It should be 100% when the last slide is fully visible
    const progressEl = $(`#${id.replace("Slider", "Progress")}`);
    if (progressEl) {
      let progress = 0;
      if (maxIdx > 0) {
        // Option A: progress = (idx / maxIdx) * 100; // 0% at start, 100% at end
        // Option B: progress = ((idx + visibleSlides) / total) * 100; // reflects % of items seen
        progress = ((idx + visibleSlides) / total) * 100;
      } else {
        progress = 100;
      }
      progressEl.style.width = `${Math.min(100, progress)}%`;
    }
  }

  /* ===== COUNTER ANIMATION ===== */
  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute("data-count") || "0", 10);
        const duration = 1200;
        const start = performance.now();

        const animate = (now) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = progress * (2 - progress); // ease-out quad
          const value = Math.round(target * eased);
          el.textContent = value.toLocaleString("en-IN") + (target >= 1000 ? "+" : "");
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.2 });

    els.forEach(el => observer.observe(el));
  }

  /* ===== SCROLL ANIMATIONS ===== */
  function initScrollAnimations() {
    const els = $$(".animate-in, .animate-left");
    if (!els.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

    els.forEach((el, i) => {
      el.style.transitionDelay = `${i * 60}ms`;
      observer.observe(el);
    });
  }

  /* ===== FORMS → Google Sheets + WhatsApp ===== */
  function validPhone(val) {
    return (val || "").trim().length >= 6; // Allow international numbers, Spaces, +, etc.
  }

  async function sendToSheets(data) {
    if (!CONFIG.sheetsEndpoint) return;
    try {
      await fetch(CONFIG.sheetsEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        keepalive: true,
      });
    } catch { /* silently fail */ }
  }

  function initForms() {
    const forms = $$("form");

    forms.forEach(form => {
      // Try to find a status element inside the form or by convention ending in 'Status'
      const status = form.querySelector('.form-status') || $(`#${form.id?.replace("Form", "")}Status`) || $(`#${form.id}Status`);

      form.addEventListener("submit", async e => {
        e.preventDefault();
        const fd = new FormData(form);
        const name = (fd.get("name") || fd.get("mname") || "").toString().trim();
        const phone = (fd.get("phone") || fd.get("mphone") || "").toString().trim();
        const email = (fd.get("email") || fd.get("memail") || "").toString().trim();
        const message = (fd.get("message") || fd.get("mmsg") || "").toString().trim();

        // Determine Form Context intuitively
        let context = "Website Form";
        if (form.id === "leadForm") context = "Homepage Hero Form";
        else if (form.id === "modalLeadForm") context = "Popup Modal Form";
        else if (form.id === "contactForm") context = "Contact Page Form";
        else if (form.id === "newsletterForm" || form.classList.contains("footer-newsletter-form")) context = "Footer Newsletter Form";
        else if (form.closest('footer')) context = "Footer Form";
        else if (form.closest('.modal')) context = "Modal Form";
        else if (form.id) context = `${form.id.replace(/([A-Z])/g, ' $1').trim()} Form`; // Converts "someLeadForm" to "some Lead Form"

        const isNewsletter = context.includes("Newsletter");

        if (!isNewsletter && !validPhone(phone)) {
          if (status) status.textContent = "Please enter a valid 10-digit phone number.";
          return;
        }

        if (status) status.textContent = "Sending…";

        const payload = {
          context,
          name,
          phone,
          email,
          message,
          page: location.href,
          timestamp: new Date().toISOString(),
        };

        // Post data to Google Sheets
        await sendToSheets(payload);

        if (status) status.textContent = isNewsletter ? "Subscribed successfully!" : "Opening WhatsApp…";
        const ogBtnText = status ? "" : (() => {
          const btn = form.querySelector('button[type="submit"]');
          if (btn) {
            const old = btn.textContent;
            btn.textContent = isNewsletter ? "Subscribed!" : "Sent!";
            return old;
          }
          return "";
        })();

        // Send to WhatsApp ONLY if it's not simply a newsletter subscription
        if (!isNewsletter) {
          const parts = [`Source: ${context}`, `Page: ${location.href}`];
          if (payload.name) parts.push(`Name: ${payload.name}`);
          parts.push(`Phone: ${payload.phone}`);
          if (payload.email) parts.push(`Email: ${payload.email}`);
          if (payload.message) parts.push(`Message: ${payload.message}`);

          window.open(waUrl(parts.join("\n").trim()), "_blank", "noopener");
        }

        form.reset();

        setTimeout(() => {
          if (status) status.textContent = "";
          else if (ogBtnText) {
            const btn = form.querySelector('button[type="submit"]');
            if (btn) btn.textContent = ogBtnText;
          }
        }, 3000);
      });
    });
  }

  /* ===== MODAL ===== */
  function initModal() {
    const modal = $("#leadModal");
    if (!modal) return;

    const open = () => {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    // Manual triggers
    $$("[data-open-modal]").forEach(btn =>
      btn.addEventListener("click", e => { e.preventDefault(); open(); })
    );
    $$("[data-close-modal]", modal).forEach(btn =>
      btn.addEventListener("click", e => { e.preventDefault(); close(); })
    );

    // Escape key
    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    // Auto popup after delay (Disabled as per user request, now only on click)
    /*
    setTimeout(() => {
      if (!modal.classList.contains("is-open")) open();
    }, CONFIG.popupDelayMs);
    */
  }

  /* ===== FAQ ACCORDION ===== */
  function initFaqAccordion() {
    $$(".faq-item").forEach(item => {
      item.querySelector("summary")?.addEventListener("click", () => {
        // Close others in the same parent
        const parent = item.parentElement;
        if (parent) {
          $$("details.faq-item", parent).forEach(other => {
            if (other !== item) other.removeAttribute("open");
          });
        }
      });
    });
  }

  /* ===== PROJECT FILTER ===== */
  function initProjectFilter() {
    const filter = $("#projectFilter");
    if (!filter) return;
    const btns = $$(".filter-btn", filter);
    const cards = $$(".project-card");

    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        btns.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const status = btn.dataset.filter;
        cards.forEach(card => {
          if (status === "All" || card.dataset.status === status) {
            // Check if card is inside a slider slide, if so we need to hide the parent slide
            const slide = card.closest(".slider-slide");
            if (slide) slide.style.display = "block";
            card.style.display = "block";
          } else {
            const slide = card.closest(".slider-slide");
            if (slide) slide.style.display = "none";
            card.style.display = "none";
          }
        });
      });
    });
  }

  /* ===== HEADER SCROLL EFFECT ===== */
  function initHeaderScroll() {
    const header = $("#header");
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y > 60) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
      lastScroll = y;
    }, { passive: true });
  }

  /* ===== ACTIVE LINKS ===== */
  function initActiveLinks() {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    $$(".nav-links a, .mobile-menu a, .footer-nav a").forEach(link => {
      const href = link.getAttribute("href");
      if (!href) return;

      // Normalize href
      let linkPage = href.split("/").pop().split("#")[0];
      if (linkPage === "." || linkPage === "") linkPage = "index.html";

      const normalizedCurrentPage = (page === "" || page === "index.html") ? "index.html" : page;

      if (linkPage === normalizedCurrentPage) {
        link.classList.add("active");
      }
    });
  }

  /* ===== Init All ===== */
  initActiveLinks();
  initHeroCarousel();
  initSliders();
  initCounters();
  initScrollAnimations();
  initForms();
  initModal();
  initFaqAccordion();
  initProjectFilter();
  initHeaderScroll();
})();
