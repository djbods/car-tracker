# Mara Voss — designer portfolio landing page

A self-contained, mobile-first landing page for a fictional UI/UX designer.
No build step — everything (GSAP, ScrollTrigger, Lenis, fonts) is vendored locally.

## Run

Serve the folder with any static server and open it in a browser:

```sh
cd portfolio
python3 -m http.server 8765
# → http://localhost:8765/
```

## What's inside

- `index.html` — single page: preloader, hero, marquee, work, about, services, contact
- `styles.css` — mobile-first (375px base), breakpoints at 480/768/900px
- `main.js` — GSAP animations (char/word split reveals, scroll triggers, parallax,
  marquee loop, magnetic buttons, custom cursor), Lenis smooth scroll, fullscreen menu
- `vendor/` — gsap 3.12.5, ScrollTrigger, lenis 1.1.18
- `fonts/` — self-hosted Syne (display) + Space Grotesk (body)

## Notes

- Honors `prefers-reduced-motion` (animations and smooth scroll disabled).
- Custom cursor and magnetic hover only activate on fine pointers.
- The preloader only renders when JS runs, so the page degrades gracefully.
- Verified at 360/375/768/1440px: no horizontal overflow, no console errors,
  60fps scroll under 4× CPU throttling.
