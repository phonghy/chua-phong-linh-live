# Tài Liệu Tổng Hợp: Vận Hành, Tùy Chỉnh & Phát Triển Chùa An Nhiên LIVE (Bản Windows)

Toàn bộ mã nguồn, tài sản hình ảnh/âm thanh, lịch sử Git và tất cả tài liệu thiết kế gốc từ kho lưu trữ GitHub đã được tải **trọn vẹn 100%** về máy của bạn tại thư mục `an-nhien-pagoda`.

Tài liệu này giúp bạn tra cứu nhanh toàn bộ hồ sơ gốc của dự án và hướng dẫn chi tiết cách tự chỉnh sửa, nâng cấp thành phiên bản riêng của bạn về sau.

---

## 1. Danh mục toàn bộ tài liệu gốc đã lưu trên máy

Tất cả các tệp dưới đây đều nằm sẵn trong thư mục `an-nhien-pagoda/`:

### Tài liệu tổng quan & Hướng dẫn sử dụng
- **[README.md](an-nhien-pagoda/README.md)**: Hướng dẫn sử dụng gốc đầy đủ bằng tiếng Việt (cách vận hành phòng điều khiển, quy tắc lệnh `!le`, `!nhang`, `!cau`, bảng tri ân, cột mốc người xem, kết nối TikTok LIVE, thiết lập OBS Browser Source, sao lưu dữ liệu).
- **[PRODUCT.md](an-nhien-pagoda/PRODUCT.md)**: Mô tả ý tưởng sản phẩm, đối tượng người dùng và luồng trải nghiệm của buổi phát sóng.
- **[DESIGN.md](an-nhien-pagoda/DESIGN.md)**: Hệ thống thiết kế giao diện (bảng màu vàng kim - nâu trầm, font chữ *Be Vietnam Pro* & *Lora*, bố cục màn hình dọc 9:16 `1080×1920`).
- **[AGENTS.md](an-nhien-pagoda/AGENTS.md)**: Quy chuẩn kỹ thuật và kiến trúc dành cho lập trình viên hoặc trợ lý AI khi bạn muốn yêu cầu viết thêm tính năng mới.

### Tài liệu mỹ thuật, Prompt tạo ảnh AI & Kỹ thuật (`an-nhien-pagoda/docs/`)
- **[docs/ART_DIRECTION.md](an-nhien-pagoda/docs/ART_DIRECTION.md)**: Định hướng nghệ thuật 2.5D cho cảnh chùa, ánh sáng và chuyển động.
- **[docs/ASSET_PROMPTS.md](an-nhien-pagoda/docs/ASSET_PROMPTS.md)**: **Rất quan trọng nếu bạn muốn đổi hình ảnh chùa** — chứa toàn bộ câu lệnh (prompt) gốc dùng để tạo ảnh chánh điện (`temple-hall`), bàn thờ Phật (`altar`), và nhân vật khách hành hương (`visitors`) cùng cách tách nền alpha.
- **[docs/IMPLEMENTATION_PLAN.md](an-nhien-pagoda/docs/IMPLEMENTATION_PLAN.md)**: Kế hoạch thiết kế hệ thống qua từng giai đoạn.
- **[docs/STATUS.md](an-nhien-pagoda/docs/STATUS.md)** & **[docs/qa/PERFORMANCE.md](an-nhien-pagoda/docs/qa/PERFORMANCE.md)**: Báo cáo kiểm thử thực tế, thông số FPS và giới hạn tối ưu hiệu năng.
- **[docs/SKILLS.md](an-nhien-pagoda/docs/SKILLS.md)** & thư mục **`.agents/skills/`**: Bộ 6 kỹ năng làm game (Phaser, AI hành vi, thiết kế âm thanh, tạo asset, tối ưu hiệu năng) được tích hợp sẵn trong dự án.

---

## 2. Cấu trúc mã nguồn & Chỗ cần sửa khi muốn tùy biến thành bản riêng

