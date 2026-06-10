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

// Candidate slugs, most-specific first. makeSlug reuses logos' alias map so
// "Mercedes-Benz", "merc", "VW" etc. normalise the same way the emblem does.
export function vehicleCutoutCandidates(car) {
  if (!car) return [];
  const make = brandLogoSlug(car.make);   // 'bmw', 'land_rover', … or '_generic'
  if (make === '_generic') return [];      // unknown make → don't attempt a cutout
  const model = slugify(car.model);
  if (!model) return [];
  const variant = slugify(car.variant);
  const colour = slugify(car.colour);
  const out = [];
if (colour) {
    if (variant) {
      out.push(`${make}-${model}-${variant}-${colour}`);
    }
    out.push(`${make}-${model}-${colour}`);   // ← this line was missing / broken
  }

  if (variant) out.push(`${make}-${model}-${variant}`);

  out.push(`${make}-${model}`);
  console.log(out);
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
