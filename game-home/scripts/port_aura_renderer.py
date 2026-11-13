from pathlib import Path
text=Path('design_export/gear-aura-demo-20261113/demo.js').read_text('utf-8')
body=text.split('function image(',1)[1].split('\nfunction labels()',1)[0]
body='function image('+body
body=body.replace('im.src=path;','im.onload=()=>{if(lastFrame&&!disposed)render(...lastFrame)};im.src=assetUrl("assets/aura/"+path);')
body=body.replace('window.WEAPON_POINTS[key]','points[key]').replace('window.demoReady=im.complete&&!!im.naturalWidth','return im.complete&&!!im.naturalWidth')
palettes=text.split('const palettes=',1)[1].split(';',1)[0]
header='''import { assetUrl } from './assets.js';

// Canvas art proposal, separate from installed skill and combat effects.
export function createAuraRenderer(points) {
  const TAU = Math.PI * 2;
  const palettes = '''+palettes+''';
  const state = {};
  const assets = new Map(), tints = new Map();
  let burstAt = -100, burstVersion = -1, lastFrame, disposed = false;
'''
footer='''
  function render(canvas, time, options) {
    lastFrame = [canvas, time, options];
    Object.assign(state, options);
    if (options.burstVersion !== burstVersion) {
      if (burstVersion !== -1) burstAt = time;
      burstVersion = options.burstVersion;
    }
    return draw(canvas, time, state.upgrade, state.gem, state.refine, state.original);
  }
  return { render, destroy() { disposed = true; for (const image of assets.values()) image.onload = null; assets.clear(); tints.clear(); } };
}
'''
Path('game-home/src/auraRenderer.js').write_text(header+body+footer,'utf-8')