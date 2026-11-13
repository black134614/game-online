from pathlib import Path
p=Path('design_export/linh-van-showcase-20261113/dist/current-skills/viewer.js').read_text('utf-8')
body=p.split('function drawCombat(clip,tier){',1)[1].split('\nfunction norm(',1)[0]
body=body.rsplit('\n}',1)[0]
body=body.replace("Number($('mob').value)",'Number(mobId)').replace("$('cluster').checked",'cluster')
body=body.replace("$('caption').textContent=",'return ')
start=body.index('    if(attack&&selected.trainingAtlas')
end=body.index('    if(attack&&hitAge',start)
body=body[:start]+body[end:]
body=body.replace('Bộ skill đang cài','Kỹ năng đang cài')
header='''import { assetUrl } from './assets.js';

// Draw only reviewed installed assets. No added training_v1 wave/claw atlas.
export function createCombatRenderer(canvas, data, replay) {
  const ctx = canvas.getContext('2d');
  const images = new Map();
  let selected, progress, mobId, cluster, lastState, disposed = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  function load(path) {
    if (!images.has(path)) {
      const image = new Image();
      images.set(path, image);
      image.onload = () => { if (!disposed && lastState) draw(lastState); };
      image.src = assetUrl(path);
    }
    return images.get(path);
  }
  function imageAt(path, x, y, width, height) {
    const image = load(path);
    if (image.complete && image.naturalWidth) ctx.drawImage(image, x, y, width, height);
  }
  function sprite(key, x, y, bottom = false, scale = 2) {
    const spec = data.sprites[key];
    if (!spec) return;
    const image = load(spec.image);
    if (image.complete && image.naturalWidth) ctx.drawImage(image, x-spec.w*scale/2, y-spec.h*scale*(bottom?1:.5), spec.w*scale, spec.h*scale);
  }
  function drawCombat(clip, tier) {
'''
footer='''
  }
  function draw(state) {
    lastState = state;
    ({ skill: selected, progress, mobId, cluster } = state);
    ctx.clearRect(0, 0, 920, 420);
    ctx.fillStyle = '#e4ebde'; ctx.fillRect(0, 0, 920, 420);
    return drawCombat(selected.tiers[state.tier], state.tier);
  }
  return { draw, destroy() { disposed = true; for (const image of images.values()) image.onload = null; images.clear(); } };
}
'''
Path('game-home/src/combatRenderer.js').write_text(header+body+footer,'utf-8')