import { useEffect, useRef, useState } from "react";
import { assetUrl } from "./assets.js";
import { createAuraRenderer } from "./auraRenderer.js";
import { AURA_PRESETS } from "./auraPresets.js";
const WEAPONS = ["Kiếm", "Phi tiêu", "Đoản đao", "Cung", "Đao", "Quạt"];
const COLORS = [
  { value: "jade", name: "Ngọc", color: "#76f4cb" },
  { value: "ice", name: "Băng", color: "#83d5ff" },
  { value: "fire", name: "Hỏa", color: "#ffb975" },
  { value: "thunder", name: "Lôi", color: "#cba6ff" },
];
const POSES = [
  { value: "idle", name: "Đứng" },
  { value: "run", name: "Chạy" },
  { value: "jump", name: "Nhảy" },
  { value: "attack", name: "Ra đòn" },
];

function AuraCanvas({ points, options, playing }) {
  const canvas = useRef(null);
  const latest = useRef({ options, playing });
  latest.current = { options, playing };
  useEffect(() => {
    const renderer = createAuraRenderer(points);
    let frame,
      previous = 0,
      elapsed = 0,
      previousOptions;
    function tick(now) {
      const current = latest.current;
      if (previous && current.playing)
        elapsed += Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (current.playing || previousOptions !== current.options) {
        renderer.render(canvas.current, elapsed, current.options);
        previousOptions = current.options;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      renderer.destroy();
    };
  }, [points]);
  return (
    <canvas
      ref={canvas}
      width="840"
      height="720"
      aria-label="Nhân vật và hào quang trang bị đang chọn"
    />
  );
}

export default function AuraDemo({ initialPreset = 1 }) {
  const [options, setOptions] = useState({
    school: 0,
    gender: 1,
    pose: "idle",
    upgrade: AURA_PRESETS[initialPreset].upgrade,
    gem: AURA_PRESETS[initialPreset].gem,
    refine: AURA_PRESETS[initialPreset].refine,
    color: "jade",
    strength: 0.7,
    flip: false,
    original: false,
    burstVersion: 0,
  });
  const [playing, setPlaying] = useState(
    !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [points, setPoints] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const change = (key, value) =>
    setOptions((old) => ({ ...old, [key]: value }));
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch(assetUrl("assets/aura/weapon-points.json"), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được dữ liệu hào quang.");
        return response.json();
      })
      .then(setPoints)
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [retry]);
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
  if (!points)
    return (
      <p className="demo-loading" role="status">
        Đang mở phòng thử hào quang…
      </p>
    );
  return (
    <div className="aura-demo">
      <p className="eyebrow">HÀO QUANG TRANG BỊ / BẢN XEM THỬ</p>
      <h2>Linh khí tỏa sáng.</h2>
      <p className="demo-note">
        Mẫu thẩm mỹ đang chờ duyệt, chưa cài vào game. Chọn bậc trực tiếp để xem
        hình; không mô phỏng điều kiện hay chỉ số trang bị.
      </p>
      <div className="aura-preset-bar" role="group" aria-label="Mẫu hào quang">
        {AURA_PRESETS.map((preset) => (
          <button
            key={preset.name}
            aria-pressed={
              options.upgrade === preset.upgrade &&
              options.gem === preset.gem &&
              options.refine === preset.refine
            }
            onClick={() =>
              setOptions((old) => ({
                ...old,
                upgrade: preset.upgrade,
                gem: preset.gem,
                refine: preset.refine,
              }))
            }
          >
            {preset.name}
            <small>Ngọc {preset.gem}</small>
          </button>
        ))}
      </div>
      <div className="aura-workbench">
        <div className="aura-scene">
          <div className="aura-scene-header">
            <span>
              {WEAPONS[options.school]} · {options.gender ? "Nam" : "Nữ"}
            </span>
            <span className="aura-badge">Bản xem thử</span>
          </div>
          <AuraCanvas points={points} options={options} playing={playing} />
          <p className="aura-scene-summary">
            Vũ khí {options.upgrade ? "+" + options.upgrade : "gốc"} · Ngọc{" "}
            {options.gem || "tắt"} · Tinh luyện {options.refine || "tắt"}
          </p>
        </div>
        <div className="aura-settings">
          <div className="aura-form-row">
            <label>
              Vũ khí
              <select
                aria-label="Vũ khí hào quang"
                value={options.school}
                onChange={(event) =>
                  change("school", Number(event.target.value))
                }
              >
                {WEAPONS.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nhân vật
              <select
                aria-label="Nhân vật hào quang"
                value={options.gender}
                onChange={(event) =>
                  change("gender", Number(event.target.value))
                }
              >
                <option value="1">Nam</option>
                <option value="0">Nữ</option>
              </select>
            </label>
          </div>
          <div className="aura-poses" role="group" aria-label="Tư thế nhân vật">
            {POSES.map((pose) => (
              <button
                key={pose.value}
                aria-pressed={options.pose === pose.value}
                onClick={() => change("pose", pose.value)}
              >
                {pose.name}
              </button>
            ))}
          </div>
          <label>
            Ánh sáng vũ khí
            <select
              aria-label="Ánh sáng vũ khí"
              value={options.upgrade}
              onChange={(event) =>
                change("upgrade", Number(event.target.value))
              }
            >
              <option value="0">Tắt</option>
              {[4, 8, 12, 14, 16].map((level) => (
                <option key={level} value={level}>
                  Cường hóa +{level}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vòng hào quang
            <select
              aria-label="Vòng hào quang"
              value={options.gem}
              onChange={(event) => change("gem", Number(event.target.value))}
            >
              <option value="0">Tắt</option>
              {AURA_PRESETS.map((preset) => (
                <option key={preset.gem} value={preset.gem}>
                  Ngọc {preset.gem} · {preset.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tinh quang trang phục
            <select
              aria-label="Tinh quang trang phục"
              value={options.refine}
              onChange={(event) => change("refine", Number(event.target.value))}
            >
              <option value="0">Tắt</option>
              {[3, 6, 9].map((level) => (
                <option key={level} value={level}>
                  Tinh luyện {level}
                </option>
              ))}
            </select>
          </label>
          <div className="aura-colors" role="group" aria-label="Màu hào quang">
            {COLORS.map((color) => (
              <button
                key={color.value}
                aria-pressed={options.color === color.value}
                onClick={() => change("color", color.value)}
              >
                <i style={{ background: color.color }} />
                {color.name}
              </button>
            ))}
          </div>
          <label>
            Độ sáng · {Math.round(options.strength * 100)}%
            <input
              aria-label="Độ sáng hào quang"
              type="range"
              min="20"
              max="100"
              value={options.strength * 100}
              onChange={(event) =>
                change("strength", Number(event.target.value) / 100)
              }
            />
          </label>
          <div className="aura-actions">
            <button onClick={() => change("flip", !options.flip)}>
              Đổi hướng
            </button>
            <button onClick={() => setPlaying((value) => !value)}>
              {playing ? "Tạm dừng" : "Phát tiếp"}
            </button>
            <button
              aria-pressed={options.original}
              onClick={() => change("original", !options.original)}
            >
              {options.original ? "Hiện hào quang" : "So với bản gốc"}
            </button>
            <button
              onClick={() => {
                change("burstVersion", options.burstVersion + 1);
                setPlaying(true);
              }}
            >
              Bừng sáng
            </button>
          </div>
        </div>
      </div>
      <p className="demo-note">
        Tư thế và mặt nạ vũ khí lấy từ bộ nhân vật PC; ánh sáng và các mốc trong
        phòng thử là đề xuất vẽ bằng Canvas, không phải hiệu ứng đã tích hợp.
      </p>
    </div>
  );
}
