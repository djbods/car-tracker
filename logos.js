// Manufacturer logo lookup. Files in /logos/ are official brand logos pulled
// from Wikimedia Commons / Wikipedia (fair use) and Simple Icons (Ferrari),
// recoloured to read against the dark UI. Each logo renders as a plain <img>
// directly on the dark background — no plate.
//
// Most are SVG; Holden and Alfa Romeo have only fair-use PNG sources on
// Wikipedia, so they render from .png — see PNG_BRANDS below.

const MAKE_ALIASES = {
  // German
  'bmw':            'bmw',
  'mercedes':       'mercedes',
  'mercedes-benz':  'mercedes',
  'merc':           'mercedes',
  'benz':           'mercedes',
  'audi':           'audi',
  'porsche':        'porsche',
  'volkswagen':     'volkswagen',
  'vw':             'volkswagen',
  'mini':           'mini',
  'mini cooper':    'mini',
  // Japanese
  'toyota':         'toyota',
  'mazda':          'mazda',
  'honda':          'honda',
  'subaru':         'subaru',
  'nissan':         'nissan',
  'mitsubishi':     'mitsubishi',
  'mitsi':          'mitsubishi',
  'lexus':          'lexus',
  'suzuki':         'suzuki',
  'isuzu':          'isuzu',
  // American
  'ford':           'ford',
  'tesla':          'tesla',
  'jeep':           'jeep',
  'rivian':         'rivian',
  // Korean
  'hyundai':        'hyundai',
  'kia':            'kia',
  'genesis':        'genesis',
  // British
  'jaguar':         'jaguar',
  'land rover':     'land_rover',
  'land-rover':     'land_rover',
  'landrover':      'land_rover',
  'range rover':    'land_rover',
  'range-rover':    'land_rover',
  'rangerover':     'land_rover',
  'aston martin':   'aston_martin',
  'aston-martin':   'aston_martin',
  'aston':          'aston_martin',
  'bentley':        'bentley',
  'rolls-royce':    'rolls_royce',
  'rolls royce':    'rolls_royce',
  'rollsroyce':     'rolls_royce',
  'rr':             'rolls_royce',
  'mclaren':        'mclaren',
  'lotus':          'lotus',
  // Italian
  'ferrari':        'ferrari',
  'lamborghini':    'lamborghini',
  'lambo':          'lamborghini',
  'maserati':       'maserati',
  'alfa':           'alfa_romeo',
  'alfa romeo':     'alfa_romeo',
  'alfa-romeo':     'alfa_romeo',
  'alfaromeo':      'alfa_romeo',
  'fiat':           'fiat',
  // French
  'peugeot':        'peugeot',
  'renault':        'renault',
  'citroen':        'citroen',
  'citroën':        'citroen',
  // Swedish
  'volvo':          'volvo',
  'polestar':       'polestar',
  // Czech
  'skoda':          'skoda',
  'škoda':          'skoda',
  // Chinese
  'mg':             'mg',
  'byd':            'byd',
  'gwm':            'gwm',
  'great wall':     'gwm',
  'great-wall':     'gwm',
  'haval':          'haval',
  // Australian (defunct, much loved)
  'holden':         'holden',
  // French exotic
  'bugatti':        'bugatti',
};

// The brand emblems are colour PNGs (from the car-logos dataset, recoloured
// for nothing — used as-is). Only the generic fallback and GWM (no dataset
// entry) remain hand-authored SVGs.
const SVG_SLUGS = new Set([
  '_generic',
  // Current, flat, reads-on-white emblems hand-sourced as SVG (replacing the
  // dataset's stale/wordmark PNGs).
  'gwm', 'renault', 'volvo', 'bentley', 'maserati', 'suzuki', 'haval', 'mclaren',
  'genesis', 'aston_martin', 'peugeot', 'lexus',
]);

const GENERIC = '_generic';

// Display names for the onboarding manufacturer picker, ordered roughly by
// popularity in the AU market so the common choices sit at the top of the
// grid. Every entry resolves to a real logo file via MAKE_ALIASES — keep
// this list and the alias map in sync. Free-text "Other" covers anything
// not here, so this doesn't need to be exhaustive.
export const PICKER_MAKES = [
  'BMW', 'Toyota', 'Mercedes-Benz', 'Mazda', 'Ford', 'Volkswagen', 'Audi',
  'Honda', 'Hyundai', 'Kia', 'Subaru', 'Nissan', 'Mitsubishi', 'Lexus',
  'Tesla', 'Porsche', 'Volvo', 'Suzuki', 'Jeep', 'Isuzu', 'MG', 'Mini',
  'Land Rover', 'Jaguar', 'Genesis', 'Polestar', 'Renault', 'Peugeot',
  'Citroën', 'Škoda', 'Fiat', 'Alfa Romeo', 'BYD', 'GWM', 'Haval', 'Holden',
  'Rivian', 'Lotus', 'Maserati', 'Aston Martin', 'Bentley', 'Rolls-Royce',
  'McLaren', 'Ferrari', 'Lamborghini', 'Bugatti',
];

export function brandLogoSlug(make) {
  const key = (make || '').trim().toLowerCase();
  return MAKE_ALIASES[key] || GENERIC;
}

// Inject the brand logo for `make` into `containerEl` as an <img>. Using
// <img> (vs inline SVG) keeps each logo isolated — the garage list can show
// many at once without IDs in the source SVGs colliding with each other.
// Unknown makes fall through to _generic via brandLogoSlug.
export function renderBrandLogo(containerEl, make) {
  if (!containerEl) return;
  const slug = brandLogoSlug(make);
  const ext = SVG_SLUGS.has(slug) ? 'svg' : 'png';
  const src = `logos/${slug}.${ext}`;
  let img = containerEl.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    containerEl.replaceChildren(img);
  }
  if (!img.src.endsWith(src)) img.src = src;
}
