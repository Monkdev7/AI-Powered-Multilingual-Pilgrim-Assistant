// Tiny inline Vite plugin (no dependency): emits sw.js at the site root from pwa/sw.template.js with a
// versioned cache name and the exact list of built, same-origin files to precache.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MARKER = '/*__SW_CONFIG__*/';
// Public files that are precached (everything else under /fonts is cached at runtime, once used).
const PRECACHED_FONTS = ['/fonts/NotoSansDevanagari-Mantra-v2.007.woff'];

export function renderServiceWorker(template, config) {
    if (!template.includes(MARKER)) throw new Error('sw.template.js has no config marker');
    return template.replace(/var SW_CONFIG = \/\*__SW_CONFIG__\*\/ \{[^\n]*\};/, `var SW_CONFIG = ${JSON.stringify(config)};`);
}

// Same-origin /assets/ files referenced by the built index.html (entry script, modulepreloads, stylesheet).
export function assetsFromHtml(html) {
    const found = new Set();
    for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) found.add(m[1]);
    return [...found].sort();
}

export function buildPrecacheList({ html, publicDir }) {
    const list = ['/', ...assetsFromHtml(html)];
    if (existsSync(join(publicDir, 'manifest.json'))) list.push('/manifest.json');
    const iconsDir = join(publicDir, 'icons');
    if (existsSync(iconsDir)) {
        for (const name of readdirSync(iconsDir).sort()) list.push(`/icons/${name}`);
    }
    for (const font of PRECACHED_FONTS) if (existsSync(join(publicDir, font))) list.push(font);
    return list;
}

export function computeVersion({ html, publicDir, precache }) {
    const hash = createHash('sha256');
    hash.update(html);
    for (const url of precache) {
        hash.update(url);
        const file = join(publicDir, url);
        if (!url.startsWith('/assets/') && url !== '/' && existsSync(file)) hash.update(readFileSync(file));
    }
    return hash.digest('hex').slice(0, 12);
}

export default function swPlugin() {
    let resolved;
    return {
        name: 'simhastha-sw',
        apply: 'build',
        enforce: 'post', // after vite:build-html, so the built index.html is in the bundle
        configResolved(config) {
            resolved = config;
        },
        generateBundle(_options, bundle) {
            const htmlAsset = bundle['index.html'];
            if (!htmlAsset) throw new Error('simhastha-sw: index.html not found in bundle');
            const html = String(htmlAsset.source);
            const publicDir = resolved.publicDir;
            const precache = buildPrecacheList({ html, publicDir });
            for (const url of precache) {
                if (url.startsWith('/assets/') && !bundle[url.slice(1)]) throw new Error(`simhastha-sw: ${url} missing from bundle`);
            }
            const apiBase = String(resolved.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
            const version = computeVersion({ html, publicDir, precache });
            const template = readFileSync(join(HERE, 'sw.template.js'), 'utf8');
            this.emitFile({
                type: 'asset',
                fileName: 'sw.js',
                source: renderServiceWorker(template, { version, precache, apiBase }),
            });
        },
    };
}
