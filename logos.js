// Manufacturer logo lookup. SVGs in /logos/ use `currentColor` so they
// inherit the surrounding CSS color (the gold accent in this app).
//
// One fetch per brand per page load — kept in a Map so the My Garage list
// can render N rows without re-hitting the network.

const LOGO_CACHE = new Map();

// Lowercased input → slug for the SVG filename. Aliases cover the common
// shorter forms ("vw", "merc") and the hyphenated official names.
const MAKE_ALIASES = {
  'bmw':            'bmw',
  'mercedes':       'mercedes',
  'mercedes-benz':  'mercedes',
  'merc':           'mercedes',
  'benz':           'mercedes',
  'audi':           'audi',
  'porsche':        'porsche',
  'volkswagen':     'volkswagen',
  'vw':             'volkswagen',
  'toyota':         'toyota',
  'mazda':          'mazda',
  'ford':           'ford',
  'honda':          'honda',
  'hyundai':        'hyundai',
  'kia':            'kia',
  'subaru':         'subaru',
  'nissan':         'nissan',
  'mitsubishi':     'mitsubishi',
  'mitsi':          'mitsubishi',
  'tesla':          'tesla',
};

const GENERIC = '_generic';

export function brandLogoSlug(make) {
  const key = (make || '').trim().toLowerCase();
  return MAKE_ALIASES[key] || GENERIC;
}

async function fetchLogo(slug) {
  if (LOGO_CACHE.has(slug)) return LOGO_CACHE.get(slug);
  const promise = (async () => {
    try {
      const res = await fetch(`logos/${slug}.svg`);
      if (!res.ok) throw new Error(`logo ${slug} not found`);
      return await res.text();
    } catch {
      return null;
    }
  })();
  LOGO_CACHE.set(slug, promise);
  return promise;
}

// Inject the brand logo for `make` into `containerEl`. Falls back to the
// generic car silhouette for unknown brands. Clears the container if both
// the brand logo and the generic fallback fail to load.
export async function renderBrandLogo(containerEl, make) {
  if (!containerEl) return;
  const slug = brandLogoSlug(make);
  let svg = await fetchLogo(slug);
  if (!svg && slug !== GENERIC) svg = await fetchLogo(GENERIC);
  containerEl.innerHTML = svg || '';
}
