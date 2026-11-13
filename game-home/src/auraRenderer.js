import { assetUrl } from "./assets.js";

// Canvas art proposal, separate from installed skill and combat effects.
export function createAuraRenderer(points) {
  const TAU = Math.PI * 2;
  const palettes = {
    jade: ["#76f4cb", "#d9ffdb", "#3aab9e"],
    ice: ["#83d5ff", "#ecffff", "#458dd7"],
    fire: ["#ffb975", "#fff0bc", "#e96849"],
    thunder: ["#cba6ff", "#f1e4ff", "#8162d9"],
  };
  const state = {};
  const assets = new Map(),
    tints = new Map();
  let burstAt = -100,
    burstVersion = -1,
    lastFrame,
    disposed = false;
  function image(key, mask = false) {
    const path = `actors/${key}${mask ? "-weapon" : ""}.png`;
    if (!assets.has(path)) {
      const im = new Image();
      im.onload = () => {
        if (lastFrame && !disposed) render(...lastFrame);
      };
      im.src = assetUrl("assets/aura/" + path);
      assets.set(path, im);
    }
    return assets.get(path);
  }
  function tinted(key, color) {
    const name = key + color;
    if (tints.has(name)) return tints.get(name);
    const im = image(key, true);
    if (!im.complete || !im.naturalWidth) return null;
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 240;
    const g = c.getContext("2d");
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, 320, 240);
    tints.set(name, c);
    return c;
  }
  function pose(t) {
    if (state.pose === "idle") return "cf-00";
    if (state.pose === "attack")
      return "attack-" + Math.min(3, Math.floor((t % 1.2) / 0.18));
    return (
      state.pose +
      "-" +
      String(
        Math.floor(t / (state.pose === "run" ? 0.095 : 0.135)) % 8,
      ).padStart(2, "0")
    );
  }
  function path(g, fn, color, width = 1, alpha = 1) {
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    fn();
    g.stroke();
    g.restore();
  }
  function ellipse(
    g,
    x,
    y,
    rx,
    ry,
    color,
    width,
    alpha,
    rotate = 0,
    start = 0,
    end = TAU,
  ) {
    path(
      g,
      () => g.ellipse(x, y, rx, ry, rotate, start, end),
      color,
      width,
      alpha,
    );
  }
  function dot(g, x, y, r, color, alpha = 1) {
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.shadowBlur = r * 5;
    g.shadowColor = color;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.restore();
  }
  function star(g, x, y, r, color, alpha) {
    path(
      g,
      () => {
        g.moveTo(x - r, y);
        g.lineTo(x + r, y);
        g.moveTo(x, y - r * 1.6);
        g.lineTo(x, y + r * 1.6);
      },
      color,
      0.8,
      alpha,
    );
    dot(g, x, y, 0.85, color, alpha);
  }
  function floor(g, w, h) {
    g.fillStyle = "#142b2c";
    g.fillRect(0, 0, w, h);
    g.save();
    g.strokeStyle = "#29423e";
    g.lineWidth = 0.5;
    g.globalAlpha = 0.55;
    for (let i = -4; i < 8; i++) {
      g.beginPath();
      g.moveTo(w / 2 + i * 65, 180);
      g.lineTo(w / 2 + i * 130, h + 30);
      g.stroke();
    }
    for (let y = 197; y < h; y += 28) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.restore();
    ellipse(g, w / 2, 268, 40, 9, "#0a1a1a", 12, 0.45);
  }
  function aura(g, t, gem, c, front, moving, jumping) {
    if (!gem) return;
    let tier = gem === 6 ? 1 : gem === 8 ? 2 : 3;
    let f = state.strength * (moving ? 0.65 : 1);
    if (!front && !jumping) {
      g.save();
      g.translate(0, 267);
      g.scale(1, 0.32);
      let r = 48 + tier * 11;
      g.shadowColor = c[0];
      g.shadowBlur = 12;
      ellipse(g, 0, 0, r, r, c[0], 1.1, f * 0.65);
      ellipse(g, 0, 0, r - 5, r - 5, c[2], 0.55, f * 0.7);
      if (tier >= 2) {
        ellipse(g, 0, 0, r + 9, r + 9, c[0], 0.7, f * 0.45);
        for (let n = 0; n < 8; n++) {
          let a = (n * TAU) / 8 + t * 0.13;
          path(
            g,
            () => {
              g.moveTo(Math.cos(a) * (r - 7), Math.sin(a) * (r - 7));
              g.lineTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5));
            },
            c[1],
            1,
            f * 0.65,
          );
        }
      }
      if (tier === 3) {
        g.rotate(t * 0.1);
        for (let n = 0; n < 12; n++) {
          g.save();
          g.rotate((n * TAU) / 12);
          path(
            g,
            () => {
              g.moveTo(0, 6);
              g.bezierCurveTo(-24, 34, -19, 61, 0, 68);
              g.bezierCurveTo(19, 61, 24, 34, 0, 6);
            },
            c[0],
            0.75,
            f * 0.65,
          );
          g.restore();
        }
        ellipse(g, 0, 0, 34, 34, c[1], 0.65, f * 0.6);
      }
      g.restore();
    }
    if (tier >= 2) {
      for (let k = 0; k < (tier === 3 ? 3 : 2); k++) {
        let a = t * (0.65 + k * 0.09) + (k * TAU) / (tier === 3 ? 3 : 2),
          y = Math.sin(a) * 15;
        if (y > 0 !== front) continue;
        let x = Math.cos(a) * 58,
          cy = 216 + y;
        path(
          g,
          () => {
            for (let i = 0; i < 24; i++) {
              let b = a - i * 0.022,
                xx = Math.cos(b) * 58,
                yy = 216 + Math.sin(b) * 15;
              i ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
            }
          },
          c[0],
          1.5,
          f * 0.55,
        );
        if (tier === 3) {
          dot(g, x, cy, 2.7, c[0], f);
          dot(g, x, cy, 1.15, c[1], f);
        }
      }
    }
    for (let i = 0; i < tier * 7; i++) {
      let life = (t * (0.24 + (i % 3) * 0.03) + i * 0.617) % 1,
        angle = i * 2.399 + t * 0.12,
        x = Math.cos(angle) * (34 + tier * 8),
        y = 263 - life * (40 + tier * 18);
      if (Math.sin(angle) > 0 !== front) continue;
      dot(
        g,
        x,
        y,
        i % 4 === 0 ? 1.6 : 0.8,
        c[i % 2],
        Math.sin(life * Math.PI) * f * 0.65,
      );
    }
  }
  function weaponFx(g, key, t, up, c, scale, x, y, moving) {
    if (!up) return;
    const tex = tinted(key, c[0]),
      white = tinted(key, c[1]);
    if (!tex) return;
    let tier = up < 8 ? 1 : up < 12 ? 2 : up < 14 ? 3 : up < 16 ? 4 : 5;
    let a = state.strength * (moving ? 0.7 : 1),
      pulse = 0.7 + 0.3 * Math.sin(t * 2.1);
    g.save();
    g.globalCompositeOperation = "screen";
    g.globalAlpha = a * (0.22 + tier * 0.055) * pulse;
    g.filter = `blur(${1 + tier * 0.55}px)`;
    g.drawImage(tex, x, y, 320 * scale, 240 * scale);
    g.filter = "none";
    g.globalAlpha = a * (0.16 + tier * 0.035);
    g.drawImage(tex, x, y, 320 * scale, 240 * scale);
    if (tier >= 3) {
      g.globalAlpha = a * (0.17 + 0.17 * Math.sin(t * 3));
      g.drawImage(white, x, y, 320 * scale, 240 * scale);
    }
    g.restore();
    const pts = points[key] || [];
    for (let n = 0; n < tier * 2; n++) {
      let idx = Math.floor(((n * 0.179 + t * 0.16) % 1) * pts.length),
        p = pts[idx];
      if (!p) continue;
      let life = (t * 0.65 + n * 0.37) % 1;
      let xx = x + p[0] * scale + Math.sin(t * 2 + n) * (tier >= 4 ? 3 : 1),
        yy = y + p[1] * scale - life * (tier >= 4 ? 12 : 4);
      star(
        g,
        xx,
        yy,
        n % 3 === 0 ? 2.4 : 1.3,
        c[n % 2],
        a * Math.sin(life * Math.PI) * 0.7,
      );
    }
    if (tier === 5 && pts.length) {
      let p = pts[Math.floor(((t * 0.5) % 1) * pts.length)];
      ellipse(
        g,
        x + p[0] * scale,
        y + p[1] * scale,
        5 + 8 * (t % 1),
        2 + 4 * (t % 1),
        c[1],
        0.8,
        a * (1 - (t % 1)) * 0.4,
      );
    }
  }
  function refineFx(g, t, r, c) {
    if (!r) return;
    let a = state.strength;
    for (let i = 0; i < (r === 9 ? 7 : r === 6 ? 4 : 2); i++) {
      let phase = (t * 0.24 + i * 0.29) % 1,
        xx = Math.sin(i * 9.1) * 20,
        yy = 198 + Math.sin(i * 5.7) * 23 - phase * (r === 9 ? 16 : 4);
      star(
        g,
        xx,
        yy,
        1.5,
        c[1],
        Math.pow(Math.sin(phase * Math.PI), 8) * a * 0.75,
      );
    }
    if (r >= 6) {
      for (let side of [-1, 1])
        path(
          g,
          () => {
            g.moveTo(side * 9, 205);
            g.lineTo(side * 17, 216);
            g.lineTo(side * 12, 224);
          },
          c[0],
          0.55,
          a * (0.15 + 0.12 * Math.sin(t * 2)),
        );
    }
  }
  function draw(canvas, t, up, gem, r, original = false) {
    const g = canvas.getContext("2d"),
      w = 420,
      h = 360;
    g.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    floor(g, w, h);
    let c = palettes[state.color],
      jumping = state.pose === "jump",
      moving = state.pose !== "idle";
    let jump = jumping ? -Math.sin(((t % 1.08) / 1.08) * Math.PI) * 32 : 0;
    let key = `${state.gender}-${state.school}-${pose(t)}`;
    const im = image(key),
      mask = image(key, true);
    let scale = 1.55,
      x = -160 * scale,
      y = 267 - 210 * scale + jump;
    g.save();
    g.translate(w / 2, 0);
    if (!original) aura(g, t, gem, c, false, moving, jumping);
    g.save();
    if (state.flip) g.scale(-1, 1);
    if (im.complete && im.naturalWidth) {
      if (!original && mask.complete) {
        g.save();
        g.globalAlpha = 0.4 * state.strength;
        g.filter = "blur(7px)";
        let tint = tinted(key, c[0]);
        if (tint && up) g.drawImage(tint, x, y, 320 * scale, 240 * scale);
        g.restore();
      }
      g.drawImage(im, x, y, 320 * scale, 240 * scale);
      if (!original) weaponFx(g, key, t, up, c, scale, x, y, moving);
    }
    g.restore();
    if (!original) {
      g.save();
      g.translate(0, jump);
      refineFx(g, t, r, c);
      g.restore();
      aura(g, t, gem, c, true, moving, jumping);
      let age = t - burstAt;
      if (age >= 0 && age < 1.4) {
        let p = age / 1.4;
        ellipse(
          g,
          0,
          260,
          25 + p * 145,
          8 + p * 42,
          c[0],
          2,
          (1 - p) * state.strength,
        );
        for (let i = 0; i < 20; i++) {
          let angle = i * 2.399;
          star(
            g,
            Math.cos(angle) * p * 100,
            230 + Math.sin(angle) * p * 65 - p * 40,
            2,
            c[1],
            (1 - p) * state.strength,
          );
        }
      }
    }
    g.restore();
    return im.complete && !!im.naturalWidth;
  }
  function render(canvas, time, options) {
    lastFrame = [canvas, time, options];
    Object.assign(state, options);
    if (options.burstVersion !== burstVersion) {
      if (burstVersion !== -1) burstAt = time;
      burstVersion = options.burstVersion;
    }
    return draw(
      canvas,
      time,
      state.upgrade,
      state.gem,
      state.refine,
      state.original,
    );
  }
  return {
    render,
    destroy() {
      disposed = true;
      for (const image of assets.values()) image.onload = null;
      assets.clear();
      tints.clear();
    },
  };
}
