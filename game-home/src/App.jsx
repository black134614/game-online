import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { assetUrl, normalize } from "./assets.js";
import AuraSection from "./AuraSection.jsx";

const SkillDemo = lazy(() => import("./SkillDemo.jsx"));
const AuraDemo = lazy(() => import("./AuraDemo.jsx"));
const TYPES = ["Tất cả", "Quái", "Nhân vật", "NPC", "Trang bị", "Kỹ năng"];
const PAGE_SIZE = 12;
const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ"];

function Brand() {
  return (
    <a
      className="brand"
      href="#home"
      aria-label="Linh Vân Truyền Kỳ — trang chủ"
    >
      <span className="seal">LV</span>
      <span>
        LINH VÂN<small>TRUYỀN KỲ</small>
      </span>
    </a>
  );
}

function Modal({ children, onClose, wide = false, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    ref.current.showModal();
    return () => {
      ref.current?.close();
      previouslyFocused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "skill-modal" : "detail-modal"}
      onClose={() => {
        if (!ref.current?.open) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
      aria-label={label || (wide ? "Kỹ năng trên quái" : "Chi tiết tài nguyên")}
    >
      <button
        className="close-dialog"
        aria-label="Đóng cửa sổ"
        onClick={onClose}
      >
        ✕
      </button>
      {children}
    </dialog>
  );
}

function AssetDetail({ item }) {
  const [animated, setAnimated] = useState(false);
  return (
    <>
      <div className="detail-art">
        <img
          src={assetUrl(animated ? item.animation : item.image)}
          alt={item.name}
        />
      </div>
      <div className="detail-text">
        <p className="eyebrow">
          {item.type} · ID {item.id}
        </p>
        <h3>{item.name}</h3>
        <span className="tag">{item.status}</span>
        <p>{item.description}</p>
        {item.animation && (
          <div className="detail-actions">
            <button aria-pressed={!animated} onClick={() => setAnimated(false)}>
              Ảnh tĩnh
            </button>
            <button aria-pressed={animated} onClick={() => setAnimated(true)}>
              Xem hoạt ảnh
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Classes({ data, open }) {
  const [index, setIndex] = useState(0);
  const tabs = useRef([]);
  const school = data.classes[index];
  return (
    <section id="classes" className="class-section">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / CHỌN MỘT LỐI ĐI</p>
            <h2>
              Tám phái. <em>Tám sắc riêng.</em>
            </h2>
          </div>
          <p className="muted">
            Một vũ khí, một phong cách.
            <br />
            Khám phá diện mạo của từng môn phái.
          </p>
        </div>
        <div className="class-tabs" role="tablist" aria-label="Tám môn phái">
          {data.classes.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`class-tab-${i}`}
              aria-selected={index === i}
              tabIndex={index === i ? 0 : -1}
              aria-label={item.name}
              aria-controls="class-panel"
              onClick={() => setIndex(i)}
              onKeyDown={(event) => {
                let next;
                if (event.key === "ArrowRight")
                  next = (i + 1) % data.classes.length;
                else if (event.key === "ArrowLeft")
                  next = (i + data.classes.length - 1) % data.classes.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = data.classes.length - 1;
                else return;
                event.preventDefault();
                setIndex(next);
                tabs.current[next]?.focus();
              }}
            >
              <span aria-hidden="true">{ROMAN[i]}</span>
              {item.weapon}
            </button>
          ))}
        </div>
        <div
          className="class-panel"
          id="class-panel"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`class-tab-${index}`}
        >
          <div className="class-art">
            <img
              src={assetUrl(school.image)}
              alt={`Ngoại hình ${school.name}`}
            />
          </div>
          <div className="class-info">
            <span className="class-number">MÔN PHÁI / 0{index + 1}</span>
            <h3>{school.name}</h3>
            <p>{school.description}</p>
            <div className="tags">
              <span className="tag">{school.weapon}</span>
              <span className="tag">Hệ {school.element}</span>
              <span className="tag">{school.status}</span>
            </div>
            <button
              className="text-link plain-button"
              onClick={() =>
                open(
                  data.items.find(
                    (item) => item.key === `character-${school.id}`,
                  ),
                )
              }
            >
              Xem nhân vật <span>→</span>
            </button>
          </div>
        </div>
        <p className="section-footnote">
          Pháp Sư Lôi và Thương Thủy / Băng là hai phái đang phát triển. Nội
          dung trưng bày giới thiệu ngoại hình, không mô tả cân bằng chiến đấu.
        </p>
      </div>
    </section>
  );
}

function Library({ items, open }) {
  const [filter, setFilter] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const results = useMemo(
    () =>
      items.filter(
        (item) =>
          (filter === "Tất cả" || item.type === filter) &&
          normalize(`${item.name} ${item.id} ${item.description}`).includes(
            normalize(query.trim()),
          ),
      ),
    [items, filter, query],
  );
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const move = (delta) => {
    setPage((value) => value + delta);
    document.getElementById("library")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  return (
    <section className="wrap library-section" id="library">
      <div className="section-heading">
        <div>
          <p className="eyebrow">03 / SỔ TAY VẠN VẬT</p>
          <h2>
            Mỗi nét vẽ, <em>một câu chuyện.</em>
          </h2>
        </div>
        <p className="muted">
          Nhìn gần hơn thế giới của game.
          <br />
          Chọn một hình để xem chi tiết và hoạt ảnh.
        </p>
      </div>
      <div className="library-toolbar">
        <div className="filters" role="group" aria-label="Lọc loại tài nguyên">
          {TYPES.map((type) => (
            <button
              key={type}
              aria-pressed={filter === type}
              onClick={() => {
                setFilter(type);
                setPage(1);
              }}
            >
              {type}
            </button>
          ))}
        </div>
        <label className="search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm tên hoặc ID…"
            aria-label="Tìm tài nguyên theo tên hoặc ID"
          />
        </label>
      </div>
      <div className="library-meta">
        <span role="status" aria-live="polite">
          {results.length} tài nguyên{filter !== "Tất cả" && ` · ${filter}`}
        </span>
        <span>Hình ảnh từ kho tài nguyên dự án</span>
      </div>
      <div className="gallery">
        {results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
          <button
            key={item.key}
            className="asset-card"
            aria-label={`Xem ${item.name}, ${item.type}, ID ${item.id}`}
            onClick={() => open(item)}
          >
            <span className="art-box">
              <span className="asset-type">{item.type}</span>
              <img loading="lazy" src={assetUrl(item.image)} alt={item.name} />
              <span className="arrow" aria-hidden="true">
                ↗
              </span>
            </span>
            <span className="asset-label">
              <b>{item.name}</b>
              <small>
                {item.status} · #{item.id}
              </small>
            </span>
          </button>
        ))}
        {!results.length && (
          <p className="empty">
            Chưa tìm thấy tài nguyên phù hợp. Thử một tên hoặc ID khác.
          </p>
        )}
      </div>
      <div className="pagination">
        <button
          className="page-button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => move(-1)}
        >
          ←
        </button>
        <span aria-live="polite">
          {page} / {pages}
        </span>
        <button
          className="page-button"
          aria-label="Trang sau"
          disabled={page >= pages}
          onClick={() => move(1)}
        >
          →
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(assetUrl("catalog.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error("Không tải được thư viện tài nguyên.");
        return response.json();
      })
      .then(setData)
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, []);
  const open = (item) =>
    setModal(
      item.type === "Kỹ năng"
        ? { kind: "skill", id: item.id }
        : { kind: "asset", item },
    );
  if (error)
    return (
      <main className="load-screen">
        <h1>Chưa tải được trang</h1>
        <p>{error}</p>
        <button className="button primary" onClick={() => location.reload()}>
          Tải lại
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="load-screen" role="status">
        <span className="seal">LV</span>
        <p>Đang mở cổng Vân Giới…</p>
      </main>
    );
  return (
    <>
      <a className="skip" href="#main">
        Đến nội dung
      </a>
      <header className="header">
        <Brand />
        <nav aria-label="Điều hướng chính">
          <a href="#world">Vân Giới</a>
          <a href="#classes">Môn phái</a>
          <a href="#library">Tài nguyên</a>
          <a href="#skills">Kỹ năng</a>
          <a href="#auras">Hào quang</a>
        </nav>
        <a className="nav-cta" href="#library">
          Khám phá <span>↗</span>
        </a>
      </header>
      <main id="main">
        <section id="home" className="hero">
          <img
            className="hero-scene"
            src={assetUrl(data.scene)}
            alt="Sơn thủy Vân Giới với cây đào, đảo mây và kiến trúc mái cong"
            fetchPriority="high"
          />
          <div className="hero-wash" />
          <div className="hero-content">
            <p className="eyebrow">
              <span /> THẾ GIỚI CHIBI HUYỀN HUYỄN
            </p>
            <h1>
              Một bước vào mây.
              <br />
              <em>Vạn cảnh truyền kỳ.</em>
            </h1>
            <p className="hero-copy">
              Giữa biển mây là một thế giới đang chờ bạn.
              <br />
              Chọn môn phái, gặp muôn loài và viết nên hành trình của riêng
              mình.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#classes">
                Tìm môn phái của bạn <span>↗</span>
              </a>
              <a className="text-link" href="#library">
                Dạo xem tài nguyên <span>→</span>
              </a>
            </div>
            <p className="development">
              <i /> Game đang phát triển · Chưa mở thử nghiệm
            </p>
          </div>
          <div className="hero-characters" aria-hidden="true">
            <img
              className="hero-mage"
              src={assetUrl("assets/class-7.webp")}
              alt=""
            />
            <img
              className="hero-spear"
              src={assetUrl("assets/class-8.webp")}
              alt=""
            />
          </div>
          <div className="hero-caption">
            <span>VÂN GIỚI / CẢNH SẮC</span>
            <span>Hình từ bộ thiết kế map của game</span>
          </div>
        </section>
        <div className="ribbon">
          <span>LINH VÂN DẪN LỐI</span>
          <b>✧</b>
          <span>VẠN CẢNH TRUYỀN KỲ</span>
          <b>✧</b>
          <span>ANIME CHIBI TRUNG HOA</span>
        </div>
        <section className="intro wrap" id="world">
          <div>
            <p className="eyebrow">01 / CÕI MÂY VÀ LINH KHÍ</p>
            <h2>
              Chào lữ khách,
              <br />
              chào <em>Vân Giới.</em>
            </h2>
          </div>
          <div className="intro-copy">
            <p>
              Những tầng đảo nổi giữa biển mây, nơi Linh Mạch nuôi dưỡng muôn
              loài. Khi Hắc Vân dâng lên, một hành trình gìn giữ cõi này bắt
              đầu.
            </p>
            <p className="muted">
              Từ đường kiếm rực lửa đến pháp thuật lôi quang, từ sinh vật nhỏ bé
              đến những miền đất xa — hãy khám phá thế giới Linh Vân qua chính
              những hình ảnh của game.
            </p>
          </div>
          <div className="intro-note">
            <span>✧</span>
            <p>
              Nhỏ nhắn trong nét vẽ.
              <br />
              Rộng lớn trong hành trình.
            </p>
          </div>
        </section>
        <Classes data={data} open={open} />
        <Library items={data.items} open={open} />
        <section id="skills" className="skill-section">
          <div className="wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">04 / BỘ KỸ NĂNG HIỆN TẠI</p>
                <h2>
                  Võ học của phái.
                  <br />
                  <em>Dấu ấn của lữ khách.</em>
                </h2>
              </div>
              <div>
                <p className="muted">
                  Chọn chiêu và xem nhân vật đánh lên quái.
                  <br />
                  Dùng bộ kỹ năng đang cài, có 97 chiêu để tra cứu.
                </p>
                <button
                  className="button primary"
                  onClick={() => setModal({ kind: "skill", id: 85 })}
                >
                  Xem tung chiêu trên quái <span>↗</span>
                </button>
              </div>
            </div>
            <div className="skill-list">
              {data.skills.map((skill, i) => (
                <button
                  key={skill.id}
                  className="skill-card"
                  onClick={() => open(skill)}
                >
                  <img loading="lazy" src={assetUrl(skill.image)} alt="" />
                  <span>{skill.name}</span>
                  <small>
                    {data.classes[i].weapon} · Cấp {skill.level} ↗
                  </small>
                </button>
              ))}
            </div>
          </div>
        </section>
        <AuraSection onOpen={(preset) => setModal({ kind: "aura", preset })} />
        <section className="closing wrap">
          <p className="eyebrow">HÀNH TRÌNH ĐANG ĐƯỢC VIẾT TIẾP</p>
          <h2>
            Hẹn gặp bạn,
            <br />
            <em>giữa những tầng mây.</em>
          </h2>
          <p>
            Game chưa mở thử nghiệm. Bạn có thể khám phá trước
            <br />
            nhân vật, môn phái và bộ tài nguyên ngay tại đây.
          </p>
          <a href="#library" className="button primary">
            Tiếp tục khám phá <span>↑</span>
          </a>
        </section>
      </main>
      <footer>
        <Brand />
        <p>Linh Vân Dẫn Lối — Vạn Cảnh Truyền Kỳ</p>
        <span>Bản giới thiệu · Tài nguyên đang phát triển</span>
      </footer>
      {modal && (
        <Modal
          key={modal.kind === "asset" ? modal.item.key : modal.kind}
          wide={modal.kind !== "asset"}
          label={modal.kind === "aura" ? "Phòng thử hào quang" : undefined}
          onClose={() => setModal(null)}
        >
          {modal.kind === "asset" ? (
            <AssetDetail item={modal.item} />
          ) : (
            <Suspense
              fallback={
                <p className="demo-loading">Đang mở sân diễn kỹ năng…</p>
              }
            >
              {modal.kind === "aura" ? (
                <AuraDemo initialPreset={modal.preset} />
              ) : (
                <SkillDemo initialId={modal.id} />
              )}
            </Suspense>
          )}
        </Modal>
      )}
    </>
  );
}
