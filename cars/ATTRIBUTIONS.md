# Cutout image attributions / provenance

Each cutout is a background-removed, alpha-feathered derivative of a source
image. Record the source + licence here so the provenance is auditable —
especially important before any public / commercial launch.

The earlier non-chassis-coded BMW cutouts (`bmw-530i`, `bmw-528i`,
`bmw-530i-green`, `bmw-335i`) were **removed** — they were model-named duplicates
of the chassis-coded coverage below (E60/E39 5-series, E92 3-series), were never
registered in `CUTOUT_SLUGS`, and carried unconfirmed / non-open provenance.

## BMW chassis cutouts (early batch — mixed provenance)

The chassis-coded BMW cutouts were hand-sourced piecemeal early on and never
fully recorded here. A watermark audit (the residual-coring detector in
`cutout-work/`) found the set is **mixed**: six are Carsized renders carrying the
tiled "carsized.com" mark; the rest show no carsized watermark (different /
undocumented sources — `e21` is a small low-res image, the F/G-series renders are
watermark-free).

| Files | Source | Licence / status |
|-------|--------|------------------|
| `bmw-e28`, `bmw-e60`, `bmw-e70`, `bmw-e85`, `bmw-e87`, `bmw-e92` | Carsized.com orthographic side-view renders (confirmed by the baked-in tiled "carsized.com" watermark) | ⚠️ **not** an open licence — faint tiled "carsized.com" watermark; now **dampened** in place via `dampen_cutout_inplace.py` (Lab-space edge-preserving coring) — cosmetic only, confers no reuse right |
| `bmw-e9`, `bmw-e21`, `bmw-e30`, `bmw-e34`, `bmw-e36`, `bmw-e38`, `bmw-e39`, `bmw-e46`, `bmw-f80`, `bmw-f82`, `bmw-g20`, `bmw-g22`, `bmw-g80`, `bmw-g82`, `bmw-g87` | Undocumented (no carsized watermark detected) | ⚠️ source/licence to confirm — provenance not recorded; left untouched by this dampening pass |

## Mercedes-Benz (29 chassis cutouts)

Full C / E / S / SL lineage plus the AMG GT (C190) and G-Class (W463).

| Files | Source | Licence / status |
|-------|--------|------------------|
| `mercedes-w198.png` (300SL Gullwing) | Petrolicious (cdn.shopify.com) press/editorial image | ⚠️ source/licence to confirm — **watermark-free** |
| `mercedes-w113.png` (280SL Pagoda) | bhauction.com auction listing photo | ⚠️ source/licence to confirm — **watermark-free** |
| The other 27 (`r107`, `r129`, `r230`, `r231`, `r232`, `w116`, `w123`, `w124`, `w126`, `w140`, `w201`, `w202`, `w203`, `w204`, `w205`, `w206`, `w210`, `w211`, `w212`, `w213`, `w214`, `w220`, `w221`, `w222`, `w223`, `c190`, `w463`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — carried a faint tiled "carsized.com" watermark lightly baked into the bodywork (background watermark removed by rembg); now additionally **dampened** in place via `dampen_cutout_inplace.py` (Lab-space edge-preserving coring) — cosmetic only, confers no reuse right |

## Bugatti (8 model cutouts)

Bugatti uses model names rather than chassis codes, so these slugs are
model-named and resolve via the model tier. Carsized only catalogues two
Bugattis (Chiron, EB110); the remaining six were sourced from NetCarShow.com
"Side_Profile" studio press photos (background removed by rembg). Type 35 (1924)
and Type 57 (1936) were requested but **dropped** — no clean orthographic
side-view render of either could be sourced.

| Files | Source | Licence / status |
|-------|--------|------------------|
| `bugatti-chiron.png`, `bugatti-eb110.png` | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — faint tiled "carsized.com" watermark baked into bodywork (background watermark removed by rembg); now additionally **dampened** in place via `dampen_cutout_inplace.py` (Lab-space edge-preserving coring) — cosmetic only, confers no reuse right |
| `bugatti-veyron.png`, `bugatti-divo.png`, `bugatti-centodieci.png`, `bugatti-mistral.png`, `bugatti-bolide.png`, `bugatti-tourbillon.png` | NetCarShow.com "Side_Profile" studio press photos (manufacturer press imagery) | ⚠️ source/licence to confirm — copyrighted press photos, background removed by rembg; **not** an open licence |

## Porsche (21 cutouts)

A MIXED slug set. The 911 (`930`/`964`/`993`/`996`/`997`/`991`/`992`) and the
mid-engine Boxster/Cayman lines (`986`/`987`/`981`/`982`) are chassis-coded and
resolve via the chassis tier; the standalone model lines (Cayenne, Macan,
Panamera, Taycan) and the classics/halo cars (944, 928, 356, 959, 918,
Carrera GT) are model-named and resolve via the model tier.

Carsized has deep Porsche coverage and supplied 17 of the 21. The five it lacks
a usable orthographic side render for were sourced from NetCarShow.com "Side
Profile" press photos: `porsche-996` (Carsized has no 996 — used the 911 Carrera
4S 2002), `porsche-959`, `porsche-918`, `porsche-carrera-gt`, and
`porsche-taycan` (Carsized's only Taycan sedan listing carried a baked-in "008"
race livery, so the clean Taycan Turbo S press shot was used instead).

