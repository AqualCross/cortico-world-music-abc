import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import def from '../src/index.js';

const packageDir = fileURLToPath(new URL('..', import.meta.url));
const framework = process.env.CORTICO_SOURCE_ROOT;
if (!framework || !existsSync(join(framework, 'extensions', 'dry-mount.ts'))) {
  throw new Error('请将 CORTICO_SOURCE_ROOT 指向 Cortico 的 src 目录，再运行 npm run drymount。');
}
const scratchDir = mkdtempSync(join(tmpdir(), 'abc-music-drymount-'));
try {
  const { dryMountWorld } = await import(pathToFileURL(join(framework, 'extensions', 'dry-mount.ts')).href);
  const { parseExtensionManifest, EXTENSION_API_VERSIONS } = await import(pathToFileURL(join(framework, 'extensions', 'manifest.ts')).href);
  const parsed = parseExtensionManifest(JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')));
  if (!parsed.ok) throw new Error(parsed.reasons.join('\n'));
  if (parsed.manifest.api !== EXTENSION_API_VERSIONS.world) throw new Error('World API 版本不匹配。');
  const report = await dryMountWorld(def, { packageDir, scratchDir, hasWebUiClient: true, takenToolNames: new Map([['music_play', 'music'], ['music_import', 'music'], ['music_control', 'music']]) });
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
} finally { rmSync(scratchDir, { recursive: true, force: true }); }
