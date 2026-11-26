import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

// SHA-256 of each file with CRLF normalized to LF, computed from commit 5270775.
const PINNED = {
    'faqs.js': 'd06e7dc7da45754365b47753fdd614a40c337b25bbb572ba56e9dddb36d8f431',
    'emergencyContacts.js': 'a7c2df10b381dc231daaab518b69e908424f392b64b90576312e30043725f2b7',
    'navigationData.js': 'efb08e4479215ef4c0c77dd209ee66022e81dffb4d42656df409d42073cb5b23',
};

test('protected data files are unchanged', () => {
    for (const [file, hash] of Object.entries(PINNED)) {
        const text = readFileSync(join(DATA, file), 'utf8').replace(/\r\n/g, '\n');
        assert.equal(createHash('sha256').update(text).digest('hex'), hash, file);
    }
});