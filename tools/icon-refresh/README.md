# Lucide compatibility icons

Source: `lucide-static` **1.71.0**, downloaded from the npm registry.
Upstream: https://github.com/lucide-icons/lucide
License: ISC, with the inherited Feather MIT notice included in
`public/images/lucide/LICENSE`. The selected upstream SVGs are vendored there.
The SVG geometry is from the package, not hand-drawn.

`manifest.json` maps legacy image filenames to semantic upstream icons and
records dimensions and sprite order. Keep sprite cell counts/order and original
file dimensions intact: classic, mobile, sharing, push notifications, remote
controls and device details all use these paths. PNG and WebP counterparts use
the same icon mapping. Brand logos, app-store badges, installation screenshots,
and the loading animation are intentionally retained.

To regenerate the committed raster files, use a development installation of
Playwright and Chromium (neither is a production dependency):

```
node tools/icon-refresh/generate.cjs /path/to/playwright /path/to/chromium
```

The generator reads vendored SVGs, with no network access. It creates the PNG,
WebP and JPEG compatibility files and a real multi-resolution `public/favicon.ico`
containing 16, 32, 48, 64, 128 and 256px PNG payloads. PWA and Apple PNG icons are
also listed in the manifest. These brand icons use the custom transparent M
mark in `public/images/modern/mark.svg`, independently of the Lucide UI icons. Existing uploaded/custom icons remain independent.

`public/images/modern/*.svg` (except the custom brand `mark.svg`) and the inline
navigation SVGs use Lucide artwork. The default avatar copy sets a display stroke color; mask icons retain
`currentColor`. Embedded base64 file icons are replaced in the desktop and mobile
styles/templates with generated local PNGs.

Validation:

```
node tools/icon-refresh/verify.cjs /path/to/playwright /path/to/chromium [preview.png]
```

This decodes every generated image and ICO payload, checks expected dimensions
and integer sprite cell widths, and rejects transparent/empty sprite cells.
