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

  // Volkswagen — a MIXED set, like Porsche. The Golf and Transporter lines use
  // internal generation/chassis codes (so those slugs resolve via the chassis
  // tier add(chassis) — a user typing chassis "Mk7"/"T5" renders straight from
  // the slug); the standalone model lines and classics use model names,
  // resolving via the model tier add(model).
  // Golf lineage (generation-coded) — the platform-level silhouette per gen
  // (the Mk designation is shared by Jetta/Polo, but here it is the Golf shape):
  'volkswagen-mk1',  // Golf Mk1 / Typ 17 (1974-1983; "Rabbit" in the US)
  'volkswagen-mk2',  // Golf Mk2 / Typ 19E (1983-1992)
  'volkswagen-mk3',  // Golf Mk3 / Typ 1H (1991-1999)
  'volkswagen-mk4',  // Golf Mk4 / Typ 1J (1997-2004)
  'volkswagen-mk5',  // Golf Mk5 / Typ 1K (2003-2009)
  'volkswagen-mk6',  // Golf Mk6 / Typ 5K (2008-2013)
  'volkswagen-mk7',  // Golf Mk7 / Typ 5G (2012-2020)
  'volkswagen-mk8',  // Golf Mk8 / Typ CD (2019-present)
  // Transporter / Bus (generation-coded):
  'volkswagen-t1',  // T1 Split-screen "Splitty" (1950-1967) - Samba
  'volkswagen-t4',  // T4 (1990-2003) - first front-engine Transporter
  'volkswagen-t5',  // T5 (2003-2015)
  'volkswagen-t6',  // T6 (2015-present)
  // Classic Beetle (chassis-coded):
  'volkswagen-type1',  // Type 1 Beetle (1938-2003)
  // Standalone model lines & classics (model-named):
  'volkswagen-new-beetle',  // New Beetle (1997-2011)
  'volkswagen-scirocco',    // Scirocco (1974-1992, 2008-2017)
  'volkswagen-polo',        // Polo supermini
  'volkswagen-passat',      // Passat
  'volkswagen-phaeton',     // Phaeton (2002-2016)
  'volkswagen-touareg',     // Touareg SUV
  'volkswagen-tiguan',      // Tiguan SUV
  'volkswagen-up',          // up! city car
  'volkswagen-id3',         // ID.3 EV
  'volkswagen-id4',         // ID.4 EV
  'volkswagen-id-buzz',     // ID. Buzz EV (electric microbus revival)
  'volkswagen-jetta',       // Jetta - the Golf-based sedan
  'volkswagen-arteon',      // Arteon (2017-2022) - CC successor fastback
  'volkswagen-amarok',      // Amarok pickup
  'volkswagen-id7',         // ID.7 liftback EV

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

  // Mazda — a MIXED set, like Porsche/VW. The mainstream lines are MODEL-NAMED,
  // resolving via the model tier add(model): a user typing "3"/"CX-5"/"MX-30"
  // renders straight from the slug. The MX-5 is CHASSIS-CODED (like the BMW set),
  // resolving via the chassis tier add(chassis) — one file per generation, since
  // the NA/NB/ND silhouettes are generationally distinct enthusiast icons.
  // Australia-weighted: Mazda3/CX-5/CX-30 dominate local sales. Cutouts are
  // Carsized.com orthographic `_4x` renders (watermark-dampened, rembg'd);
  // representative generation noted per line from the source page year-range.
  // Mainstream hatch / sedan (model-named):
  'mazda-3',        // Mazda 3 (BP, 2019-present) - hatchback, brand design icon
  'mazda-2',        // Mazda 2 (DJ, 2014) - supermini
  'mazda-6',        // Mazda 6 (GJ, 2018-2024 sedan) - midsize flagship
  // SUV / crossover — core of Australian ownership (model-named):
  'mazda-cx-3',     // CX-3 (DK, 2015-2022) - subcompact SUV
  'mazda-cx-30',    // CX-30 (2019-present) - small SUV, huge Aus seller
  'mazda-cx-5',     // CX-5 (KF, 2017-2021) - perennial Aus top-selling SUV
  'mazda-cx-7',     // CX-7 (ER, 2006-2012) - original midsize crossover
  'mazda-cx-9',     // CX-9 (TC, 2016-2023) - 7-seat SUV
  'mazda-cx-60',    // CX-60 (2022-present) - large-platform PHEV SUV
  'mazda-cx-80',    // CX-80 (2024-present) - 3-row large SUV
  'mazda-cx-90',    // CX-90 (2023-present) - flagship 3-row SUV
  // EV & people-mover (model-named):
  'mazda-mx-30',    // MX-30 (2020-present) - first dedicated BEV
  'mazda-5',        // Mazda 5 (CW, 2010-2018) - compact people-mover
  // MX-5 roadster (chassis-coded) — distinct silhouette per generation:
  'mazda-na',       // MX-5 NA (1989-1997) - pop-up headlight original
  'mazda-nb',       // MX-5 NB (1998-2005) - fixed-headlight second gen
  'mazda-nd',       // MX-5 ND (2015-present) - current Kodo-era roadster
  // Dropped (no clean orthographic side render — not in Carsized's catalogue,
  // NetCarShow only has perspective press shots): rx-7 (fb/fc/fd), rx-8, cosmo,
  // mx-6, 626, 323-gtx/familia, bt-50 (ute). Also skipped (not Australian-market):
  // cx-50, 6e EV, demio. Revisit if a clean side source turns up.

  // Toyota — a MIXED set, like Porsche/VW. All MODEL-NAMED here, resolving via
  // the model tier add(model): a user typing "Corolla"/"HiLux"/"86" renders
  // straight from the slug. Australia-weighted — HiLux/LandCruiser/RAV4/Corolla
  // dominate local ownership. Cutouts are Carsized.com orthographic `_4x`
  // side-view renders sourced from the LOSSLESS .png (native anti-aliased alpha;
  // no rembg) with a cosmetically dampened watermark; representative generation
  // noted per line (see cars/ATTRIBUTIONS.md for full per-slug verification).
  // ── AU-core: top sellers, utes, 4x4s, people-movers, EV/H2 ──
  'toyota-hilux',          // HiLux (AN1P, 2016 double-cab) - perennial Aus top-seller ute
  'toyota-rav4',           // RAV4 (XA50, 2019) - top-selling SUV
  'toyota-corolla',        // Corolla (E210, 2022 sedan) - world's best-selling nameplate
  'toyota-landcruiser',    // LandCruiser (J300, 2021) - 300-series
  'toyota-prado',          // LandCruiser Prado (J250, 2023)
  'toyota-camry',          // Camry (XV80, 2024) - midsize sedan staple
  'toyota-yaris',          // Yaris (XP210, 2020 5-door) supermini
  'toyota-kluger',         // Kluger (XU70, 2019) - sold as Highlander overseas
  'toyota-c-hr',           // C-HR (X20, 2023) - coupe-styled crossover
  'toyota-corolla-cross',  // Corolla Cross (XG1TJ, 2020)
  'toyota-yaris-cross',    // Yaris Cross (XPB1F, 2021)
  'toyota-crown',          // Crown (S235, 2022 fastback) - flagship sedan lineage
  'toyota-prius',          // Prius (XW60, 2022) - hybrid icon
  'toyota-fortuner',       // Fortuner (AN160, 2020) - HiLux-based 7-seat SUV
  'toyota-4runner',        // 4Runner (N500, 2024)
  'toyota-tundra',         // Tundra (XK70, 2021) - full-size pickup
  'toyota-tacoma',         // Tacoma (N400, 2023) - midsize pickup
  'toyota-sequoia',        // Sequoia (XK80, 2023) - full-size SUV
  'toyota-fj-cruiser',     // FJ Cruiser (XJ10, 2006) - retro SUV
  'toyota-bz4x',           // bZ4X (EAM, 2022) - first dedicated BEV
  'toyota-mirai',          // Mirai (AD2, 2020) - hydrogen fuel-cell sedan
  'toyota-tarago',         // Tarago (XR30, 2000) - sold as Previa/Estima overseas
  // ── Heritage / sport ──
  'toyota-86',          // 86 / GT86 (ZN6, 2012) - Subaru BRZ twin
  'toyota-gr86',        // GR86 (ZN8, 2021) - second-gen, Gazoo Racing
  'toyota-gr-yaris',    // GR Yaris (XP210, 2020) - homologation AWD hot hatch
  'toyota-supra',       // Supra (A90, 2019) - Mk5
  'toyota-mr2',         // MR2 mid-engine (SW20, 1989)
  'toyota-celica',      // Celica liftback (T230, 1999)
  // ── Extended / other-region nameplates ──
  'toyota-alphard',         // Alphard (AH30, 2015) - luxury MPV
  'toyota-auris',           // Auris (E180, 2012) - Euro hatch (Corolla sibling)
  'toyota-avalon',          // Avalon (XX50, 2018) - full-size sedan
  'toyota-avensis',         // Avensis (T27, 2009) - Euro midsize
  'toyota-aygo',            // Aygo (AB40, 2018) - city car
  'toyota-aygo-x',          // Aygo X (AB7, 2022) - crossover city car
  'toyota-corolla-verso',   // Corolla Verso (R1, 2004) - compact MPV
  'toyota-crown-signia',    // Crown Signia (S238, 2024) - crossover wagon
  'toyota-grand-highlander',// Grand Highlander (AS10, 2023)
  'toyota-iq',              // iQ (AJ1, 2008) - ultra-compact
  'toyota-matrix',          // Matrix (E140, 2008) - compact hatch (NA)
  'toyota-paseo',           // Paseo (L50, 1995) - sport coupe
  'toyota-prius-c',         // Prius c (NHP10, 2011) - subcompact hybrid (Aqua)
  'toyota-prius-plus',      // Prius+ (XW30, 2011) - 7-seat hybrid MPV
  'toyota-proace',          // Proace (V, 2016) - Euro van
  'toyota-proace-city',     // Proace City (E, 2024) - compact Euro van
  'toyota-raize',           // Raize (A250, 2019) - subcompact SUV
  'toyota-rush',            // Rush (F800, 2017) - compact SUV
  'toyota-sienna',          // Sienna (XL40, 2020) - NA minivan
  'toyota-solara',          // Solara (XV30, 2003) - Camry coupe (NA)
  'toyota-starlet',         // Starlet (P90, 1996) - supermini
  'toyota-tercel',          // Tercel (L20, 1982) - subcompact
  'toyota-urban-cruiser',   // Urban Cruiser (YF, 2020) - rebadged Maruti
  'toyota-veloz',           // Veloz (W100, 2021) - compact MPV
  'toyota-venza',           // Venza (XU80, 2020) - midsize crossover (NA)
  'toyota-verso',           // Verso (AR2, 2013) - compact MPV
  'toyota-verso-s',         // Verso-S (XP120, 2010) - mini MPV
  'toyota-yaris-verso',     // Yaris Verso (P2, 2003) - tall mini MPV
  // Dropped (no clean orthographic side render — Carsized lacks them, or not in
  // catalogue): ae86, supra a80 (Mk4), supra a70 (Mk3), gr-corolla, 2000gt, fj40,
  // landcruiser-70, soarer, echo, aurion (AU/US-built). Revisit if a clean side
  // source turns up.

  // Nissan — a MIXED set, like Porsche/VW. The enthusiast Z-car and GT-R lines
  // are CHASSIS-CODED (like the BMW set / Mazda MX-5), resolving via the chassis
  // tier add(chassis) — a user typing chassis "Z34"/"RZ34"/"R35" renders straight
  // from the slug; one file per generation, since the silhouettes are distinct
  // icons. The mainstream / AU-market lines are MODEL-NAMED, resolving via the
  // model tier add(model): a user typing "Patrol"/"X-Trail"/"Qashqai" renders
  // straight from the slug. Australia-weighted — Patrol/X-Trail/Qashqai/Navara
  // dominate local sales. Cutouts are Carsized.com orthographic `_4x` renders
  // (watermark-dampened, rembg'd); representative generation noted per line from
  // the source detail-page year-range.
  // Z-car / GT-R (chassis-coded) — distinct silhouette per generation:
  'nissan-z34',     // 370Z Z34 (2009-2020) - last of the analogue Z coupes
  'nissan-rz34',    // Z RZ34 (2023-present) - current retro-styled Z
  'nissan-r35',     // GT-R R35 (2016-2022 facelift) - Godzilla, sole Carsized GT-R
  // Mainstream / AU-market (model-named):
  'nissan-patrol',     // Patrol Y62 (2021-2023) - perennial Aus large 4x4
  'nissan-navara',     // Navara D23/NP300 (2014-present) - top-selling ute
  'nissan-x-trail',    // X-Trail T33 (2021-present) - core Aus family SUV
  'nissan-qashqai',    // Qashqai J12 (2021-2024) - small-SUV staple
  'nissan-pathfinder', // Pathfinder R53 (2021-present) - 7-seat SUV
  'nissan-juke',       // Juke F16 (2019-2024) - subcompact crossover
  'nissan-leaf',       // Leaf ZE1 (2017-2025) - mainstream BEV hatch
  'nissan-micra',      // Micra K14 (2016-2023) - supermini
  'nissan-pulsar',     // Pulsar C13 (2014-2018) - small hatch
  // Additional global / other-market mainstream (model-named):
  'nissan-ariya',      // Ariya (2022-present) - EV crossover
  'nissan-murano',     // Murano Z53 (2024-present) - mid-size SUV
  'nissan-altima',     // Altima L34 (2018-present) - mid-size sedan
  'nissan-maxima',     // Maxima A36 (2015-2023) - full-size sedan
  'nissan-sentra',     // Sentra B18 (2025) - compact sedan
  'nissan-kicks',      // Kicks (2024-present) - subcompact SUV
  'nissan-note',       // Note E12 (2012-2020) - supermini
  'nissan-primera',    // Primera P12 wagon (2001-2007) - mid-size estate
  'nissan-titan',      // Titan A61 crew cab (2015-2024) - full-size pickup
  'nissan-cube',       // Cube Z12 (2008-2019) - boxy compact hatch
  'nissan-sunny',      // Sunny N17 (2015) - compact sedan
  'nissan-pixo',       // Pixo (2008-2013) - city car
  'nissan-nv200',      // NV200 (2009-present) - compact panel van
  'nissan-xterra',     // X-Terra (2021) - Middle-East body-on-frame SUV
  // Dropped (not in Carsized's catalogue — no clean orthographic side render):
  // Skyline GT-R r32/r33/r34, Silvia s13/s14/s15, and the older Z-cars s30 (240Z),
  // z32 (300ZX), z33 (350Z). Only the 370Z (Z34), new Z (RZ34) and R35 GT-R exist
  // there. Revisit if a clean side source turns up.

  // Ford — a MIXED set (like Porsche/VW/Mazda/Nissan), Australia-weighted. The
  // Mustang performance generations are CHASSIS-CODED (distinct silhouette per
  // gen, resolving via the chassis tier); everything else is MODEL-NAMED,
  // resolving via the model tier. Each is the representative generation, verified
  // from its Carsized detail-page year-range (see cars/ATTRIBUTIONS.md).
  // Mustang generations (chassis-coded):
  'ford-s197',          // Mustang (2009-2014) - fifth-gen retro coupe
  'ford-s550',          // Mustang (2015-2023) - Carsized codes it LAE; S550 platform
  'ford-s650',          // Mustang (2023-present) - current S650
  // Australian core (model-named) — locally relevant lines lead the set:
  'ford-ranger',        // Ranger P703 (2022-present) - AU best-seller ute
  'ford-ranger-raptor', // Ranger Raptor P703 (2022-present) - widebody performance ute
  'ford-everest',       // Everest U704 (2022-present) - Ranger-based 7-seat SUV
  'ford-mustang',       // Mustang (1964-1966) - classic first-gen fastback (default)
  'ford-mustang-mach-e',// Mustang Mach-E LSK (2021-present) - EV crossover
  'ford-kuga',          // Kuga DFK (2019-2024) - current AU Escape platform
  'ford-escape',        // Escape (2007-2011) - earlier AU/US compact SUV
  'ford-puma',          // Puma J2K (2019-2024) - small SUV
  'ford-focus',         // Focus DEH (2022-present) - current 5-door hatch
  'ford-fiesta',        // Fiesta JHH (2017-present) - supermini
  'ford-falcon',        // Falcon FG G6E (2008-2014) - locally-built AU sedan (NetCarShow)
  // Global mainstream (model-named):
  'ford-mondeo',        // Mondeo BA7 (2014-2021) - mid-size estate
  'ford-galaxy',        // Galaxy WA6 (2015-present) - large MPV
  'ford-s-max',         // S-Max WA6 (2015-2019) - sporty MPV
  'ford-c-max',         // C-Max DXA (2010-2015) - compact MPV
  'ford-b-max',         // B-Max JK8 (2012-2017) - mini-MPV
  'ford-ka',            // Ka RU8 (2008-2016) - city car
  'ford-ecosport',      // EcoSport JK8 (2017-2022) - subcompact SUV
  'ford-edge',          // Edge SBF (2014-2020) - mid-size SUV (sold in AU as Endura)
  'ford-explorer',      // Explorer WUJ (2019-2023) - full-size SUV
  'ford-expedition',    // Expedition U553 (2018-2021) - full-size SUV
  'ford-excursion',     // Excursion (2005) - extended full-size SUV
  'ford-bronco',        // Bronco U725 (2021-present) - retro off-roader
  'ford-bronco-sport',  // Bronco Sport (2021-present) - compact crossover
  'ford-maverick',      // Maverick P758 (2021-present) - compact unibody pickup
  'ford-f-150',         // F-150 P702 (2023-present) - full-size pickup
  'ford-f-250',         // F-250 P708 (2023-present) - Super Duty pickup
  'ford-f-350',         // F-350 P558 (2016-2019) - Super Duty pickup
  'ford-fusion',        // Fusion (2012-2017) - US mid-size sedan
  'ford-taurus',        // Taurus (2009-2019) - US full-size sedan
  'ford-crown-victoria',// Crown Victoria EN114 (1997-2011) - body-on-frame sedan
  'ford-cougar',        // Cougar BCV (1998-2001) - front-drive coupe
  // Dropped — not in Carsized and no clean orthographic side on NetCarShow:
  // Territory (SX/SZ AU SUV — NetCarShow only had front/rear 3/4 + interior),
  // Ford GT supercar, Endura (covered by ford-edge, the same SBF platform).
  // Trimmed from scope (AU + mainstream focus): pre-war Model T/A/48, the Euro
  // Transit/Tourneo van family, and 60s/70s classics (Cortina, Granada, Scorpio,
  // Capri, Fairlane, Thunderbird, Taunus). All exist on Carsized — revisit to add.

  // Hyundai — a MIXED set, like Mazda/Nissan. Mainstream lines are MODEL-NAMED
  // (resolving via the model tier); the N-performance variants are MODEL-VARIANT
  // named (hyundai-i30-n, etc.). Hyundai uses few chassis codes, so this is
  // mostly model-named with the latest generation as the representative silhouette.
  // Australia-weighted — i30/Tucson/Kona/Santa Fe/i20 dominate local sales.
  // Cutouts are Carsized.com orthographic `_4x` renders (watermark-dampened, rembg'd);
  // representative generation verified from each detail-page year-range (see ATTRIBUTIONS.md).
  // AU core (model-named) — locally relevant lines lead the set:
  'hyundai-i30',         // i30 PDE (2024-present) - perennial Aus hatch
  'hyundai-tucson',      // Tucson NX4E (2024-present) - core Aus SUV
  'hyundai-kona',        // Kona SX2 (2023-present) - subcompact SUV
  'hyundai-santa-fe',    // Santa Fe MX5 (2023-present) - mid-size SUV
  'hyundai-i20',         // i20 BC3 (2023-present) - supermini hatch
  'hyundai-venue',       // Venue (2019-present) - small SUV
  'hyundai-palisade',   // Palisade LX3 (2024-present) - large 3-row SUV
  'hyundai-staria',      // Staria US4 (2021-present) - people-mover
  'hyundai-iload',       // iLoad H-1 TQ (2007-present) - commercial van (H-1 in AU)
  // Ioniq EV line (model-named):
  'hyundai-ioniq-5',     // Ioniq 5 NE (2021-present) - flagship compact EV SUV
  'hyundai-ioniq-6',     // Ioniq 6 CE (2022-present) - aerodynamic EV sedan
  'hyundai-ioniq',       // Ioniq AE (2019-present) - original liftback hybrid
  'hyundai-ioniq-9',     // Ioniq 9 ME1 (2025-present) - large 3-row EV SUV
  // N-performance variants (model-variant named):
  'hyundai-i30-n',       // i30 N PDE (2017-present) - hot hatch (distinct silhouette)
  'hyundai-i20-n',       // i20 N BC3 (2021-present) - hot supermini
  'hyundai-ioniq-6-n',   // Ioniq 6 N CE (2025-present) - high-performance EV sedan
  // Sporty coupe (model-named):
  'hyundai-veloster',    // Veloster FS (2011-2023) - asymmetrical 3-door hatch
  'hyundai-genesis-coupe', // Genesis Coupe BK (2011-present) - RWD sport coupe
  // Global mainstream (model-named):
  'hyundai-elantra',     // Elantra CN7 (2023-present) - global C-segment sedan
  'hyundai-sonata',      // Sonata DN8 (2023-present) - D-segment sedan
  'hyundai-i10',         // i10 AC3 (2019-present) - city car
  'hyundai-i40',         // i40 VF (2011-present) - D-segment estate (Europe)
  'hyundai-ix35',        // ix35 LM (2009-present) - pre-Tucson name globally
  'hyundai-nexo',        // Nexo FE (2018-present) - hydrogen fuel-cell SUV
  'hyundai-getz',        // Getz TB (2005-present) - classic i20 predecessor
  'hyundai-atos',        // Atos MX (2004-present) - classic city car
  'hyundai-creta',       // Creta SU2 (2019-present) - global B-segment SUV (iX25 in India)
  'hyundai-bayon',       // Bayon BC3 (2021-present) - European B-SUV
  'hyundai-santa-cruz',  // Santa Cruz (2021-present) - lifestyle unibody pickup
  'hyundai-inster',      // Inster AX1 (2024-present) - new city car
  'hyundai-ix20',        // ix20 JC (2015-present) - B-segment MPV
  'hyundai-azera',       // Azera HG (2011-present) - large sedan (XG series)
  'hyundai-grandeur',    // Grandeur HG (2011-present) - large sedan
  'hyundai-tiburon',     // Tiburon GK (2001-present) - sporty coupe (Cougar in some markets)
  // Dropped — not in Carsized's catalogue; NetCarShow only has angled press shots:
  // Accent (global B-segment sedan), Terracan (body-on-frame SUV). No clean
  // orthographic side render exists. Revisit if a clean side source turns up.

  // Kia — a MODEL-NAMED set, like Hyundai/Mazda. Kia uses few chassis codes,
  // so all slugs resolve via the model tier add(model): a user typing "Seltos"/"Sportage"/etc.
  // renders straight from the slug. Australia-weighted — Seltos/Sportage/Carnival/Sorento
  // dominate local sales. Cutouts are Carsized.com orthographic side renders
  // (watermark-dampened, rembg'd); year represents the generation in Carsized's catalogue.
  // AU core (model-named) — locally relevant lines lead the set:
  'kia-carnival-2020',    // Carnival (2020-present) - core AU people-mover
  'kia-seltos-2023',       // Seltos (2023-present) - top-selling small SUV
  'kia-seltos-2019',       // Seltos (2019-2022) - first generation
  'kia-sportage-2024',     // Sportage (2024-present) - core AU mid-size SUV
  'kia-sportage-2021',     // Sportage (2021-2023) - fifth generation
  'kia-sportage-2018',     // Sportage (2016-2021) - fourth generation
  'kia-sportage-2015',     // Sportage (2012-2016) - third generation
  'kia-sportage-2010',     // Sportage (2004-2010) - second generation
  'kia-sportage-2004',     // Sportage (1993-2004) - first generation
  'kia-sorento-2024',      // Sorento (2024-present) - large SUV
  'kia-sorento-2020',      // Sorento (2020-2023) - fourth generation
  'kia-sorento-2014',      // Sorento (2014-2020) - third generation
  'kia-sorento-2012',      // Sorento (2012-2014) - third gen (early)
  'kia-sorento-2002',      // Sorento (2002-2012) - first/second generation
  'kia-picanto-2023',      // Picanto (2023-present) - city car
  'kia-picanto-2017',      // Picanto (2017-2023) - third generation
  'kia-picanto-2015',      // Picanto (2011-2017) - second generation
  'kia-picanto-2009',      // Picanto (2009-2011) - first gen facelift
  'kia-picanto-2003',      // Picanto (2003-2009) - first generation
  'kia-stonic-2017',       // Stonic (2017-present) - small SUV
  // Ioniq EV line (model-named):
  'kia-ev6-2021',          // EV6 (2021-present) - flagship compact EV SUV
  'kia-ev9-2023',          // EV9 (2023-present) - large 3-row EV SUV
  'kia-ev3-2024',          // EV3 (2024-present) - small EV SUV
  'kia-ev4-2025',          // EV4 (2025-present) - EV sedan
  'kia-ev5-2025',          // EV5 (2025-present) - compact EV SUV
  // Global mainstream (model-named):
  'kia-ceed-2021',         // Ceed (2021-present) - European C-segment hatch/estate
  'kia-ceed-2015',         // Ceed (2015-2018) - third generation
  'kia-ceed-2012',         // Ceed (2012-2015) - second generation
  'kia-ceed-2006',         // Ceed (2006-2012) - first generation
  'kia-rio-2017',          // Rio (2017-present) - B-segment hatch
  'kia-rio-2011',          // Rio (2011-2017) - fourth generation
  'kia-rio-2005',          // Rio (2005-2011) - third generation
  'kia-niro-2021',         // Niro (2021-present) - hybrid SUV
  'kia-niro-2016',         // Niro (2016-2022) - first generation
  'kia-niro-2021-suv',     // Niro EV (2021-present) - electric variant
  'kia-soul-2019',         // Soul (2019-present) - boxy compact SUV
  'kia-soul-2014-5-door-hatchback', // Soul EV (2014-2019) - first-gen electric
  'kia-soul-2013',         // Soul (2012-2019) - second generation
  'kia-soul-2008',         // Soul (2008-2011) - first generation
  'kia-stinger-2017',      // Stinger (2017-present) - fastback sport sedan
  'kia-optima-2015',       // Optima (2015-2019) - D-segment sedan
  'kia-optima-2010',       // Optima (2010-2015) - third generation
  'kia-xceed-2022',        // XCeed (2022-present) - European crossover
  'kia-xceed-2019',        // XCeed (2019-2022) - first generation
  'kia-telluride-2023',    // Telluride (2023-present) - large SUV (US/Global)
  'kia-telluride-2026',    // Telluride (2026-present) - next generation
  'kia-carens-2013',       // Carens (2013-2022) - MPV (Global)
  'kia-venga-2009',        // Venga (2009-2019) - European B-MPV
  // K-series sedans (model-named):
  'kia-k5-2019',           // K5 (2019-present) - D-segment sedan (Optima successor)
  'kia-k8-2021',           // K8 (2021-present) - large luxury sedan
  'kia-k4-2024',           // K4 (2024-present) - C-segment sedan/hatch
  // Additional models:
  'kia-pv5-2025',          // PV5 (2025-present) - purpose-built vehicle
  'kia-magentis-2005',     // Magentis (2005-2009) - D-segment sedan (Optima sibling)
  'kia-magentis-2000',     // Magentis (2000-2005) - first generation
  'kia-carnival-2018',     // Carnival (2018-2020) - fourth generation
  'kia-carnival-2005',     // Carnival (2005-2014) - earlier generation
  'kia-sportage-2021-suv', // Sportage LWB (2021-2023) - long-wheelbase variant
  'kia-ceed-2018-estate-proceed', // Ceed Proceed (2018-2021) - estate variant
  'kia-ceed-2021-estate-proceed', // Ceed Proceed (2021-present) - current estate
  // Dropped — not in Carsized's catalogue; NetCarShow only has angled press shots:
  // No Kia models dropped (Carsized has excellent Kia coverage). GT variants
  // (Stinger GT, EV6 GT) not present in Carsized's catalogue as separate entries.

  // Mitsubishi — a MIXED set, like Ford/Nissan, Australia-weighted. Almost all
  // nameplates are MODEL-NAMED (resolving via the model tier add(model) — a user
  // typing "Triton"/"Outlander"/"ASX" renders straight from the slug); the one
  // chassis-pinned line is the Lancer Evolution. One file per nameplate (the
  // representative generation), verified from each Carsized detail-page year-range
  // (<title>) and chassis code (<h1> parens) — see cars/ATTRIBUTIONS.md. Note the
  // region-renamed nameplates: Carsized files the AU "Triton" as L200 and the AU
  // "Mirage" as Space Star; the AU nameplate is used as the slug (alias noted in
  // ATTRIBUTIONS). Cutouts are Carsized.com orthographic `_4x` renders
  // (watermark-dampened, rembg'd).
  // AU core (model-named) — locally relevant lines lead the set:
  'mitsubishi-triton',         // Triton/L200 KJ0T (2019-present) - AU best-seller ute (Carsized: L200)
  'mitsubishi-outlander',      // Outlander GN0W (2021-present) - core AU mid-size SUV
  'mitsubishi-asx',            // ASX RJB (2022-present) - top-selling small SUV (Clio-based gen)
  'mitsubishi-eclipse-cross',  // Eclipse Cross GK0 (2021-present) - compact crossover
  'mitsubishi-pajero-sport',   // Pajero Sport QE (2015-present) - Triton-based 7-seat 4x4 (Montero/Shogun Sport)
  'mitsubishi-pajero',         // Pajero V80 (2006-2014) - 4th-gen full-size 4x4 (Montero/Shogun)
  'mitsubishi-mirage',         // Mirage/Space Star A00 (2020-present) - city hatch (Carsized: Space Star)
  // Global / heritage (model-named) — except the chassis-pinned Evo:
  'mitsubishi-lancer',         // Lancer CY0 (2007-2017) - C-segment sedan
  'mitsubishi-lancer-evolution',// Lancer Evolution X CZ4A (2007-2016) - chassis-pinned; only Evo gen in Carsized
  'mitsubishi-colt',           // Colt Z30 (2008-2013) - supermini (genuine Mitsubishi gen, not the Renault-based 2023)
  'mitsubishi-grandis',        // Grandis NA0W (2003-2011) - 7-seat MPV
  'mitsubishi-i-miev',         // i-MiEV HA0 (2009-2017) - kei-derived city EV
  // Dropped — not in Carsized's catalogue (no clean orthographic side render):
  // 3000GT/GTO, Magna/Verada (AU-built, absent like the Falcon), Galant, Eclipse
  // coupe, Delica, Carisma, Outlander PHEV (no separate render — covered by
  // Outlander). The Lancer Evolution JDM gap mirrors Nissan/Toyota: only the Evo X
  // (CZ4A) exists in Carsized — no Evo VII/VIII/IX. Revisit if a clean source turns up.

  // Tesla — a small, all-MODEL-NAMED set covering every nameplate Carsized
  // catalogues. Tesla doesn't use chassis codes, so all resolve via the model
  // tier. Each is the current generation, verified from its Carsized detail-page
  // year-range. Sourced from the lossless `_4x.png` (native alpha, no rembg) with
  // a cosmetically dampened watermark (see cars/ATTRIBUTIONS.md).
  'tesla-model-s',      // Model S (2021-present refresh) - liftback flagship
  'tesla-model-3',      // Model 3 (2023-present "Highland" facelift) - sedan
  'tesla-model-x',      // Model X (2015-2021, only gen Carsized lists) - falcon-wing SUV
  'tesla-model-y',      // Model Y (2025-present "Juniper" facelift) - SUV
  'tesla-cybertruck',   // Cybertruck (2023-present) - stainless pickup
  // Dropped — not in Carsized's catalogue: Roadster (original 2008 + 2020
  // next-gen) and the Semi. Revisit if a clean orthographic side source turns up.

  // Subaru — a MIXED set, like Ford/Nissan, Australia-weighted. ONE file per
  // nameplate (representative/current generation), all MODEL-NAMED — the
  // enthusiast lines (WRX, BRZ) each have only a single distinct generation in
  // Carsized, so none warrant chassis-pinning. Each gen verified from its
  // Carsized detail-page title year-range + h1 chassis code. Sourced from the
  // lossless `_4x.png` (native alpha, no rembg) with a cosmetically dampened
  // watermark (see cars/ATTRIBUTIONS.md). Region renames use the AU nameplate as
  // the slug (XV not Crosstrek, Liberty not Legacy) — alias noted in ATTRIBUTIONS.
  // AU-core:
  'subaru-outback',     // Outback (BU, 2025-present) - perennial Aus wagon-SUV
  'subaru-forester',    // Forester (SL, 2024-present) - core Aus family SUV
  'subaru-xv',          // XV / Crosstrek (GU, 2023-present) - AU badges current gen "Crosstrek"
  'subaru-impreza',     // Impreza (GU, 2023-present) - hatch, shares GU platform with XV
  'subaru-wrx',         // WRX (VB, 2021-present) - current performance sedan
  'subaru-liberty',     // Liberty / Legacy (BW, 2023-present sedan) - sold as Legacy overseas
  // Heritage / sport:
  'subaru-brz',         // BRZ (ZC, 2012-2016) - Toyota 86 twin; Carsized has only gen-1
  'subaru-svx',         // SVX Alcyone (CX, 1991-1996) - heritage GT coupe
  'subaru-levorg',      // Levorg (V1, 2014-2019) - sports wagon
  // Extended / other-region:
  'subaru-ascent',      // Ascent (WM, 2022-present) - NA-market 3-row SUV
  'subaru-baja',        // Baja (2002-2006) - NA-market car-based pickup
  'subaru-justy',       // Justy (MHY, 2003-2007) - rebadged supermini
  'subaru-solterra',    // Solterra (2022-present) - EV SUV, Toyota bZ4X twin
  // Dropped — not in Carsized's catalogue (no clean orthographic side render):
  // WRX STI (no gen separate from the WRX), Tribeca, Vivio, Pleo, Exiga, Trezia,
  // Sambar, and the JDM older Impreza WRX/STI gens (GC/GD/GR). Carsized DOES list
  // older Outback/Forester/Impreza/Legacy/Ascent/XV gens too — kept one current
  // file per nameplate. Revisit if a per-gen split is wanted.
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

