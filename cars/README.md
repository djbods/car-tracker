# Vehicle cutouts

Clean **side-profile, transparent-background PNGs** that render as the floating
"toy car" hero on the car card (the Porsche-configurator look).

## Naming

`<make>-<model>[-<variant>].png`, all lowercase, non-alphanumerics → `-`.

- `make` uses the same normalisation as the brand logos (see `MAKE_ALIASES` in
  `../logos.js`): BMW → `bmw`, Mercedes-Benz → `mercedes`, Land Rover →
  `land_rover`, etc.
- Examples: `bmw-530i.png`, `toyota-86.png`, `ford-mustang-gt.png`.

## Registering a file

Dropping a PNG in here is **not** enough — the browser can't list the folder.
Add its slug to the `CUTOUT_SLUGS` set in `../cars.js` so the card knows it
exists. A slug that isn't registered falls back to the brand emblem, so the app
never shows a broken image.

## Sourcing

Use permissively-licensed or self-made side-profile renders on a transparent
background. **Do not** scrape copyrighted OEM/configurator imagery. For
auto-coverage across every model at SaaS scale, swap `vehicleCutoutSrc()` in
`../cars.js` for a licensed API (imagin.studio / CarImages) — the card consumes
it unchanged.
