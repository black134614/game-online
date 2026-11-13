import { assetUrl } from "./assets.js";
import { AURA_PRESETS } from "./auraPresets.js";

export default function AuraSection({ onOpen }) {
  return (
    <section id="auras" className="aura-section">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">05 / HÀO QUANG TRANG BỊ</p>
            <h2>
              Linh khí quanh thân.
              <br />
              <em>Ánh sáng theo từng bước.</em>
            </h2>
          </div>
          <span className="aura-status">Bản xem thử · Chưa cài trong game</span>
        </div>
        <div className="aura-feature">
          <button
            className="aura-preview"
            aria-label="Mở phòng thử hào quang"
            onClick={() => onOpen(1)}
          >
            <picture>
              <source
                media="(prefers-reduced-motion: reduce)"
                srcSet={assetUrl("assets/aura/poster.png")}
              />
              <img
                loading="lazy"
                src={assetUrl("assets/aura/preview.gif")}
                alt="Nhân vật chibi với linh trận dưới chân, ngọc sáng quanh thân và ánh sáng vũ khí"
              />
            </picture>
            <span className="aura-preview-caption">
              Xem chuyển động và phối hiệu ứng <span>↗</span>
            </span>
          </button>
          <div className="aura-intro">
            <p>
              Vòng ngọc dưới chân, ánh sáng dọc lưỡi kiếm và những điểm tinh
              quang trên trang phục. Thử ba sắc thái hào quang trên nhân vật
              hiện có.
            </p>
            <div className="aura-presets">
              {AURA_PRESETS.map((preset, index) => (
                <button key={preset.name} onClick={() => onOpen(index)}>
                  <span className="aura-preset-number">0{index + 1}</span>
                  <span>
                    <strong>{preset.name}</strong>
                    <small>{preset.description}</small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <button className="button primary" onClick={() => onOpen(1)}>
              Tự phối hào quang <span>↗</span>
            </button>
            <p className="aura-footnote">
              Hiệu ứng và mốc trang bị ở đây là mẫu thẩm mỹ đang chờ duyệt. Phần
              này dùng để xem hình, chưa mô tả điều kiện hay chỉ số trong game.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