Khi bạn muốn sửa đổi giao diện, câu chữ, giọng đọc hay quy tắc trò chơi, bạn chỉ cần chỉnh các tệp sau:

| Thành phần muốn sửa | Tệp mã nguồn tương ứng | Ghi chú chi tiết |
| :--- | :--- | :--- |
| **Câu lời cảm ơn, điểm số, quy tắc lệnh (`!le`, `!nhang`, `!cau`), quà mặc định** | [`apps/server/src/engine.ts`](an-nhien-pagoda/apps/server/src/engine.ts) | Sửa hàm `ingest()` để đổi câu thông báo cảm ơn (`Chùa An Nhiên xin cảm ơn...`), sửa `initial()` để đổi danh sách quà mẫu hoặc điểm mặc định. |
| **Giọng đọc AI tiếng Việt (Windows/macOS)** | [`apps/server/src/narrator.ts`](an-nhien-pagoda/apps/server/src/narrator.ts) | Đang dùng giọng nữ **`vi-VN-HoaiMyNeural`** (tốc độ `rate="-5%"`). Nếu muốn đổi sang giọng nam trầm ấm, chỉ cần đổi `vi-VN-HoaiMyNeural` thành **`vi-VN-NamMinhNeural`**. |
| **Giao diện Phòng điều khiển (`/admin`)** | [`apps/web/src/admin.tsx`](an-nhien-pagoda/apps/web/src/admin.tsx) | Toàn bộ giao diện quản trị, các nút tương tác thử, cài đặt, duyệt lời nguyện. |
| **Màn hình cảnh chùa 2.5D & Hiệu ứng hạt hoa sen, khói nhang** | [`apps/web/src/game.ts`](an-nhien-pagoda/apps/web/src/game.ts) & [`apps/web/src/TempleView.tsx`](an-nhien-pagoda/apps/web/src/TempleView.tsx) | Viết bằng Phaser 4. Chỉnh vị trí quỳ lễ của 40 khách, tốc độ hoa sen rơi, ánh sáng đèn lồng, góc máy `wide` / `close`. |
| **Nhạc nền & Tiếng chuông chùa** | [`apps/web/src/audio.ts`](an-nhien-pagoda/apps/web/src/audio.ts) & [`apps/web/public/assets/music.mp3`](an-nhien-pagoda/apps/web/public/assets/music.mp3) | Bạn có thể thay tệp `music.mp3` bằng bản nhạc thiền khác của bạn. |
| **Hình ảnh chánh điện, bàn thờ, nhân vật** | `apps/web/public/assets/` | Gồm `temple-hall.webp`, `altar.webp`, `visitors.png`. Có công cụ tự động chuẩn hóa ảnh tại `scripts/normalize-assets.mjs`. |

---

## 3. Các lệnh làm việc trên Windows

Do PowerShell trên Windows mặc định chặn script `.ps1`, khi chạy lệnh trong PowerShell bạn dùng `npm.cmd` thay cho `npm` (hoặc mở bằng Command Prompt `cmd`):

1. **Chạy ứng dụng hằng ngày (nhanh nhất):**
   - Nhấp đúp vào tệp **[`chay-ung-dung.bat`](chay-ung-dung.bat)** ở ngoài thư mục `tool live`.

2. **Chạy chế độ lập trình (tự động cập nhật ngay khi bạn sửa code):**
   ```powershell
   cd "an-nhien-pagoda"
   npm.cmd run dev
   ```

3. **Đóng gói lại sau khi bạn đã sửa code giao diện (`apps/web`):**
   Khi bạn sửa các tệp trong `apps/web`, hãy chạy lệnh build để cập nhật bản production:
   ```powershell
   cd "an-nhien-pagoda"
   npm.cmd run build
   npm.cmd start
   ```

4. **Kiểm tra lỗi code và chạy bộ test tự động:**
   ```powershell
   cd "an-nhien-pagoda"
   npm.cmd run check
   npm.cmd test
   ```

