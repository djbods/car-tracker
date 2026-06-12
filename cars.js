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

  // Bugatti — model-named side profiles. Bugatti uses model names, not chassis
  // codes, so these resolve via the model tier add(model): a user typing
  // "Veyron"/"Chiron"/etc. in the model field renders straight from the slug.
  'bugatti-eb110',       // EB110 (1991-1995) - Campogalliano-era 90s revival
  'bugatti-veyron',      // Veyron (2005-2015) - first modern W16 hypercar
  'bugatti-chiron',      // Chiron (2016-2022) - Veyron successor
  'bugatti-divo',        // Divo (2018) - track-focused Chiron derivative
  'bugatti-centodieci',  // Centodieci (2019) - EB110 homage, 10 units
  'bugatti-mistral',     // W16 Mistral (2022) - final W16, roadster
  'bugatti-bolide',      // Bolide (2024) - extreme track-focused hypercar
  'bugatti-tourbillon',  // Tourbillon (2026) - new V16 hybrid flagship

  // Porsche — a MIXED set: the 911 and mid-engine lines use internal
  // generation/chassis codes, so those slugs resolve via the chassis tier
  // add(chassis) (like the Mercedes set); the standalone model lines and the
  // classics/halo cars use model names, resolving via add(model) (like Bugatti).
  // 911 lineage (chassis-coded) — distinct silhouette per generation:
  'porsche-930',  // 911 G-series / 930 Turbo (1975-1989) - last of the classics
  'porsche-964',  // 911 (1989-1994) - first modernised 911
  'porsche-993',  // 911 (1994-1998) - last air-cooled
  'porsche-996',  // 911 (1998-2004) - first water-cooled, fried-egg lights
  'porsche-997',  // 911 (2004-2012) - return to round headlights
  'porsche-991',  // 911 (2012-2019) - first electromechanical steering
  'porsche-992',  // 911 (2019-present) - current generation
  // Mid-engine Boxster/Cayman (chassis-coded):
  'porsche-986',  // Boxster (1996-2004) - original Boxster
  'porsche-987',  // Boxster/Cayman (2004-2012) - first Cayman
  'porsche-981',  // Boxster/Cayman (2012-2016) - third-gen
  'porsche-982',  // 718 Boxster/Cayman (2016-present) - flat-four/GT4 era
  // Standalone model lines (model-named):
  'porsche-cayenne',     // Cayenne SUV (2002-present)
  'porsche-macan',       // Macan SUV (2014-present)
  'porsche-panamera',    // Panamera (2009-present)
  'porsche-taycan',      // Taycan EV (2019-present)
  // Classics / halo cars (model-named):
  'porsche-944',         // 944 (1982-1991) - transaxle four-cylinder
  'porsche-928',         // 928 (1977-1995) - front-engine V8 GT
  'porsche-356',         // 356 (1948-1965) - the original Porsche
  'porsche-959',         // 959 (1986-1993) - Group B tech flagship
  'porsche-918',         // 918 Spyder (2013-2015) - hybrid hypercar
  'porsche-carrera-gt',  // Carrera GT (2003-2007) - V10 analogue halo

  // Audi — a MIXED set, like Porsche/Volkswagen. The core saloon lines (A4, A6,
  // A8, A3) and the TT use internal platform/type codes, so those slugs resolve
  // via the chassis tier add(chassis) — a user typing chassis "B8"/"C6"/"8P"
  // renders straight from the slug. One platform file covers the whole
  // A4/S4/RS4 (etc.) generation of that code. The standalone model lines, the
  // EVs and the classics use model names, resolving via the model tier
  // add(model). Saloon lines use the SEDAN body as the representative silhouette
  // except where Carsized has no sedan render (B6 + C4 use the Avant estate).
  // A4 line (platform-coded) — sedan, the universal A4/S4/RS4 shape per gen:
  'audi-b5',  // A4 B5 (1994-2001)
  'audi-b6',  // A4 B6 (2000-2006) - Avant (no sedan render available)
  'audi-b7',  // A4 B7 (2004-2008)
  'audi-b8',  // A4 B8 (2007-2015)
  'audi-b9',  // A4 B9 (2015-2023)
  // A6 line (platform-coded):
  'audi-c4',  // A6 / 100 C4 (1991-1997) - Avant (no sedan render available)
  'audi-c5',  // A6 C5 (1997-2004)
  'audi-c6',  // A6 C6 (2004-2011)
  'audi-c7',  // A6 C7 (2011-2018)
  'audi-c8',  // A6 C8 (2018-present)
  // A8 line (platform-coded):
  'audi-d2',  // A8 D2 (1994-2002) - first aluminium-spaceframe A8
  'audi-d3',  // A8 D3 (2002-2010)
  'audi-d4',  // A8 D4 (2010-2017)
  'audi-d5',  // A8 D5 (2017-present)
  // A3 line (type-coded) — hatchback, the volume A3 body per gen:
  'audi-8l',  // A3 8L (1996-2003)
  'audi-8p',  // A3 8P (2003-2012)
  'audi-8v',  // A3 8V (2012-2020)
  'audi-8y',  // A3 8Y (2020-present)
  // TT line (type-coded):
  'audi-8n',  // TT 8N (1998-2006) - roadster (no 8N coupe render available)
  'audi-8j',  // TT 8J (2006-2014)
  'audi-8s',  // TT 8S (2014-2023) - RS coupe (only 8S coupe render available)
  // Standalone model lines & halo (model-named):
  'audi-a1',          // A1 supermini
  'audi-a5',          // A5 coupe/Sportback
  'audi-a7',          // A7 Sportback
  'audi-q2',          // Q2 SUV
  'audi-q3',          // Q3 SUV
  'audi-q5',          // Q5 SUV
  'audi-q7',          // Q7 SUV
  'audi-q8',          // Q8 SUV
  'audi-r8',          // R8 (2006-present) - V8/V10 mid-engine halo
  // EVs (model-named):
  'audi-e-tron-gt',   // e-tron GT
  'audi-q4-e-tron',   // Q4 e-tron SUV
  'audi-q8-e-tron',   // Q8 e-tron SUV (orig. e-tron)
  // Classics (model-named):
  'audi-ur-quattro',  // Ur-Quattro (1980-1991) - iconic Group B coupe
  'audi-80',          // Audi 80 (B-platform predecessor)
  'audi-100',         // Audi 100 (C3 "aero" predecessor, 1982-1991)
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
