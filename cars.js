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
  // Mercedes-Benz — chassis-code side profiles, grouped by model line.
  // SL roadster (full lineage):
  'mercedes-w198',  // 300SL Gullwing (1954-1963)
  'mercedes-w113',  // 280SL Pagoda (1963-1971)
  'mercedes-r107',  // SL (1971-1989)
  'mercedes-r129',  // SL (1989-2001)
  'mercedes-r230',  // SL (2001-2012)
  'mercedes-r231',  // SL (2012-2020)
  'mercedes-r232',  // AMG SL (2021-present)
  // S-Class (full lineage):
  'mercedes-w116',  // S-Class (1972-1980)
  'mercedes-w126',  // S-Class (1979-1991)
  'mercedes-w140',  // S-Class (1991-1998)
  'mercedes-w220',  // S-Class (1998-2005)
  'mercedes-w221',  // S-Class (2005-2013)
  'mercedes-w222',  // S-Class (2013-2020)
  'mercedes-w223',  // S-Class (2020-present)
  // E-Class (full lineage):
  'mercedes-w123',  // (1976-1986)
  'mercedes-w124',  // E-Class (1984-1995)
  'mercedes-w210',  // E-Class (1995-2002)
  'mercedes-w211',  // E-Class (2002-2009)
  'mercedes-w212',  // E-Class (2009-2016)
  'mercedes-w213',  // E-Class (2016-2023)
  'mercedes-w214',  // E-Class (2023-present)
  // C-Class (full lineage):
  'mercedes-w201',  // 190E (1982-1993)
  'mercedes-w202',  // C-Class (1993-2000)
  'mercedes-w203',  // C-Class (2000-2007)
  'mercedes-w204',  // C-Class (2007-2014)
  'mercedes-w205',  // C-Class (2014-2021)
  'mercedes-w206',  // C-Class (2021-present)
  // Halo / other:
  'mercedes-c190',  // AMG GT (2015-2021)
  'mercedes-w463',  // G-Class (1990-present)
  'bmw-e39',
  'bmw-e92',
  'bmw-g80',
  // NEW BMW chassis to source cutouts for:
  'bmw-e30',  // 3-series (1982-1994) - most beloved BMW, essential
  'bmw-e46',  // 3-series (1997-2006) - extremely popular modern classic
  'bmw-e36',  // 3-series (1990-2000) - very popular, iconic M3
  'bmw-e60',  // 5-series (2003-2010) - controversial Bangle-era, unmistakable
  'bmw-e28',  // 5-series (1981-1988) - classic shark-nose design
  'bmw-e34',  // 5-series (1988-1996) - E39's predecessor, excellent touring
  'bmw-e38',  // 7-series (1994-2001) - beautiful luxury classic, James Bond
  'bmw-e85',  // Z4 (2002-2008) - first-gen roadster, distinctive design
  'bmw-f80',  // M3 (2014-2019) - pre-G80 M3, very popular
  'bmw-f82',  // M4 (2014-2020) - coupe version of F80
  'bmw-e87',  // 1-series (2004-2013) - hatchback, M135i special
  'bmw-g82',  // M4 (2020-present) - current gen M4
  'bmw-g87',  // M2 (2022-present) - current M2, very popular
  'bmw-g20',  // 3-series (2019-present) - latest 3-series sedan
  'bmw-g22',  // 4-series (2020-present) - latest 4-series coupe
  'bmw-e21',  // 3-series (1975-1983) - original 3-series
  'bmw-e9',   // CS coupe (1968-1975) - beautiful classic coupe
  'bmw-e70',  // X6 (2006-2014) - original SUV coupe, invented segment
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
//   bmw-g80-m3-2025-black → … → bmw-g80-m3 → bmw-g80 → bmw-m3 → bmw
// Canonical facet order in every slug is make-chassis-model-year-colour. Two
// platform fallbacks make exhaustive per-model coverage unnecessary:
//   • chassis-level (make-chassis, e.g. bmw-e39) — one file covers a whole
//     generation: 525i/528i/530i/540i/M5…
//   • make-level (make, e.g. bmw) — one generic silhouette per brand, the floor.
// Among equal specificity, colour ranks above year, so a colour match wins.
export function vehicleCutoutCandidates(car) {
  if (!car) return [];
  const make = brandLogoSlug(car.make);   // 'bmw', 'land_rover', … or '_generic'
  if (make === '_generic') return [];      // unknown make → don't attempt a cutout
  const model = slugify(car.model);
  if (!model) return [];

  const chassis = slugify(car.chassis);
  const year    = slugify(car.year);
  const colour  = slugify(car.colour);

  const out = [];
  // Assemble a slug from canonical-ordered facets, dropping any that are blank.
  // make is always the prefix; add() with no parts yields the bare make floor.
  const add = (...parts) => {
    const slug = [make, ...parts.filter(Boolean)].join('-');
    if (!out.includes(slug)) out.push(slug);
  };

  if (chassis) {             // model-anchored, chassis-qualified (most specific)
    add(chassis, model, year, colour);
    add(chassis, model, colour);
    add(chassis, model, year);
    add(chassis, model);
  }
  add(model, year, colour);  // model-anchored, no chassis
  add(model, colour);
  add(model, year);
  add(model);
  if (chassis) add(chassis); // platform-level: one file covers the generation
  add();                     // make-level floor: one generic silhouette
  return out;
}

// When this returns null and the car has no photo, the card floats the
// car-under-a-cover placeholder in the cutout slot — same 3D treatment as a real
// cutout (see render.js).
export const VEHICLE_COVER_SRC = 'cars/_covered.png';

// First candidate that has a curated file, else null. After the ordered
// candidates fail, a loose make-level pass returns the first curated cutout for
// the make, so any BMW shows *a* BMW silhouette rather than nothing.
export function vehicleCutoutSrc(car) {
  for (const slug of vehicleCutoutCandidates(car)) {
    if (CUTOUT_SLUGS.has(slug)) return `cars/${slug}.png`;
  }
  const make = car ? brandLogoSlug(car.make) : '_generic';
  if (make !== '_generic') {
    for (const slug of CUTOUT_SLUGS) {
      if (slug === make || slug.startsWith(`${make}-`)) return `cars/${slug}.png`;
    }
  }
  return null;
}

// Point imgEl at the cutout and return true, or clear it and return false. The
// caller uses the return to pick the stage state: cutout vs photo vs cover.
export function renderVehicleCutout(imgEl, car) {
  if (!imgEl) return false;
  const src = vehicleCutoutSrc(car);
  if (!src) {
    imgEl.removeAttribute('src');
    imgEl.classList.remove('loaded');
    return false;
  }
  // Force browser reload by clearing src first when changing images
  if (!imgEl.src.endsWith(src)) {
    imgEl.src = '';
    imgEl.src = src;
  }
  imgEl.classList.add('loaded');
  return true;
}
