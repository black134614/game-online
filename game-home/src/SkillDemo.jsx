import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl, loadSkillData, normalize } from "./assets.js";
import { createCombatRenderer } from "./combatRenderer.js";

function CombatCanvas(props) {
  const ref = useRef(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const renderer = createCombatRenderer(
      ref.current,
      props.data,
      props.replay,
    );
    let frame,
      previous = 0,
      progress = 0,
      seekVersion = -1,
      lastUpdate = 0,
      lastDraw = "";
    function tick(now) {
      const config = latest.current;
      if (seekVersion !== config.seek.version) {
        progress = config.seek.value;
        seekVersion = config.seek.version;
        previous = now;
      }
      if (config.playing && previous)
        progress = Math.min(
          1.2,
          progress + ((now - previous) / 2200) * config.speed,
        );
      previous = now;
      if (progress >= 1.2) {
        if (config.loop) progress = 0;
        else {
          progress = 1;
          config.onEnd();
        }
      }
      const signature = `${config.skill.id}|${config.tier}|${config.mobId}|${config.cluster}|${progress}`;
      if (signature !== lastDraw) {
        config.onCaption(
          renderer.draw({
            skill: config.skill,
            tier: config.tier,
            mobId: config.mobId,
            cluster: config.cluster,
            progress,
          }),
        );
        lastDraw = signature;
      }
      if (now - lastUpdate > 80) {
        config.onProgress(Math.min(1, progress));
        lastUpdate = now;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      renderer.destroy();
    };
  }, [props.data, props.replay]);
  return (
    <canvas
      ref={ref}
      width="920"
      height="420"
      aria-label="Nhân vật tung kỹ năng hiện tại lên quái"
    />
  );
}

