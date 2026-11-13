// Exercise the Canvas renderer without browser automation. This checks drawing
// paths and referenced files, not visual layout or actual browser interactions.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const points = JSON.parse(fs.readFileSync(path.join(publicRoot, 'assets/aura/weapon-points.json'), 'utf8'));
const files = new Set();
let calls = 0;
const context = new Proxy({}, {
  get: (_, method) => (...args) => {
    if (args.some(value => typeof value === 'number' && !Number.isFinite(value))) throw new Error(`Non-finite value in ${String(method)}`);
    calls++;
  },
  set: () => true,
});
const canvas = { width: 840, height: 720, getContext: () => context };
class TestImage {
  complete = true;
  naturalWidth = 320;
  set src(value) {
    const file = path.join(publicRoot, value);
    if (!fs.existsSync(file)) throw new Error(`Missing image ${file}`);
    files.add(value);
  }
}
const source = fs.readFileSync(path.join(root, 'src/auraRenderer.js'), 'utf8')
  .replace(/^import .*?;\s*/s, '')
  .replace('export function createAuraRenderer', 'function createAuraRenderer');
const sandbox = { Image: TestImage, document: { createElement: () => ({ ...canvas }) }, assetUrl: value => value };
vm.createContext(sandbox);
vm.runInContext(source + '\nthis.factory = createAuraRenderer;', sandbox);
const renderer = sandbox.factory(points);
let combinations = 0;
for (let gender = 0; gender < 2; gender++) for (let school = 0; school < 6; school++) for (const pose of ['idle', 'run', 'jump', 'attack']) {
  for (const color of ['jade', 'ice', 'fire', 'thunder']) for (const gem of [0, 6, 8, 10]) {
    for (const time of [0, .12, .3, .55, .78, 1]) {
      renderer.render(canvas, time, { gender, school, pose, color, gem, upgrade: 16, refine: 9, strength: .7, original: false, flip: true, burstVersion: 0 });
      combinations++;
    }
  }
}
renderer.render(canvas, 1, { gender: 1, school: 0, pose: 'idle', color: 'jade', gem: 0, upgrade: 0, refine: 0, strength: .2, original: true, flip: false, burstVersion: 1 });
renderer.destroy();
console.log(`PASS: ${combinations} renderer samples, ${files.size} images checked, ${calls} Canvas calls with finite coordinates.`);