// Point the cutout img at `src` and reveal it only once its bitmap is fully
// decoded. The image stays display:none (no .reveal) until then, so a slow
// network or device can't flash a half-painted, top-down-loading car before the
// reveal animation runs. decode() resolves on a paint-ready bitmap; we fall back
// to the load event where it's unsupported. The src guard means a rapid vehicle
// switch won't reveal a stale image after a newer one was set.
export function showCutout(imgEl, src) {
  if (imgEl.src.endsWith(src)) {
    if (imgEl.complete && imgEl.naturalWidth) imgEl.classList.add('reveal');
    return;
  }
  imgEl.classList.remove('reveal');
  imgEl.src = '';
  imgEl.src = src;
  const reveal = () => {
    if (imgEl.src.endsWith(src) && imgEl.naturalWidth) imgEl.classList.add('reveal');
  };
  if (imgEl.decode) imgEl.decode().then(reveal).catch(reveal);
  else imgEl.addEventListener('load', reveal, { once: true });
}

// Point imgEl at the cutout and return true, or clear it and return false. The
// caller uses the return to pick the stage state: cutout vs photo vs cover.
export function renderVehicleCutout(imgEl, car) {
  if (!imgEl) return false;
  const src = vehicleCutoutSrc(car);
  if (!src) {
    imgEl.removeAttribute('src');
    imgEl.classList.remove('loaded', 'reveal');
    return false;
  }
  showCutout(imgEl, src);
  imgEl.classList.add('loaded');
  return true;
}