export default function SkillDemo({ initialId = 85 }) {
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState(initialId);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("4");
  const [mobId, setMobId] = useState(0);
  const [cluster, setCluster] = useState(true);
  const reducedMotion = useRef(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [playing, setPlaying] = useState(!reducedMotion.current);
  const [loop, setLoop] = useState(!reducedMotion.current);
  const [speed, setSpeed] = useState(1);
  const [seek, setSeek] = useState({ value: 0, version: 0 });
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState("");
  useEffect(() => {
    let cancelled = false;
    setError("");
    loadSkillData()
      .then((result) => {
        if (!cancelled) setLoaded(result);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);
  const schools = useMemo(
    () =>
      loaded ? [...new Set(loaded[0].skills.map((skill) => skill.school))] : [],
    [loaded],
  );
  if (error)
    return (
      <div className="demo-loading" role="alert">
        <p>{error}</p>
        <button
          className="button primary"
          onClick={() => setRetry((value) => value + 1)}
        >
          Thử lại
        </button>
      </div>
    );
  if (!loaded)
    return (
      <p className="demo-loading" role="status">
        Đang tải kỹ năng và cảnh đánh quái…
      </p>
    );
  const [data, replay] = loaded;
  const selected =
    data.skills.find((skill) => skill.id === selectedId) || data.skills[0];
  const list = data.skills
    .filter(
      (skill) =>
        skill.school === selected.school &&
        normalize(`${skill.name} ${skill.id}`).includes(normalize(query)),
    )
    .sort((a, b) => (a.rank.level || 0) - (b.rank.level || 0) || a.id - b.id);
  const choose = (skill) => {
    setSelectedId(skill.id);
    setSeek((value) => ({ value: 0, version: value.version + 1 }));
    setProgress(0);
    setPlaying(!reducedMotion.current);
  };
  return (
    <div className="skill-demo">
      <p className="eyebrow">LINH VÂN TRUYỀN KỲ / KỸ NĂNG HIỆN TẠI</p>
      <h2>Xem kỹ năng trên quái</h2>
      <p className="demo-note">
        Lấy đà, phát chiêu và va chạm — bằng bộ kỹ năng đang cài trong client.
      </p>
      <nav className="demo-schools" aria-label="Chọn phái để xem kỹ năng">
        {schools.map((school) => (
          <button
            key={school}
            aria-pressed={selected.school === school}
            onClick={() => {
              setQuery("");
              choose(
                data.skills
                  .filter((skill) => skill.school === school)
                  .sort((a, b) => (a.rank.level || 0) - (b.rank.level || 0))[0],
              );
            }}
          >
            {data.skills.find((skill) => skill.school === school).schoolName}
          </button>
        ))}
      </nav>
      <div className="demo-layout">
        <aside className="demo-sidebar">
          <label>
            Tìm kỹ năng
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên hoặc ID…"
            />
          </label>
          <div className="demo-skill-list">
            {list.map((skill) => (
              <button
                key={skill.id}
                aria-pressed={selected.id === skill.id}
                onClick={() => choose(skill)}
              >
                <img loading="lazy" src={assetUrl(skill.image)} alt="" />
                <span>
                  {skill.name}
                  <small>
                    #{skill.id} · Cấp {skill.rank.level ?? "—"} · {skill.status}
                  </small>
                </span>
              </button>
            ))}
            {!list.length && (
              <p className="demo-note">Không tìm thấy kỹ năng.</p>
            )}
          </div>
        </aside>
        <section className="demo-stage">
          <p className="demo-note">
            {selected.schoolName} · {selected.status} · ID {selected.id}
          </p>
          <h3>{selected.name}</h3>
          <p className="demo-note">
            Cấp mở {selected.rank.level ?? "—"} · Hồi chiêu bậc 1{" "}
            {selected.rank.cooldown ?? 0} ms · MP {selected.rank.mana_use ?? 0}{" "}
            · Mục tiêu {selected.rank.max_fight ?? 0}
          </p>
          <CombatCanvas
            data={data}
            replay={replay}
            skill={selected}
            tier={tier}
            mobId={mobId}
            cluster={cluster}
            playing={playing}
            loop={loop}
            speed={speed}
            seek={seek}
            onProgress={setProgress}
            onCaption={setCaption}
            onEnd={() => setPlaying(false)}
          />
          <div className="demo-controls">
            <label>
              Quái xem thử
              <select
                value={mobId}
                onChange={(event) => setMobId(Number(event.target.value))}
              >
                {replay.mobs.map((mob) => (
                  <option key={mob.id} value={mob.id}>
                    {mob.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bậc hình ảnh
              <select
                value={tier}
                onChange={(event) => setTier(event.target.value)}
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={String(value)}>
                    T{value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tốc độ xem
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                <option value="1">1×</option>
                <option value="0.5">0,5×</option>
                <option value="0.25">0,25×</option>
              </select>
            </label>
            <button
              onClick={() => {
                setSeek((value) => ({ value: 0, version: value.version + 1 }));
                setPlaying(true);
              }}
            >
              Phát lại
            </button>
            <button onClick={() => setPlaying((value) => !value)}>
              {playing ? "Tạm dừng" : "Phát tiếp"}
            </button>
          </div>
          <input
            className="demo-timeline"
            type="range"
            min="0"
            max="1000"
            value={Math.round(progress * 1000)}
            aria-label="Tiến độ kỹ năng"
            onChange={(event) => {
              const value = Number(event.target.value) / 1000;
              setPlaying(false);
              setProgress(value);
              setSeek((old) => ({ value, version: old.version + 1 }));
            }}
          />
          <div className="demo-options">
            <label>
              <input
                type="checkbox"
                checked={loop}
                onChange={(event) => setLoop(event.target.checked)}
              />{" "}
              Lặp chiêu
            </label>
            <label>
              <input
                type="checkbox"
                checked={cluster}
                onChange={(event) => setCluster(event.target.checked)}
              />{" "}
              Xem đánh cụm quái
            </label>
          </div>
          <p className="demo-note" role="status">
            {caption}
          </p>
          <details>
            <summary>Nguồn hình và giới hạn bản xem</summary>
            <p className="demo-note">
              97 kỹ năng từ DB local; tư thế, quái và ảnh hiệu ứng xuất từ
              client hiện tại. Các vệt sóng/móng vuốt bổ sung đã được bỏ. Khoảng
              cách và nhịp phát dựng offline để xem hình, không phải video
              gameplay và không tính sát thương. Phái 7–8 chưa có kỹ năng trong
              DB.
            </p>
          </details>
        </section>
      </div>
    </div>
  );
}