---

## 4. Sao lưu dữ liệu & Quản lý phiên bản (Git)

- **Dữ liệu người dùng & Phiên LIVE:**
  Mọi cài đặt, lời cầu nguyện, ánh xạ quà tặng và bảng xếp hạng được lưu trong tệp SQLite tại:
  `an-nhien-pagoda/data/temple.sqlite`
  Khi muốn sao lưu dữ liệu, hãy tắt máy chủ (Ctrl+C) và copy thư mục `an-nhien-pagoda/data/`.

- **Lưu lịch sử sửa đổi bằng Git (để làm bản hoàn thiện riêng của bạn):**
  Thư mục `an-nhien-pagoda` đã có sẵn kho Git (`.git`) với đầy đủ lịch sử của tác giả gốc.
  - Xem các thay đổi bạn đã sửa: `git status` hoặc `git diff`
  - Lưu lại mốc chỉnh sửa của riêng bạn:
    ```powershell
    cd "an-nhien-pagoda"
    git add -A
    git commit -m "Mo ta thay doi cua ban"
    ```
  - Đổi sang kho GitHub cá nhân của bạn (nếu sau này muốn đẩy lên GitHub riêng):
    ```powershell
    git remote set-url origin https://github.com/<ten-tai-khoan-cua-ban>/<ten-repo-cua-ban>.git
    git push -u origin main
    ```

---

## 5. Hướng dẫn chạy LIVE TikTok trực tiếp (Từ A đến Z)

Thư viện **`tiktok-live-connector` (phiên bản 2.5.0)** từ repo `zerodytrash/TikTok-Live-Connector` **ĐÃ ĐƯỢC CÀI ĐẶT SẴN VÀ TÍCH HỢP SẴN** bên trong mã nguồn ([`apps/server/src/connectors.ts`](an-nhien-pagoda/apps/server/src/connectors.ts)). Bạn **không cần** phải cài thêm hay viết thêm code kết nối nào nữa.

Để hiểu rõ cách hoạt động, một buổi LIVE TikTok tương tác gồm **2 luồng độc lập**:
1. **Luồng Hình ảnh & Âm thanh (Phát lên TikTok):** Đưa màn hình cảnh chùa (`http://127.0.0.1:3000/overlay?audio=1`) lên sóng TikTok LIVE.
2. **Luồng Nhận Tương tác (Đọc bình luận, quà tặng, tim, follow, chia sẻ từ TikTok về chùa):** Do `tiktok-live-connector` đảm nhiệm tự động khi bạn nhập `@username` trong trang Quản trị.

### Bước 1: Chuẩn bị phát hình ảnh cảnh chùa lên TikTok LIVE

Tùy theo quyền LIVE của tài khoản TikTok của bạn, có 3 cách đưa hình ảnh lên sóng:

- **Cách A — Dùng TikTok LIVE Studio trên máy tính (Khuyên dùng nếu tài khoản đã mở LIVE Studio):**
  1. Mở **TikTok LIVE Studio**, chọn bố cục **Màn hình dọc (Portrait 9:16 - 1080×1920)**.
  2. Bấm **Thêm nguồn (Add Source)** → chọn **Liên kết / Trình duyệt (Link / Browser)**.
  3. Nhập địa chỉ: `http://127.0.0.1:3000/overlay?audio=1`
  4. Đặt kích thước rộng `1080`, cao `1920` và bật âm thanh cho nguồn này.

