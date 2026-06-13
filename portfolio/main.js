/* Mara Voss — folio 2026 */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis drives wheel only; touch stays native) ---------- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    else document.querySelector(target)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  /* ---------- Split text into chars ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const chars = [...el.textContent];
    el.textContent = "";
    el.setAttribute("aria-label", chars.join(""));
    chars.forEach((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.setAttribute("aria-hidden", "true");
      s.textContent = c;
      el.appendChild(s);
    });
  });

  /* ---------- Split about lead into masked words (survives any wrap) ---------- */
  const lead = document.getElementById("aboutLead");
  if (lead) {
    [...lead.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/\s+/).filter(Boolean).forEach((word, i) => {
        if (i > 0) frag.appendChild(document.createTextNode(" "));
        const w = document.createElement("span");
        w.className = "w";
        const wi = document.createElement("span");
        wi.className = "wi";
        wi.textContent = word;
        w.appendChild(wi);
        frag.appendChild(w);
      });
      lead.replaceChild(frag, node);
    });
  }

  const heroChars = document.querySelectorAll(".hero__title .ch");
  const introEls = document.querySelectorAll("[data-intro]");

  /* ---------- Preloader + hero intro ---------- */
  const preloader = document.getElementById("preloader");
  const countEl = document.getElementById("preloaderCount");

  const heroIntro = () => {
    if (reduceMotion) return;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.05 }, 0)
      .to(introEls, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09 }, 0.45)
      .set(heroChars, { willChange: "auto" });
  };

  if (reduceMotion) {
    preloader.remove();
  } else {
    gsap.set(heroChars, { yPercent: 115, rotate: 4 });
    gsap.set(introEls, { y: 24, autoAlpha: 0 });

    const count = { v: 0 };
    gsap.timeline()
      .to(count, {
        v: 100,
        duration: 1.05,
        ease: "power2.inOut",
        onUpdate: () => { countEl.textContent = Math.round(count.v); },
      })
      .to(preloader, {
        yPercent: -100,
        duration: 0.9,
        ease: "power4.inOut",
        delay: 0.12,
        onStart: heroIntro,
        onComplete: () => preloader.remove(),
      });
  }

  /* ---------- Hero orbs drift ---------- */
  if (!reduceMotion) {
    gsap.to(".orb--a", { xPercent: -14, yPercent: 12, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(".orb--b", { xPercent: 16, yPercent: -10, duration: 11, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }

  /* ---------- Marquee ---------- */
  const track = document.getElementById("marqueeTrack");
  if (track && !reduceMotion) {
    const loop = gsap.to(track, { xPercent: -50, duration: 22, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: ".marquee",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
    });
  }

  /* ---------- Scroll reveals ---------- */
  if (!reduceMotion) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.fromTo(el,
        { y: 42, autoAlpha: 0 },
        {
          y: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
    });

    // About lead: word-by-word mask reveal
    gsap.fromTo(".about__lead .wi",
      { yPercent: 120 },
      {
        yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.035,
        scrollTrigger: { trigger: ".about__lead", start: "top 82%", once: true },
      });

    // Contact CTA chars
    const ctaChars = document.querySelectorAll(".contact__cta .ch");
    gsap.fromTo(ctaChars,
      { yPercent: 115 },
      {
        yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.035,
        scrollTrigger: { trigger: ".contact__cta", start: "top 88%", once: true },
      });

    // Project art parallax (art is 114% tall, so ±5% stays inside the clip)
    gsap.utils.toArray(".card__art").forEach((art) => {
      gsap.fromTo(art, { yPercent: -4.5 }, {
        yPercent: 4.5, ease: "none",
        scrollTrigger: { trigger: art.closest(".card__media"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Footer watermark slides up as it enters
    gsap.fromTo(".contact__watermark", { yPercent: 36 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: ".contact__watermark", start: "top bottom", end: "bottom bottom", scrub: true },
    });
  }

  /* ---------- Stat counters ---------- */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power2.out",
      snap: { v: 1 },
      onUpdate: () => { el.textContent = obj.v; },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  /* ---------- Fullscreen menu ---------- */
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("menuToggle");
  const menuLinks = menu.querySelectorAll(".menu__links a");
  let menuOpen = false;

  const menuTl = gsap.timeline({ paused: true })
    .set(menu, { visibility: "visible" })
    .to(menu, { y: 0, duration: reduceMotion ? 0 : 0.65, ease: "power4.inOut" })
    .fromTo(menuLinks,
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: reduceMotion ? 0 : 0.5, stagger: 0.06, ease: "power3.out" },
      "-=0.25")
    .fromTo(".menu__foot",
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: reduceMotion ? 0 : 0.4 },
      "<0.1");

  gsap.set(menu, { yPercent: 0, y: "-100%" });

  const setMenu = (open) => {
    menuOpen = open;
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", !open);
    if (open) { lenis?.stop(); menuTl.timeScale(1).play(); }
    else { lenis?.start(); menuTl.timeScale(1.6).reverse(); }
  };

  toggle.addEventListener("click", () => setMenu(!menuOpen));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && menuOpen) setMenu(false); });

  menuLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      setMenu(false);
      setTimeout(() => scrollTo(a.getAttribute("href")), reduceMotion ? 0 : 450);
    });
  });

  /* ---------- Anchor links (outside menu) ---------- */
  document.querySelectorAll('a[href^="#"]:not(.menu__links a)').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href.length < 2) return;
      e.preventDefault();
      scrollTo(href);
    });
  });

  /* ---------- Custom cursor + magnetic elements (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = document.getElementById("cursor");
    gsap.set(cursor, { autoAlpha: 0 });
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      gsap.to(cursor, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
      xTo(e.clientX); yTo(e.clientY);
    }, { passive: true });

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });

    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
      const my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener("mouseleave", () => { mx(0); my(0); });
    });
  }

  /* ---------- Header hide on scroll down ---------- */
  if (!reduceMotion) {
    const header = document.querySelector(".header");
    ScrollTrigger.create({
      start: "top -120",
      end: "max",
      onUpdate: (self) => {
        if (menuOpen) return;
        gsap.to(header, {
          yPercent: self.direction === 1 ? -130 : 0,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      },
    });
  }

  /* ---------- Melbourne clock ---------- */
  const clockEls = [document.getElementById("clock"), document.getElementById("clockFooter")];
  const tick = () => {
    const t = new Intl.DateTimeFormat("en-AU", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Melbourne",
    }).format(new Date());
    clockEls.forEach((el) => el && (el.textContent = t));
  };
  tick();
  setInterval(tick, 30_000);

  /* ---------- Keep triggers honest once fonts swap in ---------- */
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