| Files | Source | Licence / status |
|-------|--------|------------------|
| `porsche-930`, `porsche-964`, `porsche-993`, `porsche-997`, `porsche-991`, `porsche-992`, `porsche-986`, `porsche-987`, `porsche-981`, `porsche-982`, `porsche-cayenne`, `porsche-macan`, `porsche-panamera`, `porsche-944`, `porsche-928`, `porsche-356` | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — faint tiled "carsized.com" watermark baked into bodywork (background watermark removed by rembg); now additionally **dampened** in place via `dampen_cutout_inplace.py` (Lab-space edge-preserving coring) — cosmetic only, confers no reuse right |
| `porsche-996.png`, `porsche-918.png`, `porsche-carrera-gt.png`, `porsche-taycan.png` | NetCarShow.com "Side Profile" studio press photos (manufacturer press imagery) | ⚠️ source/licence to confirm — copyrighted press photos, background removed by rembg; **not** an open licence |
| `porsche-959.png` | NetCarShow.com "Side Profile" press photo (Porsche Museum image) | ⚠️ source/licence to confirm — carries a faint "Porsche Museum" text stamp low on the rocker panel; **not** an open licence |

## Audi (36 cutouts)

A MIXED slug set, like Porsche/Volkswagen. The core saloon lines and the TT are
chassis/type-coded and resolve via the chassis tier — A4 (`b5`-`b9`), A6
(`c4`-`c8`), A8 (`d2`-`d5`), A3 (`8l`/`8p`/`8v`/`8y`) and TT (`8n`/`8j`/`8s`).
The standalone model lines (`a1`, `a5`, `a7`, `q2`, `q3`, `q5`, `q7`, `q8`,
`r8`), the EVs (`e-tron-gt`, `q4-e-tron`, `q8-e-tron`) and the classics
(`ur-quattro`, `80`, `100`) are model-named and resolve via the model tier.

The saloon lines use the **sedan** body as the representative silhouette, except
`audi-b6` (A4 B6) and `audi-c4` (A6 C4) which use the **Avant** estate — Carsized
has no sedan render for those two generations. `audi-8n` (TT 8N) is a **roadster**
(Carsized has no 8N coupe) and `audi-8s` (TT 8S) is the **RS coupe** (the only 8S
coupe render Carsized carries; subtle RS aero / fixed wing).

