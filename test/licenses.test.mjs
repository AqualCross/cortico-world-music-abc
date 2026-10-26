import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n').trim();

test('browser artifact retains the full licenses of abcjs and its embedded formatter', () => {
  const bundle = read('../dist/webui.js');
  const abcLicense = read('../node_modules/abcjs/LICENSE.md');
  const formatter = read('../node_modules/abcjs/src/write/draw/sprintf.js').match(/^\/\*\*([\s\S]*?)\*\//)[1].trim();
  assert.equal(read('../licenses/abcjs-MIT.txt'), abcLicense);
  assert.equal(read('../licenses/sprintf-BSD-3-Clause.txt'), formatter);
  assert.ok(bundle.includes(abcLicense));
  assert.ok(bundle.includes(formatter));
});

test('distributed Apache license matches both installed synthesis dependencies', () => {
  const license = read('../licenses/Apache-2.0.txt');
  assert.equal(license, read('../node_modules/spessasynth_core/LICENSE'));
  assert.equal(license, read('../node_modules/stb-vorbis/LICENSE'));
});
