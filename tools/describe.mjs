import { readFileSync, writeFileSync } from 'node:fs';
import def from '../src/index.js';
const file = { ...def.describe, prompts: [{ key: 'worlds.music-abc.env', title: '提示词', role: 'envPrompt', content: readFileSync(new URL('../src/ENV_PROMPT.md', import.meta.url), 'utf8') }] };
writeFileSync(new URL('../describe.json', import.meta.url), JSON.stringify(file, null, 2) + '\n');