Carsized has deep Audi coverage and supplied 35 of the 36. The one it lacks is
the A8 D2 (no pre-2002 A8 listing), sourced from a NetCarShow.com "Side Profile"
press photo.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 35 except `audi-d2` (`b5`-`b9`, `c4`-`c8`, `d3`-`d5`, `8l`/`8p`/`8v`/`8y`, `8n`/`8j`/`8s`, `a1`, `a5`, `a7`, `q2`, `q3`, `q5`, `q7`, `q8`, `r8`, `e-tron-gt`, `q4-e-tron`, `q8-e-tron`, `ur-quattro`, `80`, `100`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — carried a faint tiled "carsized.com" watermark lightly baked into the bodywork (background watermark removed by rembg); now additionally **dampened** in place via `dampen_cutout_inplace.py` (Lab-space edge-preserving coring) — cosmetic only, confers no reuse right |
| `audi-d2.png` (A8 D2) | NetCarShow.com "Side Profile" studio press photo (manufacturer press imagery) | ⚠️ source/licence to confirm — copyrighted press photo, background removed by rembg; **not** an open licence |

## Volkswagen (28 cutouts)

A MIXED slug set, like Porsche. The Golf (`mk1`-`mk8`) and Transporter
(`t1`/`t4`/`t5`/`t6`) lines are generation/chassis-coded and the Beetle
(`type1`) is chassis-coded — all resolve via the chassis tier; the standalone
model lines and classics (`new-beetle`, `scirocco`, `polo`, `passat`,
`phaeton`, `touareg`, `tiguan`, `up`, `id3`, `id4`, `id-buzz`, `jetta`,
`arteon`, `amarok`, `id7`) are model-named and resolve via the model tier.

All 28 came from Carsized, which has deep VW coverage. Type 2 (T2 bay-window)
and Type 3 (T3 Vanagon) buses, the Corrado and the Karmann Ghia were requested
but **dropped** — no clean orthographic side render could be sourced. Carsized
lacks all four (its only pre-T5 bus listing is the 1990 model, which is the
front-engine **T4**, used here as `t4`); NetCarShow has only *concept* buses,
no Karmann Ghia, and a single front-3/4 Corrado press shot — none usable as a
side profile.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 28 (`mk1`-`mk8`, `t1`, `t4`, `t5`, `t6`, `type1`, `new-beetle`, `scirocco`, `polo`, `passat`, `phaeton`, `touareg`, `tiguan`, `up`, `id3`, `id4`, `id-buzz`, `jetta`, `arteon`, `amarok`, `id7`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — carried a faint tiled "carsized.com" watermark lightly baked into the bodywork (background watermark removed by rembg); now additionally **dampened** in place via `dampen_cutout_inplace.py` (Lab-space edge-preserving coring) — cosmetic only, confers no reuse right |

## Mazda (16 cutouts)

Brand after Toyota, again Australia-weighted (Mazda3 / CX-5 / CX-30 lead local
sales). MAINSTREAM lines are MODEL-NAMED (resolve via the model tier); the **MX-5
is CHASSIS-CODED** (`na`/`nb`/`nd`, resolve via the chassis tier — one file per
generation, BMW-style) because its silhouette changes meaningfully per gen.

All 16 came from Carsized. Representative generations (verified from each source
page's year-range): Mazda3 = 2019 BP **hatchback** (the brand design statement),
Mazda2 = 2014 DJ, Mazda6 = 2018 GJ sedan, CX-5 = 2017 KF (the ubiquitous one),
CX-9 = 2016 TC, CX-3 = 2015 DK, Mazda5 = 2010 CW people-mover, MX-5 NA = 1989,
NB = 2000, ND = 2015 roadster.

**New this run — watermark dampening.** Carsized bakes a faint tiled
"carsized.com" text band across the lower bodywork. Earlier brands left it lightly
baked in; for Mazda each raw render was first run through `dampen_watermark.py`
(Lab-space edge-preserving "coring": median-smooth each channel, keep only
large-amplitude detail = real edges, discard the low-amplitude watermark texture —
luma-weighted, since the mark reads almost entirely as a small luma wobble). QA'd
at full res on the worst case (white CX-60) and a saturated case (red NA): the
text band is gone while panel gaps, handles and trim stay crisp. The mark is
**suppressed, not provably licence-cleared** — treat as below.

Requested but **dropped** — not in Carsized's catalogue at all, and NetCarShow
only carries angled perspective press shots (the user prefers dropping over mixing
in non-orthographic photos): the rotaries `rx-7` (fb/fc/fd), `rx-8`, `cosmo`, plus
`mx-6`, `626`, `323-gtx`/`familia`, and the `bt-50` ute. MX-5 `nc` (2005-2015) is
also absent from Carsized, so that generation is skipped (na/nb/nd only). Also
skipped as non-Australian-market / redundant: `cx-50`, the `6e` EV, `demio`.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 16 (`3`, `2`, `6`, `cx-3`, `cx-30`, `cx-5`, `cx-7`, `cx-9`, `cx-60`, `cx-80`, `cx-90`, `mx-30`, `5`, `na`, `nb`, `nd`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; here additionally **dampened** via `dampen_watermark.py`, but dampening is cosmetic and does **not** confer any reuse right |

## Toyota (56 cutouts)

A comprehensive, Australia-weighted set covering every distinct Toyota nameplate
Carsized catalogues with a clean side render. All MODEL-NAMED, resolving via the
model tier (a user typing "Corolla"/"HiLux"/"86" renders straight from the slug).
HiLux/LandCruiser/RAV4/Corolla lead local ownership, so the AU core is registered
first. Each is the representative generation, verified from its Carsized
detail-page year-range (`<title>`) and chassis code (`<h1>` parens).

**Sourcing change vs. the original 23-cutout run:** these come from the **lossless
`_4x.png`**, which carries Carsized's own native anti-aliased alpha matte — far
smoother than re-matting the lossy `_4x.webp` (which produced "minecraft" jagged
edges). **No rembg** is used; `process_png_cutout.py` crops to the alpha bbox
(+2% pad), floods fully-transparent RGB with the median opaque colour, dampens the
baked "carsized.com" watermark in Lab space (cosmetic only), and reattaches the
original alpha unchanged.

**AU-core (22)** — generation/chassis verified per detail page: HiLux **AN1P**
(2016 **double-cab** — the iconic Aus silhouette), RAV4 **XA50** (2019), Corolla
**E210** (2022 sedan), LandCruiser **J300** (2021, 300-series), Prado **J250**
(2023), Camry **XV80** (2024), Yaris **XP210** (2020 5-door), Kluger **XU70**
(2019 — sold as Highlander overseas; **Kluger** is the AU name), C-HR **X20**
(2023), Corolla Cross **XG1TJ** (2020), Yaris Cross **XPB1F** (2021), Crown
**S235** (2022 fastback), Prius **XW60** (2022), Fortuner **AN160** (2020),
4Runner **N500** (2024), Tundra **XK70** (2021 double-cab), Tacoma **N400**
(2023), Sequoia **XK80** (2023), FJ Cruiser **XJ10** (2006), bZ4X **EAM** (2022),
Mirai **AD2** (2020), Tarago **XR30** (2000 — sold as **Previa**/Estima overseas).

**Heritage / sport (6):** 86 / GT86 **ZN6** (2012 — Subaru BRZ twin, AU naming),
GR86 **ZN8** (2021), GR Yaris **XP210** (2020 3-door GR), Supra **A90** (2019,
Mk5), MR2 **SW20** (1989, mid-engine), Celica **T230** (1999, liftback).

**Extended / other-region (28):** Alphard **AH30** (2015), Auris **E180** (2012),
Avalon **XX50** (2018), Avensis **T27** (2009), Aygo **AB40** (2018), Aygo X
**AB7** (2022), Corolla Verso **R1** (2004), Crown Signia **S238** (2024), Grand
Highlander **AS10** (2023), iQ **AJ1** (2008), Matrix **E140** (2008), Paseo
**L50** (1995), Prius c **NHP10** (2011, Aqua), Prius+ **XW30** (2011), Proace
**V** (2016), Proace City **E** (2024), Raize **A250** (2019), Rush **F800**
(2017), Sienna **XL40** (2020), Solara **XV30** (2003), Starlet **P90** (1996),
Tercel **L20** (1982), Urban Cruiser **YF** (2020), Veloz **W100** (2021), Venza
**XU80** (2020), Verso **AR2** (2013), Verso-S **XP120** (2010), Yaris Verso
**P2** (2003).

Requested/expected but **dropped** — no clean orthographic side render exists
(Carsized lacks them, or not in catalogue; NetCarShow only carries angled
perspective press shots, verified for the A80 Supra): `ae86`, Supra Mk4 `a80`,
Supra Mk3 `a70`, `gr-corolla`, `2000gt`, `fj40`, `landcruiser-70` (70-series),
`soarer`, `echo`, and `aurion` (AU/US-built). Revisit if a clean side source
turns up.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 56 (`hilux`, `rav4`, `corolla`, `landcruiser`, `prado`, `camry`, `yaris`, `kluger`, `c-hr`, `corolla-cross`, `yaris-cross`, `crown`, `prius`, `fortuner`, `4runner`, `tundra`, `tacoma`, `sequoia`, `fj-cruiser`, `bz4x`, `mirai`, `tarago`, `86`, `gr86`, `gr-yaris`, `supra`, `mr2`, `celica`, `alphard`, `auris`, `avalon`, `avensis`, `aygo`, `aygo-x`, `corolla-verso`, `crown-signia`, `grand-highlander`, `iq`, `matrix`, `paseo`, `prius-c`, `prius-plus`, `proace`, `proace-city`, `raize`, `rush`, `sienna`, `solara`, `starlet`, `tercel`, `urban-cruiser`, `veloz`, `venza`, `verso`, `verso-s`, `yaris-verso`) | Carsized.com orthographic `_4x.png` side-view renders (native alpha matte, no rembg) | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; here **dampened** via the Lab-space coring in `process_png_cutout.py`, but dampening is cosmetic and does **not** confer any reuse right |

## Nissan (26 cutouts)

A MIXED set, like Porsche/VW/Mazda. The enthusiast Z-car and GT-R lines are
CHASSIS-CODED (`z34`, `rz34`, `r35`), resolving via the chassis tier; the
mainstream / AU-market lines are MODEL-NAMED, resolving via the model tier.
Australia-weighted — Patrol/X-Trail/Qashqai/Navara dominate local sales. Each is
the representative generation, verified from its Carsized detail-page year-range:
370Z = **Z34** (2009-2020), Z = **RZ34** (2023-present), GT-R = **R35** (the
2016-2022 facelift, the only GT-R Carsized catalogues), Patrol = **Y62**
(2021-2023 facelift), Navara = **D23/NP300** (2014-present), X-Trail = **T33**
(2021-present), Qashqai = **J12** (2021-2024), Pathfinder = **R53**
(2021-present), Juke = **F16** (2019-2024), Leaf = **ZE1** hatch (2017-2025),
Micra = **K14** (2016-2023), Pulsar = **C13** (2014-2018).

A further **14 model-named mainstream** lines were added from Carsized to broaden
coverage beyond the AU core (generation/year from each detail-page range): Ariya
(2022-present), Murano **Z53** (2024-present), Altima **L34** (2018-present),
Maxima **A36** (2015-2023), Sentra **B18** (2025), Kicks (2024-present), Note
**E12** (2012-2020), Primera **P12** wagon (2001-2007), Titan **A61** crew cab
(2015-2024), Cube **Z12** (2008-2019), Sunny **N17** (2015), Pixo (2008-2013),
NV200 (2009-present), X-Terra (2021).

Requested but **dropped** — not in Carsized's catalogue, no clean orthographic
side render: the Skyline GT-R `r32`/`r33`/`r34`, Silvia `s13`/`s14`/`s15`, and the
older Z-cars `s30` (240Z), `z32` (300ZX), `z33` (350Z). Only the 370Z (Z34), the
new Z (RZ34) and the R35 GT-R exist there. Revisit if a clean side source turns up.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 26 (`z34`, `rz34`, `r35`, `patrol`, `navara`, `x-trail`, `qashqai`, `pathfinder`, `juke`, `leaf`, `micra`, `pulsar`, `ariya`, `murano`, `altima`, `maxima`, `sentra`, `kicks`, `note`, `primera`, `titan`, `cube`, `sunny`, `pixo`, `nv200`, `xterra`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; here additionally **dampened** via `dampen_watermark.py`, but dampening is cosmetic and does **not** confer any reuse right |

## Ford (35 cutouts)

A MIXED set, like Porsche/VW/Mazda/Nissan, and Australia-weighted — Ford is one of
the most significant marques in the AU market (the locally-built Falcon/Territory,
the best-selling Ranger, the Mustang halo car). The Mustang performance generations
are CHASSIS-CODED (`s197`, `s550`, `s650`), resolving via the chassis tier; every
other line is MODEL-NAMED, resolving via the model tier. Scope this run was **AU +
mainstream** (pre-war, the Euro Transit/Tourneo van family, and the 60s/70s classics
were trimmed — they exist on Carsized and can be added later).

Each is the representative generation, verified from its Carsized detail-page
year-range and chassis code (shown in the page `<h1>`): Mustang **S197** (2009-2014),
**S550** (2015-2023; Carsized labels it LAE — S550 is the platform name owners type),
**S650** (2023-present); the classic first-gen Mustang (1964-1966 fastback) is the
model-named default. Ranger **P703** (2022-present) + Ranger Raptor **P703**
(2022-present), Everest **U704** (2022-present), Mach-E **LSK** (2021-present), Kuga
**DFK** (2019-2024), Escape (2007-2011), Puma **J2K** (2019-2024), Focus **DEH**
(2022-present), Fiesta **JHH** (2017-present). Globals: Mondeo **BA7** estate
(2014-2021), Galaxy **WA6** (2015-present), S-Max **WA6** (2015-2019), C-Max **DXA**
(2010-2015), B-Max **JK8** (2012-2017), Ka **RU8** (2008-2016), EcoSport **JK8**
(2017-2022), Edge **SBF** (2014-2020 — sold in AU as the **Endura**), Explorer
**WUJ** (2019-2023), Expedition **U553** (2018-2021), Excursion (2005), Bronco
**U725** (2021-present), Bronco Sport (2021-present), Maverick **P758**
(2021-present), F-150 **P702** (2023-present), F-250 **P708** (2023-present), F-350
**P558** (2016-2019), Fusion (2012-2017), Taurus (2009-2019), Crown Victoria
**EN114** (1997-2011), Cougar **BCV** (1998-2001).

**Falcon** is the one exception sourced outside Carsized: the locally-built AU Falcon
(and Territory) are **not** in Carsized's catalogue, so the **FG Falcon G6E
(2008-2014)** was taken from a NetCarShow press photo — a clean orthographic-ish
studio side shot. NetCarShow sources are **not** watermark-dampened (their mark sits
on the background corners and is removed by rembg, not baked into the bodywork).

Requested/expected but **dropped**: **Territory** (SX/SZ) — NetCarShow only carries
front/rear 3/4 and interior shots, no clean side, so it falls back to the Ford
emblem; the **Ford GT** supercar — not catalogued by Carsized; **Endura** — it *is*
the AU name for the SBF Edge, so `ford-edge` already covers it. Revisit Territory if
a clean orthographic side source turns up.

| Files | Source | Licence / status |
|-------|--------|------------------|
| 34 Carsized (`s197`, `s550`, `s650`, `ranger`, `ranger-raptor`, `everest`, `mustang`, `mustang-mach-e`, `kuga`, `escape`, `puma`, `focus`, `fiesta`, `mondeo`, `galaxy`, `s-max`, `c-max`, `b-max`, `ka`, `ecosport`, `edge`, `explorer`, `expedition`, `excursion`, `bronco`, `bronco-sport`, `maverick`, `f-150`, `f-250`, `f-350`, `fusion`, `taurus`, `crown-victoria`, `cougar`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; **dampened** via `dampen_watermark.py` (cosmetic only, confers no reuse right) |
| 1 NetCarShow (`falcon`) | NetCarShow.com press photo (FG Falcon G6E 2008) | ⚠️ **not** an open licence — copyrighted manufacturer press image; corner "NetCarShow.com" watermark removed with the background by rembg; not dampened |

## Hyundai (34 cutouts)

A MIXED set, like Mazda/Nissan. Mainstream lines are MODEL-NAMED, resolving via
the model tier; the N-performance variants use MODEL-VARIANT naming (hyundai-i30-n,
etc.) and also resolve via the model tier. Hyundai uses few chassis codes compared
to Toyota or Honda, so the set is overwhelmingly model-named with the latest
generation as the representative silhouette. Australia-weighted — i30/Tucson/Kona
dominate local sales.

Each is the representative generation, verified from its Carsized detail-page
year-range and chassis code (shown in the page `<h1>`). AU core first (i30 PDE 2024,
Tucson NX4E 2024, Kona SX2 2023, Santa Fe MX5 2023, i20 BC3 2023, Venue 2019,
Palisade LX3 2024, Staria US4 2021, iLoad H-1 TQ 2007, Ioniq 5 NE 2021, Ioniq 6
CE 2022), then global lines (Elantra CN7 2023, Sonata DN8 2023, i10 AC3 2019,
i40 VF 2011, ix35 LM 2009, Ioniq AE 2019, Ioniq 9 ME1 2025, Nexo FE 2018, Getz
TB 2005, Atos MX 2004, Creta SU2 2019, Bayon BC3 2021, Santa Cruz 2021, Inster
AX1 2024, ix20 JC 2015, Azera HG 2011, Grandeur HG 2011, Tiburon GK 2001). N
variants are pinned separately (i30-n, i20-n, ioniq-6-n) where Carsized distinguishes
them; Veloster is the base-model silhouette only (no N variant catalogued). Genesis
Coupe is the pre-spinoff Hyundai-badged sport coupe.

All 34 came from Carsized, which has deep Hyundai coverage. Cutouts are Carsized.com
orthographic `_4x` side-view renders (watermark-dampened, rembg'd).

Requested but **dropped** — not in Carsized's catalogue, NetCarShow only has angled
press shots (no clean orthographic side): the **Accent** (global B-segment sedan) and
**Terracan** (body-on-frame SUV). Revisit if a clean side source turns up.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 34 (`i30`, `tucson`, `kona`, `santa-fe`, `i20`, `venue`, `palisade`, `staria`, `iload`, `ioniq-5`, `ioniq-6`, `ioniq`, `ioniq-9`, `i30-n`, `i20-n`, `ioniq-6-n`, `veloster`, `genesis-coupe`, `elantra`, `sonata`, `i10`, `i40`, `ix35`, `nexo`, `getz`, `atos`, `creta`, `bayon`, `santa-cruz`, `inster`, `ix20`, `azera`, `grandeur`, `tiburon`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; **dampened** via `dampen_watermark.py` (cosmetic only, confers no reuse right) |

## Kia (59 cutouts)

A MODEL-NAMED set, like Hyundai/Mazda. Kia uses few chassis codes, so all slugs
resolve via the model tier: a user typing "Seltos"/"Sportage"/"Carnival" renders
straight from the slug. Australia-weighted — Seltos, Sportage, Carnival, and
Sorento dominate local sales. Comprehensive across generations: Carsized has
deep Kia coverage with multiple generations per model line, all represented
here (year suffix denotes generation, latest first).

Each generation verified from its Carsized detail-page year-range (shown in the
page `<title>`). AU core first (Carnival 2020/2018/2005, Seltos 2023/2019, Sportage
2024/2021/2018/2015/2010/2004, Sorento 2024/2020/2014/2012/2002, Picanto 2023/2017/2015/2009/2003, Stonic 2017, EV6 2021, EV9 2023, EV3 2024, EV4 2025, EV5 2025), then global mainstream (Ceed 2021/2015/2012/2006, Rio 2017/2011/2005, Niro 2021/2016, Niro EV 2021, Soul 2019/2014/2013/2008, Stinger 2017, Optima 2015/2010, XCeed 2022/2019, Telluride 2023/2026, Carens 2013, Venga 2009, K5 2019, K8 2021, K4 2024, PV5 2025, Magentis 2005/2000). Ceed Proceed estate variants are included (2018/2021). Sportage LWB (2021 long-wheelbase) is registered separately.

All 59 came from Carsized, which has excellent Kia coverage. Cutouts are
Carsized.com orthographic `_4x` side-view renders (watermark-dampened, rembg'd).

**No models dropped** — Carsized catalogues all major Kia nameplates with clean
orthographic side renders. GT variants (Stinger GT, EV6 GT) are not present in
Carsized's catalogue as separate entries, so they are not included.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 59 (`carnival-2020`, `carnival-2018`, `carnival-2005`, `seltos-2023`, `seltos-2019`, `sportage-2024`, `sportage-2021`, `sportage-2018`, `sportage-2015`, `sportage-2010`, `sportage-2004`, `sportage-2021-suv`, `sorento-2024`, `sorento-2020`, `sorento-2014`, `sorento-2012`, `sorento-2002`, `picanto-2023`, `picanto-2017`, `picanto-2015`, `picanto-2009`, `picanto-2003`, `stonic-2017`, `ev6-2021`, `ev9-2023`, `ev3-2024`, `ev4-2025`, `ev5-2025`, `ceed-2021`, `ceed-2015`, `ceed-2012`, `ceed-2006`, `ceed-2018-estate-proceed`, `ceed-2021-estate-proceed`, `rio-2017`, `rio-2011`, `rio-2005`, `niro-2021`, `niro-2016`, `niro-2021-suv`, `soul-2019`, `soul-2014-5-door-hatchback`, `soul-2013`, `soul-2008`, `stinger-2017`, `optima-2015`, `optima-2010`, `xceed-2022`, `xceed-2019`, `telluride-2023`, `telluride-2026`, `carens-2013`, `venga-2009`, `k5-2019`, `k8-2021`, `k4-2024`, `pv5-2025`, `magentis-2005`, `magentis-2000`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; **dampened** via `dampen_watermark.py` (cosmetic only, confers no reuse right) |

## Mitsubishi (12 cutouts)

A MIXED, Australia-weighted set (same pattern as Ford/Nissan): almost all
nameplates are model-named, with the Lancer Evolution the one chassis-pinned line.
One cutout per nameplate — the representative generation, with its year-range and
chassis code verified from the Carsized detail page (`<title>` year-range, `<h1>`
parens chassis). Two nameplates are region-renamed in Carsized's catalogue: the AU
**Triton** is filed as **L200**, and the AU **Mirage** is filed as **Space Star**
(same vehicles, different market names); the AU nameplate is used as the slug.

Generation verification (from each detail page):

- `mitsubishi-triton` — Carsized "L200" 4-door, 2019-present, chassis **KJ0T** (current MR Triton).
- `mitsubishi-outlander` — Outlander SUV, 2021-present (GN0W, current 4th gen).
- `mitsubishi-asx` — ASX SUV, 2022-present, chassis **RJB** (Clio-based 2nd gen).
- `mitsubishi-eclipse-cross` — Eclipse Cross SUV, 2021-present, chassis **GK0** (facelift).
- `mitsubishi-pajero-sport` — Pajero Sport SUV, 2015-present, chassis **QE** (Montero/Shogun Sport elsewhere).
- `mitsubishi-pajero` — Pajero 5-door SUV, 2006-2014, chassis **V80** (4th gen; Montero/Shogun elsewhere).
- `mitsubishi-mirage` — Carsized "Space Star", 2020-present, chassis **A00** (facelift).
- `mitsubishi-lancer` — Lancer sedan, 2007-2017, chassis **CY0**.
- `mitsubishi-lancer-evolution` — Lancer Evolution sedan, 2007-2016, chassis **CZ4A** = **Evo X**. The only Evo generation Carsized catalogues (the Evo VII–IX JDM gap mirrors the Nissan/Toyota findings).
- `mitsubishi-colt` — Colt 5-door, 2008-2013, chassis **Z30** (genuine Mitsubishi gen; the Renault-based 2023 Colt was not used).
- `mitsubishi-grandis` — Grandis minivan, 2003-2011, chassis **NA0W**.
- `mitsubishi-i-miev` — i-MiEV hatch, 2009-2017, chassis **HA0**.

**Dropped — not in Carsized's catalogue** (no clean orthographic side render, and
NetCarShow had no clean side either): 3000GT/GTO, Magna/Verada (AU-built, absent
like the Ford Falcon), Galant, the Eclipse coupe, Delica, Carisma, and a separate
Outlander PHEV (covered by `mitsubishi-outlander`).

All 12 are Carsized renders. Unlike the earlier Carsized sets (which re-matted the
lossy `_4x.webp` through rembg), these were cut from the **lossless `_4x.png`**
variant, which carries Carsized's own clean anti-aliased alpha matte. rembg is
skipped entirely — the native alpha is reattached unchanged, so edges stay smooth
instead of aliasing the thin roof-rails into a staircase. Processing is crop-to-bbox
+ Lab-space watermark dampening on the RGB only (`process_png_cutout.py`).

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 12 (`triton`, `outlander`, `asx`, `eclipse-cross`, `pajero-sport`, `pajero`, `mirage`, `lancer`, `lancer-evolution`, `colt`, `grandis`, `i-miev`) | Carsized.com orthographic `_4x.png` side-view renders, native alpha (`triton` = Carsized "L200", `mirage` = Carsized "Space Star") | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; **dampened** via Lab coring (cosmetic only, confers no reuse right) |

## Tesla (5 cutouts)

A small, all-MODEL-NAMED set covering **every** Tesla nameplate Carsized
catalogues. Tesla doesn't use chassis codes, so all resolve via the model tier.
One cutout per nameplate — the current generation, with its year-range verified
from the Carsized detail page (`<title>`; Tesla `<h1>` carries only the body
style, no chassis code).

Generation verification (from each detail page):

- `tesla-model-s` — Model S liftback, **2021-present** (the refreshed "Plaid"-era car; Carsized also lists the 2012-2016 and 2016-2021 generations — the current one was chosen).
- `tesla-model-3` — Model 3 sedan, **2023-present** (the "Highland" facelift; the 2017-2023 original is also catalogued).
- `tesla-model-x` — Model X SUV, **2015-2021** (the only generation Carsized lists; falcon-wing doors).
- `tesla-model-y` — Model Y SUV, **2025-present** (the "Juniper" facelift; the 2021-2024 original is also catalogued).
- `tesla-cybertruck` — Cybertruck 4-door pickup, **2023-present** (stainless body).

**Dropped — not in Carsized's catalogue:** the Roadster (original 2008 and the
2020 next-gen) and the Semi. Revisit if a clean orthographic side render turns up.

All 5 are Carsized renders cut from the **lossless `_4x.png`** variant (native
anti-aliased alpha; rembg skipped, alpha reattached unchanged), with Lab-space
watermark dampening on the RGB only (`process_png_cutout.py`). Note: on the dark
bodywork (e.g. the black Model 3) a very faint watermark residual can remain after
dampening — invisible at the rendered toy-car size, consistent with the documented
dark-body caveat.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 5 (`model-s`, `model-3`, `model-x`, `model-y`, `cybertruck`) | Carsized.com orthographic `_4x.png` side-view renders, native alpha | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; **dampened** via Lab coring (cosmetic only, confers no reuse right) |

## Subaru (13 cutouts)

A MIXED, Australia-weighted set (like Ford/Nissan) covering every distinct Subaru
nameplate Carsized catalogues with a clean orthographic side render — **one cutout
per nameplate** (representative/current generation), all MODEL-NAMED. The
enthusiast lines each have only a single generation in Carsized (no separate WRX
STI; BRZ gen-1 only), so none warrant chassis-pinning. Each generation's
year-range was verified from the Carsized detail-page `<title>` and the chassis
code from the `<h1>` parens.

**AU nameplate aliases** (region renames — the AU badge is used as the slug, the
Carsized path uses the overseas name):

- `subaru-xv` — Carsized files the current generation as **Crosstrek**; AU badged
  it "XV" through 2022 and "Crosstrek" from the 2023 (GU) gen. Slug kept as `xv`.
- `subaru-liberty` — Carsized files it as **Legacy**; sold as "Liberty" in
  Australia. Slug kept as `liberty`.

Generation verification (from each detail page):

- `subaru-outback` — Outback (BU) SUV, **2025-present**.
- `subaru-forester` — Forester (SL) SUV, **2024-present**.
- `subaru-xv` — Crosstrek/XV (GU) SUV, **2023-present** (shares the GU platform with the Impreza).
- `subaru-impreza` — Impreza (GU) 5-door hatchback, **2023-present**.
- `subaru-wrx` — WRX (VB) sedan, **2021-present** (current gen; no separate STI in Carsized).
- `subaru-liberty` — Legacy/Liberty (BW) sedan, **2023-present**.
- `subaru-brz` — BRZ (ZC) coupé, **2012-2016** (gen-1; the Toyota 86 twin — see `toyota-86`. Carsized has no 2021 ZD gen-2).
- `subaru-svx` — SVX Alcyone (CX) coupé, **1991-1996** (heritage GT — present in Carsized despite being a JDM-era icon).
- `subaru-levorg` — Levorg (V1) estate, **2014-2019** (sports wagon).
- `subaru-ascent` — Ascent (WM) SUV, **2022-present** (NA-market 3-row; the 2018-2021 gen is also catalogued — current chosen).
- `subaru-baja` — Baja 4-door pick-up, **2002-2006** (NA-market car-based ute; no chassis code).
- `subaru-justy` — Justy (MHY) 5-door hatchback, **2003-2007** (rebadged supermini).
- `subaru-solterra` — Solterra SUV, **2022-present** (EV; the Toyota bZ4X twin — see `toyota-bz4x`; no chassis code).

**Dropped — not in Carsized's catalogue** (no clean orthographic side render): WRX
STI (no generation separate from the WRX), Tribeca, Vivio, Pleo, Exiga, Trezia,
Sambar, and the JDM older Impreza WRX/STI gens (GC/GD/GR). Carsized *does* list
older Outback/Forester/Impreza/Legacy/Ascent/XV generations too — one current file
per nameplate was kept rather than splitting per gen. Revisit if a per-gen split is
wanted.

All 13 are Carsized renders cut from the **lossless `_4x.png`** variant (native
anti-aliased alpha; rembg skipped, alpha reattached unchanged), with Lab-space
watermark dampening on the RGB only (`process_png_cutout.py`). Spot-checked clean
on saturated/dark bodywork (red Levorg, black SVX) — no residual watermark band.

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 13 (`outback`, `forester`, `xv`, `impreza`, `wrx`, `liberty`, `brz`, `svx`, `levorg`, `ascent`, `baja`, `justy`, `solterra`) | Carsized.com orthographic `_4x.png` side-view renders, native alpha (`xv` = Carsized "Crosstrek", `liberty` = Carsized "Legacy") | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; **dampened** via Lab coring (cosmetic only, confers no reuse right) |

## Honda (24 cutouts)

A MIXED, Australia-weighted set (like Ford/Nissan) covering every distinct Honda
nameplate Carsized catalogues with a clean orthographic side render — **one cutout
per nameplate** (representative/current generation), all MODEL-NAMED. The
enthusiast lines Carsized carries each have only a single generation (NSX = the
2016 NC; S2000 = the AP1; no separate Civic Type R URL), so none warrant
chassis-pinning. Each generation's year-range was verified from the Carsized
detail-page `<title>` and the chassis code from the `<h1>` parens.

**Nameplate aliases / cross-market notes** (the AU/Honda badge is used as the slug):

- `honda-jazz` — Carsized files it as **Jazz/Fit**; sold as "Fit" in North America
  and Japan. Slug kept as `jazz` (the AU/EU badge).
- `honda-nsx` — the 2016 **NC** is badged **Acura NSX** in North America and Japan;
  AU/EU sold it as the Honda NSX, so the slug stays `honda-nsx`. (Honda's other
  Acura-badged lines — Integra, Legend/RL — are absent from Carsized, see dropped.)
- `honda-odyssey` — this is the **NA-market** Odyssey (RL6 minivan); the JDM/AU
  Odyssey is a different, lower MPV that Carsized does not catalogue.

Generation verification (from each detail page):

AU-core:
- `honda-cr-v` — CR-V (RS) SUV, **2022-present** (6th gen).
- `honda-civic` — Civic (FE) sedan, **2021-present** (11th gen; no separate Type R in Carsized).
- `honda-hr-v` — HR-V (RV) SUV, **2021-present** (3rd gen).
- `honda-accord` — Accord (CY1) sedan, **2023-present** (11th gen).
- `honda-jazz` — Jazz/Fit (GR) 5-door hatchback, **2020-2023** (4th gen).
- `honda-zr-v` — ZR-V (RZ) SUV, **2022-present**.
- `honda-city` — City sedan, **2014-2019** (no chassis code in the h1).

Heritage / sport:
- `honda-nsx` — NSX (NC) coupé, **2016-present** (2nd-gen hybrid supercar; Acura-badged in NA/JP).
- `honda-s2000` — S2000 (AP1) roadster, **1999-2003** (Carsized has only the AP1; no AP2).
- `honda-prelude` — Prelude (BF1) liftback, **2025-present** (the revived hybrid coupe).
- `honda-cr-z` — CR-Z (ZF1) liftback, **2010-2012** (hybrid sport coupe).
- `honda-cr-x` — CR-X liftback, **1987-1991** (2nd gen; badged "CRX" in some markets; no chassis code in the h1).
- `honda-insight` — Insight (ZE2) liftback, **2009-2012** (2nd-gen hybrid).

Extended / other-region:
- `honda-odyssey` — Odyssey (RL6) minivan, **2017-2021** (NA-market).
- `honda-pilot` — Pilot (YG1) SUV, **2022-present** (NA-market 3-row).
- `honda-passport` — Passport (YF9) SUV, **2025-present** (NA-market 2-row).
- `honda-ridgeline` — Ridgeline pickup, **2016-present** (NA-market unibody ute; no chassis code in the h1).
- `honda-prologue` — Prologue SUV, **2024-present** (NA-market EV on GM's Ultium platform; no chassis code in the h1).
- `honda-crosstour` — Crosstour liftback, **2013-2015** (NA-market crossover; no chassis code in the h1).
- `honda-element` — Element SUV, **2002-2006** (NA-market; no chassis code in the h1).
- `honda-stream` — Stream (RN1) MPV, **2000-2006** (1st gen).
- `honda-clarity` — Clarity sedan, **2017-2021** (PHEV/FCEV; no chassis code in the h1).
- `honda-e` — e (ZC) hatchback, **2020-present** (retro city EV).
- `honda-e-ny1` — e:Ny1 (RSA) SUV, **2023-present** (EU-market EV; slug = slugify("e:Ny1")).

**Dropped — not in Carsized's catalogue** (no clean orthographic side render): the
**Civic Type R** (FK8/FL5 — no URL separate from the standard Civic), **Integra /
Integra Type R**, **Legend** (Acura RL), **Beat**, **S660**, City Turbo, the JDM
kei + older Type R lines, and the **NSX NA1/NA2** first generation (only the 2016
NC is catalogued — the predicted JDM/Acura gaps confirmed). Carsized *does* list
older Accord/Civic/CR-V/Jazz/Prelude generations too — one current file per
nameplate was kept rather than splitting per gen. Revisit if a per-gen split is
wanted.

All 24 are Carsized renders cut from the **lossless `_4x.png`** variant (native
anti-aliased alpha; rembg skipped, alpha reattached unchanged), with Lab-space
watermark dampening on the RGB only (`process_png_cutout.py`). Spot-checked on
saturated/dark bodywork (blue Civic, dark CR-Z) — edges smooth; a faint dark-body
watermark residual remains on the darkest panels (documented, invisible at
toy-car size).

| Files | Source | Licence / status |
|-------|--------|------------------|
| All 24 (`cr-v`, `civic`, `hr-v`, `accord`, `jazz`, `zr-v`, `city`, `nsx`, `s2000`, `prelude`, `cr-z`, `cr-x`, `insight`, `odyssey`, `pilot`, `passport`, `ridgeline`, `prologue`, `crosstour`, `element`, `stream`, `clarity`, `e`, `e-ny1`) | Carsized.com orthographic `_4x.png` side-view renders, native alpha (`jazz` = Carsized "Jazz/Fit", `nsx` = Acura NSX in NA/JP, `e-ny1` = Carsized "eny1") | ⚠️ **not** an open licence — same faint baked-in "carsized.com" watermark as the other Carsized sets; **dampened** via Lab coring (cosmetic only, confers no reuse right) |

## ⚠️ Licensing note

Most of these were hand-sourced rather than pulled from a public-domain / CC
catalogue, so their reuse rights are **unconfirmed**. The `bmw-335i.png` source
specifically carried an enthusiast-forum watermark, i.e. it's someone else's
copyrighted image. That's low-risk for a private single-user garage, but **before
shipping this publicly / commercially, replace any unlicensed cutouts** with
public-domain / CC sources (see the E39 method in the `car-tracker-vehicle-cutouts`
memory) or licensed studio renders. The same applies to the 27 Carsized-sourced
Mercedes cutouts: the faint baked-in "carsized.com" watermark confirms they are
not openly licensed, so they must be replaced before any public / commercial use.
