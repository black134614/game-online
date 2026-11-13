# Linh Vân Truyền Kỳ — Trang chủ React

React 19 + Vite 8, dùng JavaScript/JSX. Trang chủ, bộ chọn phái, thư viện tài nguyên, cửa sổ chi tiết và giao diện demo kỹ năng đều là component React; Canvas vẽ cảnh skill trực tiếp trong ứng dụng, không nhúng trang HTML cũ qua iframe.

Đã build bằng Node 24.14.0, kiểm tìm kiếm không dấu/GIF, phím chọn phái, phân trang, đóng cửa sổ bằng Esc, đổi phái/quái/bậc ảnh và tua skill. Giao diện 390px không tràn ngang, không thấy lỗi console. Toàn bộ đường dẫn ảnh đã được kiểm tồn tại; dữ liệu không có atlas vệt sóng/móng vuốt đã bỏ.

## Chạy từ gốc repo

```powershell
npm --prefix game-home ci
npm --prefix game-home run dev
```

Mở `http://127.0.0.1:4173`. Có thể nhấp đúp `game-home/start-dev.bat` khi đã cài dependencies.

## Build và xem bản phát hành

```powershell
npm --prefix game-home run build
npm --prefix game-home run preview
```

Đầu ra `game-home/dist/` có thể đưa lên hosting tĩnh. Bản React cần máy chủ HTTP; không mở `dist/index.html` trực tiếp bằng giao thức file. Chưa xuất bản lên Internet.

## Cấu trúc

- `src/App.jsx`: trang chủ, chọn phái, tìm/lọc, phân trang và cửa sổ chi tiết.
- `src/SkillDemo.jsx`: giao diện React cho bộ chọn 97 kỹ năng, quái, bậc hình ảnh, tốc độ, tua và lặp.
- `src/combatRenderer.js`: vẽ Canvas từ tài nguyên client đã đối chiếu, dọn vòng lặp và cache khi đóng cửa sổ.
- `src/assets.js`: đường dẫn hỗ trợ hosting trong thư mục con và tải dữ liệu kỹ năng khi mở demo.
- `public/catalog.json`, `skills.json`, `replay.json`: dữ liệu xuất sẵn; website không truy cập MySQL hoặc thông tin đăng nhập.
- `scripts/sync_assets.py`: chép các tài nguyên đang được dùng từ bản trưng bày trước sang dự án này. Giữ nguyên nguồn và runtime game.

## Đồng bộ tài nguyên

```powershell
npm --prefix game-home run sync:assets
npm --prefix game-home run build
```

Nguồn là `design_export/linh-van-showcase-20261113/` sau khi đã xuất metadata và ảnh. Công cụ từ chối gói dữ liệu vẫn có `trainingAtlas` để không đưa lại vệt sóng/móng vuốt đã bị bỏ. Hiện có 461 mục tài nguyên, 97 kỹ năng và ngoại hình tám phái; skill của phái 7–8 chưa có trong DB nên không dựng thêm.

Cảnh tung chiêu dùng ảnh và tư thế từ client, nhưng nhịp phát, đường tới mục tiêu và khoảng cách dựng offline; không phải quay trực tiếp gameplay, không tính sát thương.

## Hoàn tác

Dự án nằm riêng trong `game-home/`, không đổi server/client hoặc bản web HTML trước. Nếu không dùng, chuyển riêng thư mục sang khu lưu trữ. Bản sao tài liệu điều phối trước khi nhận việc: `asset-backups/before-react-game-home-20261113-104239/`. Không khôi phục đè toàn bộ nhật ký nếu công cụ khác đã ghi thêm.
