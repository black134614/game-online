import { assetUrl } from "./assets.js";

// Draw only reviewed installed assets. No added training_v1 wave/claw atlas.
export function createCombatRenderer(canvas, data, replay) {
  const ctx = canvas.getContext("2d");
  const images = new Map();
  let selected,
    progress,
    mobId,
    cluster,
    lastState,
    disposed = false;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  function load(path) {
    if (!images.has(path)) {
      const image = new Image();
      images.set(path, image);
      image.onload = () => {
        if (!disposed && lastState) draw(lastState);
      };
      image.src = assetUrl(path);
    }
    return images.get(path);
  }
  function imageAt(path, x, y, width, height) {
    const image = load(path);
    if (image.complete && image.naturalWidth)
      ctx.drawImage(image, x, y, width, height);
  }
  function sprite(key, x, y, bottom = false, scale = 2) {
    const spec = data.sprites[key];
    if (!spec) return;
    const image = load(spec.image);
    if (image.complete && image.naturalWidth)
      ctx.drawImage(
        image,
        x - (spec.w * scale) / 2,
        y - spec.h * scale * (bottom ? 1 : 0.5),
        spec.w * scale,
        spec.h * scale,
      );
  }
  function drawCombat(clip, tier) {
    const floor = 328,
      target = 600,
      hasArrow = clip.cast.some((f) => f.arrow),
      attack = selected.kind === 1;
    const caster = hasArrow
      ? 225
      : target - Math.max(145, Math.min(235, (selected.rank.dx || 60) * 2));
    const bg = load("../assets/world.webp");
    if (bg.complete && bg.naturalWidth) {
      const crop = (bg.height * 920) / 420;
      ctx.drawImage(
        bg,
        (bg.width - crop) / 2,
        0,
        crop,
        bg.height,
        0,
        0,
        920,
        420,
      );
      ctx.fillStyle = "#e6eee3b0";
      ctx.fillRect(0, 0, 920, 420);
    }
    ctx.fillStyle = "#2d4c3a25";
    ctx.fillRect(0, floor + 1, 920, 90);
    ctx.strokeStyle = "#9aaa87";
    ctx.beginPath();
    ctx.moveTo(0, floor + 1);
    ctx.lineTo(920, floor + 1);
    ctx.stroke();
    const release = 0.28,
      hit = hasArrow ? 0.58 : 0.45,
      castEnd = hasArrow ? 0.45 : 0.55;
    const castTick = Math.floor(
      clamp(progress / 0.58) * Math.max(1, clip.cast.length + 14),
    );
    const releaseIndex = clip.cast.findIndex((f) => f.arrow);
    const actorPhase =
      progress < 0.08 || progress > 0.68
        ? 0
        : progress < release
          ? 1
          : progress < castEnd
            ? 2
            : 3;
    const actorId = replay.actors[selected.id]
      ? selected.id
      : replay.genericActors[selected.school];
    const actorSrc =
      replay.actors[actorId]?.[selected.kind === 0 ? 0 : actorPhase];
    if (actorSrc)
      imageAt(
        actorSrc,
        caster - 160 * 1.45,
        floor - 210 * 1.45,
        320 * 1.45,
        240 * 1.45,
      );
    const creature =
      replay.mobs.find((m) => m.id === Number(mobId)) || replay.mobs[0];
    const targets =
      attack && cluster
        ? Math.min(5, Math.max(1, selected.rank.max_fight || 1))
        : 1;
    const hitAge = progress - hit,
      impTotal = Math.max(1, clip.impact.length, clip.overlay.length);
    const hitFrame = Math.floor((hitAge / 0.34) * impTotal);
    const positions = Array.from(
      { length: targets },
      (_, i) => target + (i - (targets - 1) / 2) * 58,
    );
    for (let i = 0; i < targets; i++) {
      const x = positions[i],
        struck = attack && hitAge >= 0 && hitAge < 0.18;
      const src =
        creature.frames[
          struck
            ? Math.min(2, creature.frames.length - 1)
            : Math.floor(progress * 7) % Math.min(2, creature.frames.length)
        ];
      const im = load(src);
      if (im.complete && im.naturalWidth) {
        const zoom = 2.9 * creature.scale;
        ctx.drawImage(
          im,
          x - (im.width * zoom) / 2,
          floor - im.height * zoom,
          im.width * zoom,
          im.height * zoom,
        );
      }
      if (i === Math.floor(targets / 2)) {
        ctx.fillStyle = "#254c37";
        ctx.font = "12px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(
          creature.name + (targets > 1 ? " × " + targets : ""),
          target,
          floor + 26,
        );
        ctx.textAlign = "left";
      }
    }
    if (selected.kind !== 0) {
      // The client maintains one active sequence for each of the three cast slots.
      const active = new Map();
      for (
        let index = 0;
        index <= Math.min(castTick, clip.cast.length - 1);
        index++
      )
        for (const cue of clip.cast[index].cues)
          active.set(cue.slot ?? 0, { cue, index });
      for (const { cue, index } of active.values()) {
        const f = cue.frames[castTick - index];
        if (f)
          sprite(f[0], caster + (cue.x + f[1]) * 2, floor + (cue.y + f[2]) * 2);
      }
      const trail = replay.trails[selected.id];
      if (trail && progress >= release && progress < release + 0.13) {
        const n = Math.min(2, Math.floor(((progress - release) / 0.13) * 3));
        imageAt(
          trail[n],
          caster - 160 * 1.45,
          floor - 210 * 1.45,
          320 * 1.45,
          240 * 1.45,
        );
      }
      const projectile = clip.cast.find((f) => f.arrow);
      if (attack && hasArrow && progress >= release && progress < hit) {
        const flight = clamp((progress - release) / (hit - release));
        sprite(
          projectile.arrow,
          caster +
            (projectile.adx || 11) * 2 +
            (target - caster - (projectile.adx || 11) * 2) * flight,
          floor + (projectile.ady || -21) * 2,
          false,
          2 * (selected.projectileScale || 1),
        );
      }
      if (attack && hitAge >= 0 && hitAge < 0.34) {
        for (const x of positions) {
          const f = clip.impact[hitFrame];
          if (f) sprite(f[0], x, floor, true);
          if (clip.overlay[hitFrame])
            sprite(clip.overlay[hitFrame], x, floor - 28);
        }
      }
      if (!attack && selected.kind !== 0 && hitAge >= 0 && hitAge < 0.34) {
        const f = clip.impact[hitFrame];
        if (f) sprite(f[0], caster, floor, true);
      }
    }
    ctx.fillStyle = "#f9f7eadd";
    ctx.fillRect(16, 12, 480, 37);
    ctx.fillStyle = "#254e3c";
    ctx.font = "12px Segoe UI";
    ctx.fillText("Kỹ năng đang cài · " + selected.name + " · T" + tier, 27, 35);
    let stage =
      progress < 0.08
        ? "Chuẩn bị"
        : progress < release
          ? "Lấy đà"
          : progress < hit
            ? "Tung chiêu → mục tiêu"
            : progress < hit + 0.34
              ? "Va chạm trên quái"
              : "Thu thế";
    if (selected.kind === 0) stage = "Bị động · không tung đòn lên quái";
    else if (!attack)
      stage = "Chiêu hỗ trợ / đặc biệt · không giả sát thương lên quái";
    return (
      stage + " · Tư thế và hiệu ứng từ client hiện tại · Nhịp phát offline"
    );
  }
  function draw(state) {
    lastState = state;
    ({ skill: selected, progress, mobId, cluster } = state);
    ctx.clearRect(0, 0, 920, 420);
    ctx.fillStyle = "#e4ebde";
    ctx.fillRect(0, 0, 920, 420);
    return drawCombat(selected.tiers[state.tier], state.tier);
  }
  return {
    draw,
    destroy() {
      disposed = true;
      for (const image of images.values()) image.onload = null;
      images.clear();
    },
  };
}
