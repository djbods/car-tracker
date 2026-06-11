// Vehicle cutouts: clean side-profile transparent PNGs in /cars/, rendered as
// the floating "toy car" hero on the car card. Curated locally, same pattern as
// logos.js — files are hand-added per model, and a manifest Set records which
// slugs actually have a file. The browser can't stat the filesystem, so a slug
// not in the manifest returns null and the card falls back to the brand emblem.
//
// Designed so a paid image API (imagin.studio / CarImages) can later replace the
// body of vehicleCutoutSrc() to auto-resolve any model, without touching the
// card code that consumes it.

import { brandLogoSlug } from './logos.js';

// Slugs that have a real file in /cars/<slug>.png. Add a slug here when you drop
// in its image. Empty is fine — every car then shows the emblem fallback, so
// nothing looks broken before assets are seeded.
const CUTOUT_SLUGS = new Set([
  'bmw-530i-green',
  'bmw-528i',
  'bmw-530i',
  'bmw-335i',
  // add a slug here when you drop its PNG in /cars/
]);

function slugify(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Candidate slugs for a car, ordered MOST-SPECIFIC → least, so vehicleCutoutSrc
// picks the richest cutout that actually exists and degrades gracefully:
//   bmw-530i-sedan-green-2002 → … → bmw-530i-green → … → bmw-530i
// Facets: make (via logos' alias map, so "Mercedes-Benz"/"VW" normalise like the
// emblem), model, a single "spec" (BMW stores body sedan/touring; other makes a
// variant/trim — they're mutually exclusive), colour, and year. Among equal
// specificity, colour ranks above spec above year, so a colour match wins.
export function vehicleCutoutCandidates(car) {
  if (!car) return [];
  const make = brandLogoSlug(car.make);   // 'bmw', 'land_rover', … or '_generic'
  if (make === '_generic') return [];      // unknown make → don't attempt a cutout
  const model = slugify(car.model);
  if (!model) return [];

  const spec   = slugify(car.variant) || slugify(car.body);
  const colour = slugify(car.colour);
  const year   = slugify(car.year);
  const base   = `${make}-${model}`;

  const out = [];
  const add = (...parts) => {
    const kept = parts.filter(Boolean);
    if (!kept.length) return;            // skip empty combos; base added last
    const slug = [base, ...kept].join('-');
    if (!out.includes(slug)) out.push(slug);
  };

  add(spec, colour, year);   // three facets
  add(spec, colour);         // two
  add(colour, year);
  add(spec, year);
  add(colour);               // one
  add(spec);
  add(year);
  if (!out.includes(base)) out.push(base);   // make-model
  return out;
}

// First candidate that has a curated file, else null.
export function vehicleCutoutSrc(car) {
  for (const slug of vehicleCutoutCandidates(car)) {
    if (CUTOUT_SLUGS.has(slug)) return `cars/${slug}.png`;
  }
  return null;
}

// Point imgEl at the cutout and return true, or clear it and return false. The
// caller uses the return to pick the stage state: cutout vs photo vs emblem.
export function renderVehicleCutout(imgEl, car) {
  if (!imgEl) return false;
  const src = vehicleCutoutSrc(car);
  if (!src) {
    imgEl.removeAttribute('src');
    imgEl.classList.remove('loaded');
    return false;
  }
  if (!imgEl.src.endsWith(src)) imgEl.src = src;
  imgEl.classList.add('loaded');
  return true;
}
