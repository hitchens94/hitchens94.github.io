# trips/

Photos for the travel log live here, one folder per `photo_folder` value from the sheet.

## Convention

Each row in the travel sheet has two photo-related columns:

- `photo_folder` — subfolder name under `trips/`. If empty, defaults to `slug(trip_id || place + '-' + year)`.
- `photos` — semicolon-separated filenames within that folder (e.g. `01.jpg;02.jpg;03.jpg`).

So a row with `photo_folder = "yellowstone-2023"` and `photos = "01.jpg;02.jpg"` will load:

```
trips/yellowstone-2023/01.jpg
trips/yellowstone-2023/02.jpg
```

For a multi-stop trip, share one folder across stops and prefix filenames by stop:

```
trips/europe-spring-2024/paris-01.jpg
trips/europe-spring-2024/lyon-01.jpg
trips/europe-spring-2024/como-01.jpg
```

## Sizing

Resize before committing to keep the repo lean:

- Max 1600px on the long edge
- JPEG quality ~80
- Target ~150–300 KB per photo

A quick one-liner with ImageMagick:

```sh
mogrify -resize '1600x1600>' -quality 80 *.jpg
```

500 photos at that size ≈ 100 MB — still fine for GitHub Pages. If the folder grows past that, migrate to a CDN (Cloudinary, R2) and store full URLs in `photos` instead of bare filenames; the renderer treats any string starting with `http` as a full URL.

## Missing photos

If a filename listed in `photos` doesn't exist on disk, the thumbnail tile silently hides — the card still renders fine without it. So you can add filenames in the sheet first and drop the actual files in later.
