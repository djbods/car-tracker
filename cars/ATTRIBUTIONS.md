# Cutout image attributions / provenance

Each cutout is a background-removed, alpha-feathered derivative of a source
image. Record the source + licence here so the provenance is auditable —
especially important before any public / commercial launch.

| File | Source | Licence / status |
|------|--------|------------------|
| `bmw-530i.png` | Jack-supplied | ⚠️ source/licence to confirm |
| `bmw-528i.png` | Jack-supplied | ⚠️ source/licence to confirm |
| `bmw-530i-green.png` | Jack-supplied | ⚠️ source/licence to confirm |
| `bmw-335i.png` | BMW E92 side profile from a BIMMERPOST forum post (carried a "BIMMERPOST BMW ENTHUSIAST CLUB" watermark) | ⚠️ **not** an open licence — likely copyrighted |

## Mercedes-Benz (29 chassis cutouts)

Full C / E / S / SL lineage plus the AMG GT (C190) and G-Class (W463).

| Files | Source | Licence / status |
|-------|--------|------------------|
| `mercedes-w198.png` (300SL Gullwing) | Petrolicious (cdn.shopify.com) press/editorial image | ⚠️ source/licence to confirm — **watermark-free** |
| `mercedes-w113.png` (280SL Pagoda) | bhauction.com auction listing photo | ⚠️ source/licence to confirm — **watermark-free** |
| The other 27 (`r107`, `r129`, `r230`, `r231`, `r232`, `w116`, `w123`, `w124`, `w126`, `w140`, `w201`, `w202`, `w203`, `w204`, `w205`, `w206`, `w210`, `w211`, `w212`, `w213`, `w214`, `w220`, `w221`, `w222`, `w223`, `c190`, `w463`) | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — carries a faint tiled "carsized.com" watermark lightly baked into the bodywork (background watermark removed by rembg) |

## Bugatti (8 model cutouts)

Bugatti uses model names rather than chassis codes, so these slugs are
model-named and resolve via the model tier. Carsized only catalogues two
Bugattis (Chiron, EB110); the remaining six were sourced from NetCarShow.com
"Side_Profile" studio press photos (background removed by rembg). Type 35 (1924)
and Type 57 (1936) were requested but **dropped** — no clean orthographic
side-view render of either could be sourced.

| Files | Source | Licence / status |
|-------|--------|------------------|
| `bugatti-chiron.png`, `bugatti-eb110.png` | Carsized.com orthographic `_4x` side-view renders | ⚠️ **not** an open licence — faint tiled "carsized.com" watermark baked into bodywork (background watermark removed by rembg) |
| `bugatti-veyron.png`, `bugatti-divo.png`, `bugatti-centodieci.png`, `bugatti-mistral.png`, `bugatti-bolide.png`, `bugatti-tourbillon.png` | NetCarShow.com "Side_Profile" studio press photos (manufacturer press imagery) | ⚠️ source/licence to confirm — copyrighted press photos, background removed by rembg; **not** an open licence |

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
