import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import './describe.mjs';
const notices = ['abcjs-MIT.txt', 'sprintf-BSD-3-Clause.txt'].map(file => readFileSync(new URL(`../licenses/${file}`, import.meta.url), 'utf8').trim()).join('\n\n');
await build({ entryPoints: ['web/panels.js'], outfile: 'dist/webui.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'eof', banner: { js: `/*!\n${notices}\n*/` } });
console.log('WebUI bundle built.');
