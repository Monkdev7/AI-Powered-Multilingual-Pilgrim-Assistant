# Third-party fonts: Noto Sans (Indic scripts)

These files are self-hosted so the app does not call a font CDN for Indic text. They are
**unmodified** WOFF2 files, downloaded as served by Google Fonts (the official distribution of the
Noto Sans family). No npm font package is used.

- Licence: SIL Open Font License, Version 1.1 (full text in the `OFL-<script>.txt` files here).
- Copyright: Copyright 2022 The Noto Project Authors (https://github.com/notofonts/<script>), one
  line per script, reproduced at the top of each `OFL-<script>.txt`.
- Licence text source: https://github.com/google/fonts/tree/main/ofl/notosans<script>/OFL.txt
  (raw: `https://raw.githubusercontent.com/google/fonts/main/ofl/notosans<script>/OFL.txt`).
- Upstream design sources: https://github.com/notofonts/<script> (Noto Project).
- Downloaded: 2026-11-26. The files are the `/* <script> */` subset named by the Google Fonts CSS2
  API response for `https://fonts.googleapis.com/css2?family=Noto+Sans+<Script>:wght@400..700&display=swap`
  (requested with a Chrome user agent to receive WOFF2).

The fonts are bundled and redistributed with this app, not sold on their own, and the Reserved
Font Name conditions of the OFL are respected (no renaming or modification was done).

## Files

Each file is one variable-weight font (`wght` axis 400 to 700), Google subset for that script.

| Script (languages) | File | Upstream version | Size (bytes) | SHA-256 |
|---|---|---|---|---|
| Devanagari (hi, mr, mantra strip) | `NotoSansDevanagari-v33.woff2` | v33 | 120056 | `6c354352c14e6c5507f8c0fc8985134407d09f12c1577f5706ca58e62fb4cd2f` |
| Bengali (bn) | `NotoSansBengali-v33.woff2` | v33 | 107720 | `4ccdc6269af7581727fc3eea491831bda1962c1baaca7f2c0dec054bfddde478` |
| Tamil (ta) | `NotoSansTamil-v31.woff2` | v31 | 50468 | `98e5b968b0e64d56a5833e1f8059453784190564ceeeda96613fd87282d3d8a1` |
| Telugu (te) | `NotoSansTelugu-v30.woff2` | v30 | 123972 | `bd266bd1cddc15b5ed21d69a6e68ed8747427af31e1f42d87104de547ff15f3c` |
| Gujarati (gu) | `NotoSansGujarati-v27.woff2` | v27 | 112268 | `ea048a83d79022c67f1e0da348c881b68a35f86411ab9e2e5a7c7a06ceb87e2a` |
| Gurmukhi (pa) | `NotoSansGurmukhi-v29.woff2` | v29 | 20280 | `9754f04dbb048905233dfb864c18b9724c28943e2e80ad48053c335c76302142` |

Source URLs (exact):

- Devanagari: https://fonts.gstatic.com/s/notosansdevanagari/v33/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5TV_9qo.woff2
- Bengali: https://fonts.gstatic.com/s/notosansbengali/v33/Cn-fJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mc4I3mYvNY.woff2
- Tamil: https://fonts.gstatic.com/s/notosanstamil/v31/ieVp2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-048cFpwEFI.woff2
- Telugu: https://fonts.gstatic.com/s/notosanstelugu/v30/0FlCVOGZlE2Rrtr-HmgkMWJNjJ5_RyT8o8c7fHkeg-esVARN5IjvvA.woff2
- Gujarati: https://fonts.gstatic.com/s/notosansgujarati/v27/wlpZgx_HC1ti5ViekvcxnhMlCVo3f5pv17ivlzsUB14gg1TMbXaYEL-C.woff2
- Gurmukhi: https://fonts.gstatic.com/l/font?kit=w8goH3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrYFQ_bogT0-gPeG1OehT6RQuz6j3nNVBfZuSGAYoipnE&skey=cd0e4d193a821bd1&v=v29

Verification: every file starts with the WOFF2 magic bytes `wOF2` (checked by `test/fonts.test.js`).

## Weight choice

The UI uses `font-normal`, `font-medium`, `font-semibold` and `font-bold`. One variable file per
script covers 400 to 700, so no second bold file and no extra request is needed. Static
Regular + Bold pairs would cost two files per script. Only the Latin text stays on Inter
(Google Fonts stylesheet in `index.html`, unchanged).

## Loading

`@font-face` rules are in `src/index.css`, each with `font-display: swap` and the script's
`unicode-range` copied from the upstream CSS, so the browser fetches a file only when a glyph in
that script is rendered. The Devanagari file is also fetched in every language because the header
mantra strip is always Devanagari. No preload is used (it would add a request on every page load).
