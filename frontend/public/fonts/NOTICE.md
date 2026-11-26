# Third-party fonts: Noto Sans (Indic scripts)

These files are self-hosted so the app does not call a font CDN for Indic text. Six are
**unmodified** WOFF2 files, downloaded as served by Google Fonts (the official distribution of the
Noto Sans family). One is a **modified** mantra-only subset (see "Mantra subset" below). No npm
font package is used.

- Licence: SIL Open Font License, Version 1.1 (full text in the `OFL-<script>.txt` files here; the
  mantra subset is covered by `OFL-devanagari.txt`).
- Copyright: Copyright 2022 The Noto Project Authors (https://github.com/notofonts/<script>), one
  line per script, reproduced at the top of each `OFL-<script>.txt`.
- Licence text source: https://github.com/google/fonts/tree/main/ofl/notosans<script>/OFL.txt
  (raw: `https://raw.githubusercontent.com/google/fonts/main/ofl/notosans<script>/OFL.txt`).
- Upstream design sources: https://github.com/notofonts/<script> (Noto Project).
- Original download date of the six WOFF2 files: **date not recorded**. An earlier version of this
  file said "2026-11-26", but nothing in the repository supports that date, so it is withdrawn.
  The files were re-verified on 2026-11-26 (this machine's clock) as described under "Verification".

The fonts are bundled and redistributed with this app, not sold on their own. The Noto OFL texts
declare no Reserved Font Name.

## Files

Each WOFF2 file is a variable-weight font for one script (Google Fonts subset for that script).
Version and weight range are read from the font's own `name` (ID 5) and `fvar` tables.

| Script (languages) | File | gstatic path version | `name` ID 5 | `wght` axis | Size (bytes) | SHA-256 |
|---|---|---|---|---|---|---|
| Devanagari (hi, mr) | `NotoSansDevanagari-v33.woff2` | v33 | Version 2.007 | 100-900 | 120056 | `6c354352c14e6c5507f8c0fc8985134407d09f12c1577f5706ca58e62fb4cd2f` |
| Bengali (bn) | `NotoSansBengali-v33.woff2` | v33 | Version 3.011 | 100-900 | 107720 | `4ccdc6269af7581727fc3eea491831bda1962c1baaca7f2c0dec054bfddde478` |
| Tamil (ta) | `NotoSansTamil-v31.woff2` | v31 | Version 2.004 | 100-900 | 50468 | `98e5b968b0e64d56a5833e1f8059453784190564ceeeda96613fd87282d3d8a1` |
| Telugu (te) | `NotoSansTelugu-v30.woff2` | v30 | Version 2.005 | 100-900 | 123972 | `bd266bd1cddc15b5ed21d69a6e68ed8747427af31e1f42d87104de547ff15f3c` |
| Gujarati (gu) | `NotoSansGujarati-v27.woff2` | v27 | Version 2.106 | 100-900 | 112268 | `ea048a83d79022c67f1e0da348c881b68a35f86411ab9e2e5a7c7a06ceb87e2a` |
| Gurmukhi (pa) | `NotoSansGurmukhi-v29.woff2` | v29 | Version 2.004 | 400-700 | 20280 | `9754f04dbb048905233dfb864c18b9724c28943e2e80ad48053c335c76302142` |
| Devanagari mantra subset (header strip, all languages) | `NotoSansDevanagari-Mantra-v2.007.woff` | n/a (derived) | Version 2.007 | 400-700 | 6188 | `4e38503446c39cea70856c3dab5b0f222e30f4e6555858cb08c80b52a71a3d06` |

Correction: an earlier version of this file said every file has a `wght` axis of 400-700. That is
true only for Gurmukhi. The other five span 100-900. The CSS only asks for 400-700, so rendering is
unchanged.

Source URLs (exact):
- Devanagari: https://fonts.gstatic.com/s/notosansdevanagari/v33/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5TV_9qo.woff2
- Bengali: https://fonts.gstatic.com/s/notosansbengali/v33/Cn-fJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mc4I3mYvNY.woff2
- Tamil: https://fonts.gstatic.com/s/notosanstamil/v31/ieVp2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-048cFpwEFI.woff2
- Telugu: https://fonts.gstatic.com/s/notosanstelugu/v30/0FlCVOGZlE2Rrtr-HmgkMWJNjJ5_RyT8o8c7fHkeg-esVARN5IjvvA.woff2
- Gujarati: https://fonts.gstatic.com/s/notosansgujarati/v27/wlpZgx_HC1ti5ViekvcxnhMlCVo3f5pv17ivlzsUB14gg1TMbXaYEL-C.woff2
- Gurmukhi: https://fonts.gstatic.com/l/font?kit=w8goH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrYFQ_bogT0-gPeG1OehT6RQuz6j3nNVBfZuSGAYoipnE&skey=cd0e4d193a821bd1&v=v29

Every file starts with its WOFF2 (`wOF2`) or WOFF (`wOFF`) magic bytes (checked by `test/fonts.test.js`),
and the test also checks that each file's size and SHA-256 appear in this file.

## Verification (2026-11-26)

Each URL above was downloaded again and its SHA-256 compared with the committed file. All six match
byte for byte, so the URLs still serve exactly the committed files.

Comparison with the Google Fonts CSS API
(`https://fonts.googleapis.com/css2?family=Noto+Sans+<Script>:wght@400..700&display=swap`, fetched with
a Chrome 124 user agent, script-named subset only):

- Bengali, Tamil, Telugu, Gujarati: the API returns the same gstatic URL and the same bytes as committed.
- Devanagari: today the API returns a different file, an opaque `https://fonts.gstatic.com/l/font?kit=...&v=v33`
  URL (91300 bytes, `wght` 400-700, SHA-256 `86b2d0c38d846bdc59fe056b4e41f70f019217622d432deeea4686f8e3d4a74c`).
  Same family version in its `name` table (2.007). The committed `/s/.../v33/` URL still serves the committed bytes.
- Gurmukhi: today the API (also with `wght@400;500;600;700` and `wght@100..900`) returns
  `https://fonts.gstatic.com/s/notosansgurmukhi/v29/w8gyH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrSnsXn2CP.woff2`
  (33824 bytes, `wght` 100-900, SHA-256 `fc4c2bf6b7387ce4b0a6b7d38c459fb50c31680a3148c186123af49cf73b2bfa`).
  Requesting the family with no weight returns yet another static file (11400 bytes). **The committed
  Gurmukhi file (20280 bytes, `wght` 400-700) is not what the CSS API returns today.** The opaque
  `l/font?kit=` URL listed above is the only source known to serve it; the exact CSS request that
  produced that URL was not recorded and cannot be recovered. The file is a genuine Google Fonts
  build of Noto Sans Gurmukhi (`name` ID 3 `2.004;GOOG;NotoSansGurmukhi-Regular`), and its version
  matches the upstream source below. No claim is made about when or how the URL was obtained.
- Upstream source cross-check (google/fonts, `ofl/notosansgurmukhi/NotoSansGurmukhi[wdth,wght].ttf`,
  https://raw.githubusercontent.com/google/fonts/main/ofl/notosansgurmukhi/NotoSansGurmukhi%5Bwdth%2Cwght%5D.ttf,
  268608 bytes, SHA-256 `1e6f728fa620e566f842d81e220265813faa12771214765d289c98e035adc5f2`): `name` ID 5 is
  `Version 2.004`, equal to the committed WOFF2. The latest commit touching that directory at check time was
  `8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5` (2026-03-12). A WOFF2 cannot be compared byte for byte with a TTF,
  so this confirms the version only.
- The Devanagari upstream TTF (same repository, `ofl/notosansdevanagari/NotoSansDevanagari[wdth,wght].ttf`)
  has `name` ID 5 `Version 2.007`, equal to the committed WOFF2 and to the mantra subset below.

## Weight choice

The UI uses `font-normal`, `font-medium`, `font-semibold` and `font-bold`. One variable file per
script covers 400 to 700, so no second bold file and no extra request is needed. Static
Regular + Bold pairs would cost two files per script. Only the Latin text stays on Inter
(Google Fonts stylesheet in `index.html`, unchanged).

## Mantra subset (`NotoSansDevanagari-Mantra-v2.007.woff`)

The header strip always shows a fixed Devanagari mantra, whatever the UI language. Before this file
existed, the 120 KB Devanagari font was fetched in every language. Now the strip uses a small subset
and the full Devanagari file loads only when Hindi or Marathi text is rendered.

This file is a **modified version** of Noto Sans Devanagari (OFL 1.1, same copyright, `OFL-devanagari.txt`).
It was generated on 2026-11-26 with the `pyftsubset` tool from fontTools 4.60.1 (already installed on
the build machine; nothing was installed). The committed v33 WOFF2 could not be used as input because
the machine's Python has no `brotli` module to decode WOFF2, so the subset starts from the upstream TTF:

1. Source: https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf
   (641944 bytes, SHA-256 `14ec4af41f27482216d1c2229f417ff9b1425e1babb014e57d1d40d03229853e`, `name` ID 5 `Version 2.007`).
2. `python -m fontTools varLib.instancer NotoSansDevanagari[wdth,wght].ttf wdth=100 wght=400:700 -o inst.ttf`
   (pins the width axis at 100, keeps weights 400-700, the same range the app uses; output 314072 bytes).
3. `pyftsubset inst.ttf --unicodes="U+0903,U+0915,U+091C,U+0926,U+0928,U+092E,U+092F,U+0930,U+0932,U+0935,U+0936,U+0939,U+093E,U+093F,U+0947,U+0950" --layout-features='*' --layout-scripts='*' --name-IDs='*' --notdef-outline --flavor=woff --output-file=NotoSansDevanagari-Mantra-v2.007.woff`

The 16 code points are every Devanagari character in the header mantra "ॐ नमः शिवाय · जय महाकाल · हर हर महादेव".
All layout tables (GSUB, GPOS, GDEF) and glyph variations (gvar) are kept, so matras and the
visarga position as in the full font. WOFF (zlib) is used instead of WOFF2 because WOFF2 output also needs the
missing `brotli` module. The `@font-face` `unicode-range` lists exactly those 16 code points; the
`.font-mantra` class (Header) puts this face first and the full Devanagari face second as a fallback.
`test/fonts.test.js` checks the range against the header text, the subset's `cmap` and layout tables, and that this
entry lists the tool and command.

## Loading

`@font-face` rules are in `src/index.css`, each with `font-display: swap` and the script's
`unicode-range` copied from the upstream CSS, so the browser fetches a file only when a glyph in
that script is rendered. The full Devanagari file is therefore fetched only for Hindi and Marathi text.
No preload is used (it would add a request on every page load).