- **Cách B — Dùng OBS Studio (Phát qua Stream Key hoặc dùng Camera ảo sang TikTok LIVE Studio / Điện thoại):**
  1. Mở **OBS Studio**, vào *Settings → Video*, đặt **Base (Canvas) Resolution** và **Output Resolution** thành **`1080x1920`** (khung dọc 9:16), FPS `30` hoặc `60`.
  2. Trong mục **Sources**, bấm `+` → chọn **Browser**:
     - **URL:** `http://127.0.0.1:3000/overlay?audio=1`
     - **Width:** `1080`
     - **Height:** `1920`
     - Tích chọn **Control audio via OBS** (để OBS thu trực tiếp tiếng nhạc thiền, tiếng chuông và giọng đọc AI mà không bị lẫn tạp âm ngoài).
     - Bỏ tích *Shutdown source when not visible*.
  3. Trong bảng **Audio Mixer** của OBS, bấm biểu tượng bánh răng ở nguồn Browser → **Advanced Audio Properties** → chọn **Monitor and Output** nếu bạn vừa muốn nghe trên tai nghe vừa muốn phát lên LIVE.

### Bước 2: Kết nối `tiktok-live-connector` để nhận Bình luận & Quà tặng thật

> **Lưu ý quan trọng:** `tiktok-live-connector` chỉ kết nối được khi tài khoản TikTok đó **ĐANG PHÁT LIVE (Đang lên sóng)**. Nếu tài khoản chưa bấm Bắt đầu LIVE, connector sẽ báo không tìm thấy phòng LIVE.

1. Bắt đầu phát LIVE trên TikTok (hoặc để kiểm tra ngay bây giờ, bạn có thể nhập thử tên `@username` của **bất kỳ kênh nào đang LIVE trên TikTok** để test nhận bình luận/quà thật!).
2. Mở trang Quản trị: `http://127.0.0.1:3000/admin` → chuyển sang tab **Cài đặt** (biểu tượng thanh trượt ở cột trái).
3. Kéo tới khung **Kết nối TikTok**:
   - **Tên tài khoản TikTok đang LIVE:** Nhập ID tài khoản (ví dụ `@chuaannhien` hoặc `chuaannhien`, không cần mật khẩu hay cookie).
   - **Khóa dịch vụ ký (tùy chọn - `signApiKey`):**
     - **Mặc định để trống!** Thư viện `tiktok-live-connector` đã dùng sẵn máy chủ ký miễn phí của *EulerStream*.
     - Chỉ khi bạn kết nối liên tục nhiều lần trong ngày và gặp thông báo giới hạn lượt ký miễn phí (Rate Limit), bạn mới cần vào [https://www.eulerstream.com](https://www.eulerstream.com) tạo tài khoản miễn phí, lấy API Key rồi dán vào ô **Khóa dịch vụ ký** này.
4. Bấm **Lưu thông tin**, sau đó bấm nút **Kết nối TikTok**.
5. Nhìn góc trên bên phải hoặc dòng trạng thái: khi chuyển sang **`TikTok LIVE · Đang nhận sự kiện @...`** là đã kết nối thành công!

### Bước 3: Ánh xạ mã Quà tặng TikTok thật (Hoa hồng, Hoa sen, Cỏ 4 lá...)

Mỗi món quà trên TikTok có một mã tên/ID riêng (ví dụ `Rose`, `TikTok`, `GG`, hoặc mã số). Để gán đúng món quà trên TikTok với hành động trong chùa:
1. Khi có người tặng quà trên LIVE, hãy nhìn vào mục **Nhịp chùa (Thời gian thực)** ở trang Quản trị `/admin`.
2. Bên cạnh tên người tặng sẽ hiện mã quà thực tế (ví dụ `Dâng hoa · 5655` hoặc `Rose`).
3. Vào tab **Quà tặng** trong `/admin` → bấm **Thêm quà** → nhập **Tên quà**, **Mã quà** (đúng mã vừa hiện trong Nhịp chùa), chọn hành động (**Dâng hoa**, **Thắp nhang**, **Lễ Phật**), mức hiệu ứng (**Nhẹ / Vừa / Lễ hội**) và số điểm cộng → bấm **Lưu quy tắc**.
   *(Những món quà chưa được cấu hình mã riêng vẫn sẽ tự động kích hoạt hiệu ứng Dâng hoa nhẹ +1 điểm và đọc lời cảm ơn bình thường).*

