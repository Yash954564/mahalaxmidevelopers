(() => {
  "use strict";

  /* ===== CONFIG ===== */
  const CONFIG = {
    phone: "+917499654371",
    whatsappNumber: "917499654371",
    whatsappDefault: "Hi, I'm interested in plots in Nagpur. Please share pricing, approvals, and site visit details.",
    // Paste your Google Apps Script Web App URL here:
    sheetsEndpoint: "",
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

    const slideW = slides[0].offsetWidth + 24;
    const idx = Math.round(track.scrollLeft / slideW);
    const total = slides.length;
    const current = Math.min(idx + 1, total);

    // Count
    const countEl = $(`#${id.replace("Slider", "Count")}`);
    if (countEl) {
      countEl.textContent = `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    }

    // Progress
    const progressEl = $(`#${id.replace("Slider", "Progress")}`);
    if (progressEl) {
      progressEl.style.width = `${(current / total) * 100}%`;
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

  /* ===== FORMS → Lead Storage & WhatsApp ===== */
  function validPhone(val) {
    return /^[0-9]+$/.test((val || "").trim());
  }

  function saveLeadLocally(data) {
    try {
      const leads = JSON.parse(localStorage.getItem("mahalaxmi_leads") || "[]");
      leads.push({
        ...data,
        id: Date.now(),
        status: "New",
        comments: ""
      });
      localStorage.setItem("mahalaxmi_leads", JSON.stringify(leads));
      console.log("Lead saved locally:", data);
    } catch (e) {
      console.error("Failed to save lead:", e);
    }
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
    const bindForm = (formId, statusId, context) => {
      const form = $(`#${formId}`);
      const status = $(`#${statusId}`);
      if (!form) return;

      form.addEventListener("submit", async e => {
        e.preventDefault();
        const fd = new FormData(form);
        const phone = (fd.get("phone") || fd.get("mobile") || "").toString().trim();

        if (!validPhone(phone)) {
          if (status) status.textContent = "Please enter a valid numeric phone number.";
          return;
        }

        if (status) status.textContent = "Sending…";

        const payload = {
          form_name: context,
          data: Object.fromEntries(fd.entries()),
          page_url: location.href,
          timestamp: new Date().toISOString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        };

        // Save Lead
        saveLeadLocally(payload);
        await sendToSheets(payload);

        // Build WhatsApp message
        const parts = [`Source: ${context}`];
        for (const [key, val] of Object.entries(payload.data)) {
           if (val) parts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`);
        }

        if (status) status.textContent = "Opening WhatsApp…";
        window.open(waUrl(parts.join("\n")), "_blank", "noopener");
        form.reset();
        setTimeout(() => { if (status) status.textContent = ""; }, 3000);
      });
    };

    bindForm("leadForm", "formStatus", "Homepage Hero Form");
    bindForm("modalLeadForm", "modalStatus", "Popup Modal Form");
    bindForm("contactForm", "contactStatus", "Contact Page Form");
    bindForm("newsletterForm", "newsletterStatus", "Newsletter Subscription");
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

    // Auto popup after delay
    setTimeout(() => {
      if (!modal.classList.contains("is-open")) open();
    }, CONFIG.popupDelayMs);
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

  /* ===== Init All ===== */
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
