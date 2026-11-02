# Tâm An Vạn Sự An · Chùa Phong Linh LIVE

> *Một niệm an lành, ngàn hoa nở.*

Không gian chánh điện tương tác trực tiếp chạy ngay trên máy của bạn, thiết kế chuyên biệt cho buổi **LIVE TikTok** dọc chuẩn **9:16 (1080×1920)**: góc nhìn đại điện mở rộng `3/2`, chu trình máy quay điện ảnh đa góc độ (Trái · Phải · Giữa × Xa · Trung · Cận), đội hình **160 phật tử** ngồi đối xứng hai bên với hành lang chính giữa, **3 vị trí danh dự** bước lên trước bàn thờ Phật dâng hoa / thắp hương / vái lạy, tự động hiển thị & đọc lời cầu nguyện bằng **giọng đọc AI tiếng Việt** mở đầu *"Chùa Tâm An..."*, cùng Bảng tri ân và cột mốc công đức cộng đồng. Mặc định có sẵn chế độ **mô phỏng** để trải nghiệm ngay mà không cần tài khoản TikTok.

**Công nghệ:** Phaser 4.2.1 · React · TypeScript · Node.js · SQLite

---

## Giao diện & Góc máy

<table>
  <tr>
    <td align="center" valign="top" width="50%">
      <img src="screenshots/game.png" alt="Toàn cảnh đại điện Tâm An Vạn Sự An: góc rộng 9:16, 160 phật tử xếp 2 bên, hành lang giữa, 3 vị trí hành lễ trước bàn thờ, lời cầu nguyện và bảng tri ân bên phải" width="340"><br>
      <sub><b>Đạo tràng · Góc Toàn cảnh (Xa)</b> (<code>/overlay</code>, <code>/game</code>)<br>Khung dọc chuẩn 9:16 với góc nhìn đại điện mở rộng 3/2, đội hình 2 bên (10 hàng × 8 người/bên = 160 phật tử), hành lang giữa và 3 vị trí hành lễ trước lư hương.</sub>
    </td>
    <td align="center" valign="top" width="50%">
      <img src="screenshots/game-closeup.png" alt="Góc cận cảnh sát tượng Phật và 3 vị trí phật tử đang vái lạy, dâng hoa, thắp nhang trước bàn thờ" width="340"><br>
      <sub><b>Đạo tràng · Góc Cận cảnh (Sát tượng & người hành lễ)</b><br>Máy quay tự động lướt cận cảnh sát tượng Phật, hào quang bàn thờ và những phật tử đang thành kính vái lạy / dâng hương.</sub>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td align="center" valign="top" width="50%">
      <img src="screenshots/admin-dashboard.png" alt="Phòng điều khiển: xem trước trực tiếp, tương tác thử, mô phỏng 1.000 người xem và Bảng tri ân" width="460"><br>
      <sub><b>Phòng điều khiển</b> (<code>/admin</code>)<br>Xem trước trực tiếp 60 FPS, gửi tương tác thử, mô phỏng 1.000 người xem (lấp đầy 160 phật tử), theo dõi Bảng tri ân và lịch sử sự kiện.</sub>
    </td>
    <td align="center" valign="top" width="50%">
      <img src="screenshots/admin-setting.png" alt="Cài đặt: giọng đọc AI tiếng Việt, âm lượng, đường dẫn OBS lvh.me và kết nối TikTok LIVE" width="460"><br>
      <sub><b>Cài đặt & Kết nối</b> (<code>/admin</code>)<br>Tùy chỉnh góc máy tự động, giọng đọc AI tiếng Việt, âm nền, tiếng chuông, đường dẫn nguồn OBS và kết nối TikTok LIVE.</sub>
    </td>
  </tr>
</table>

---

## Tính năng nổi bật (Bản cập nhật mới)

### 1. Không gian Chánh điện 9:16 mở rộng & Chu trình Camera điện ảnh 8 góc độ
- **Giữ chuẩn khung hình dọc `9:16` (`1080×1920`)** cho TikTok LIVE / OBS, đồng thời **mở rộng góc nhìn ảnh nền đại điện gấp `3/2` lần** (`temple-hall-wide.jpg`) giúp không gian thâm nghiêm, sâu và thoáng rộng hơn mà không遮 khuất tượng Phật.
- **Chu trình lia máy tự động 8 góc đa dạng** với tốc độ chậm rãi, tĩnh tại (~13,5 giây mỗi chuyển cảnh) kết hợp chiều sâu 2.5D:
  1. **Giữa · Xa**: Toàn cảnh đại điện từ vòm gỗ chạm khắc đến thảm đỏ.
  2. **Đá Trái · Trung**: Lướt sang dãy phật tử và hàng cột đèn lồng bên trái.
  3. **Giữa · Cận**: Zoom sát tượng Phật, bàn thờ và 3 vị trí phật tử đang vái lạy / dâng hương.
  4. **Đá Phải · Trung**: Lướt sang dãy phật tử và hàng cột đèn lồng bên phải.
  5. **Giữa · Trung**: Trung cảnh dọc hành lang chính giữa và hai bên lễ đường.
  6. **Đá Trái · Cận**: Góc cận nghiêng trái bàn thờ & khói hương.
  7. **Đá Phải · Cận**: Góc cận nghiêng phải bàn thờ & hoa sen.
  8. **Giữa · Xa**: Trở về toàn cảnh tĩnh tại.

### 2. Đội hình 160 Phật tử (2 bên × 10 hàng × 8 người) & Lộ trình di chuyển chữ L
- **Xếp đội hình cân đối hai bên tả – hữu**: Mỗi bên gồm **10 hàng**, mỗi hàng **8 người ngồi sát nhau** ngay ngắn (tối đa `80 người/bên` = **160 phật tử** hiện diện cùng lúc), chừa **1 hành lang rộng ở chính giữa** thảm đỏ và khoảng thoáng trang nghiêm trước bàn thờ.
- **Hiển thị tên TikTok trên đầu nhân vật**: Tên người xem luôn hiển thị rõ ràng phía trên đầu nhân vật trong suốt thời gian hiện diện, tự động căn lệch tầng nhẹ giữa các vị trí liền kề để không đè chữ.
- **Di chuyển thực tế theo hành lang giữa**:
  - **Khi mới vào phòng LIVE (`join`)**: Nhân vật xuất hiện từ dưới cùng của hành lang giữa, đi thẳng dọc hành lang lên đến đúng hàng ghế của mình rồi mới rẽ trái/phải vào vị trí ngồi thiền định.
  - **Khi thực hiện hành lễ (`!le`, `!nhang`, `!cau`, tặng quà)**: Nhân vật đứng dậy, đi từ ghế ngồi ra hành lang giữa trước, sau đó mới tiến thẳng dọc hành lang lên **1 trong 3 vị trí danh dự trước bàn thờ Phật** để dâng hoa, thắp nhang hoặc vái lạy (kèm vòng hào quang dưới chân, nhãn hành động `✦ Dâng Hoa Lễ Phật` / `✦ Lên Thắp Hương` / `✦ Lên Vái Lạy` / `✦ Dâng Lời Nguyện` và hiệu ứng khói hương, cánh sen). Khi hành lễ xong, nhân vật lùi dọc hành lang giữa về lại đúng hàng rồi rẽ vào chỗ ngồi.

### 3. Bố cục Giao diện tinh gọn – Không bị bình luận TikTok che khuất
- **Phía trên tiêu đề `Tâm An Vạn Sự An`**: Đặt gọn 2 huy hiệu **Số khách hiện diện** và **Số người xem đồng thời** cùng trạng thái kết nối ở góc phải; bỏ các hộp hướng dẫn cồng kềnh che tượng Phật, chỉ giữ **3 nút lệnh nổi bật** (`!le`, `!nhang`, `!cau <lời cầu>`) ngay dưới câu đề từ *"Một niệm an lành, ngàn hoa nở."*
- **Cao độ `2/5` từ dưới lên (`bottom: 40%`)**: Cụm thông báo hành lễ và lời dẫn được thiết kế dạng dải mảnh tinh tế có viền vàng nhấn bên trái, đặt ở vị trí `2/5` màn hình tính từ dưới lên để nằm hoàn toàn phía trên vùng trôi bình luận của TikTok LIVE.
- **Nửa bên phải (`48%` chiều ngang)**: Khung **Lời cầu nguyện** (nằm trên, chiều cao tự động co giãn theo độ dài lời nguyện) và **Bảng tri ân** (nằm ngay dưới, cách nhau một khoảng thoáng) được căn gọn sang nửa bên phải màn hình với viền vàng kim bên phải, giúp người xem đọc trọn vẹn mà không bị bình luận TikTok ở góc trái che mất.

### 4. Giọng đọc AI Tiếng Việt tự động (`Chùa Tâm An...`)
- Hỗ trợ tổng hợp giọng đọc tiếng Việt tự nhiên đa nền tảng (Edge/Google TTS trên **Windows & Linux**, cùng giọng Linh bản địa trên **macOS**).
- Tự động giảm nhỏ nhạc nền (ducking) khi đọc và phát lời chúc mở đầu bằng **"Chùa Tâm An..."**:
  - **Chào đón người mới vào LIVE (`join`)**: *"Chùa Tâm An xin chào đón [Tên] đã ghé thăm chùa."* (giới hạn tần suất 60 giây/người để tránh lặp).
  - **Đọc trực tiếp lời cầu nguyện (`!cau <lời cầu>`)**: Tự động hiển thị lên khung lời cầu nguyện và đọc vang *"Chùa Tâm An thành tâm cầu nguyện cùng [Tên]: [Nội dung lời cầu]"*.
  - **Tri ân quà tặng, theo dõi, chia sẻ & cột mốc người xem**: *"Chùa Tâm An xin cảm ơn [Tên] đã gửi quà / đã theo dõi / đã chia sẻ LIVE"*, *"Chùa Tâm An hân hoan đón [N] người đang cùng theo dõi"*.

---

## Bắt đầu nhanh

### Cách 1: Chạy nhanh trên Windows bằng `ChayChua.bat` (Khuyến nghị)

Chỉ cần nhấp đúp vào tệp **`ChayChua.bat`** trong thư mục dự án:
- Tự động khởi chạy máy chủ trên cổng `80` (hoặc cổng cấu hình trong `.env`).
- Tự động mở trình duyệt vào bảng điều khiển [`http://lvh.me/admin`](http://lvh.me/admin).

| Đường dẫn nhanh (`lvh.me`) | Đường dẫn mặc định (`localhost:3000`) | Công dụng |
| --- | --- | --- |
| [`http://lvh.me/admin`](http://lvh.me/admin) | [`http://127.0.0.1:3000/admin`](http://127.0.0.1:3000/admin) | **Phòng điều khiển** dành cho người vận hành |
| [`http://lvh.me/game`](http://lvh.me/game) | [`http://127.0.0.1:3000/game`](http://127.0.0.1:3000/game) | **Đạo tràng**: có nút bật/tắt âm thanh trực tiếp trên trình duyệt |
| [`http://lvh.me/overlay`](http://lvh.me/overlay) | [`http://127.0.0.1:3000/overlay`](http://127.0.0.1:3000/overlay) | **Nguồn OBS (Hình ảnh)**: chỉ cảnh chùa chuẩn 9:16 |
| [`http://lvh.me/overlay?audio=1`](http://lvh.me/overlay?audio=1) | [`http://127.0.0.1:3000/overlay?audio=1`](http://127.0.0.1:3000/overlay?audio=1) | **Nguồn OBS (Có âm thanh & giọng đọc AI)** |

> **Mẹo dùng `lvh.me` trên Windows:** Thêm dòng `127.0.0.1 lvh.me` vào tệp `C:\Windows\System32\drivers\etc\hosts` và đặt `PORT=80` trong `.env` để sử dụng đường dẫn ngắn gọn không cần số cổng.

### Cách 2: Chạy bằng dòng lệnh (`npm` hoặc `make`)

Cần Node.js **≥ 24** và npm. Chạy trong thư mục dự án:

```sh
npm install
npm run dev
```

Hoặc nếu máy có `make`:

```sh
make setup
make
```

`make setup` cài phụ thuộc và tạo `.env` từ `.env.example` nếu chưa có; tệp `.env` hiện có được giữ nguyên. Dùng `make run` để khởi động lại máy chủ, `Ctrl+C` để dừng, `make help` để xem các lệnh, `make install` để chỉ cài phụ thuộc và `make test` để chạy unit/integration tests.

Mở **Phòng điều khiển** (`/admin`) và bấm **Chạy mô phỏng** (hoặc nhập `1000` vào ô *Người xem đồng thời · mô phỏng* rồi bấm **Cập nhật người xem**) để lấp đầy **160 phật tử** ngồi kín 10 hàng hai bên và tự động gửi tương tác; bấm **Dừng mô phỏng** để dừng.

Chạy bản production:

```sh
npm run build
npm start
```

---

## Tương tác của người xem trên TikTok LIVE

Hệ thống hỗ trợ đầy đủ cả lệnh **không dấu**, **có dấu tiếng Việt** và **không cần dấu chấm than (`!`)** đối với các lệnh phổ biến:

| Bình luận / Sự kiện | Hành động trong Chánh điện | Điểm công đức & Hiệu ứng |
| --- | --- | --- |
| `!le`, `!lễ`, `le`, `lễ`, `!lay`, `!lạy` | **Lễ Phật**: Đi ra hành lang giữa $\rightarrow$ tiến lên trước bàn thờ vái lạy | `+1` điểm công đức chung, ghi nhận Bảng tri ân |
| `!nhang`, `nhang`, `!huong`, `!hương` | **Thắp nhang**: Đi ra hành lang giữa $\rightarrow$ tiến lên lư hương dâng nhang | `+1` điểm công đức chung, khói hương trầm, ghi nhận Bảng tri ân |
| `!cau <lời cầu>`, `!cầu <lời cầu>`, `cầu <lời cầu>` | **Cầu nguyện**: Tiến lên trước bàn thờ + hiện lời cầu nguyện + **Giọng AI đọc vang lời cầu** | `+1` điểm công đức chung, hiện lên khung Lời cầu nguyện & đọc giọng AI |
| **Tặng Quà LIVE** | **Dâng hoa sen**: Ưu tiên bước lên 3 vị trí danh dự trước bàn thờ Phật | Cộng điểm theo cấu hình quà, mưa cánh sen hồng & giọng AI cảm ơn |
| **Vào phòng LIVE (`join`)** | Đi từ dưới cùng hành lang giữa lên hàng ghế & hiện tên trên đầu | Giọng AI chào đón *"Chùa Tâm An xin chào đón..."* (cooldown 60s/người) |
| **Theo dõi (`follow`) / Chia sẻ (`share`)** | Hiệu ứng ánh sáng & lời cảm ơn | Giọng AI đọc lời cảm ơn |
| **Thả tim (`like`)** | Hiệu ứng ánh sáng ấm áp | Tăng bộ đếm yêu thương |

- Lệnh không phân biệt chữ hoa/thường; mặc định mỗi khách chờ `10 giây` giữa các lệnh hợp lệ (có thể chỉnh trong Cài đặt).
- Lời nguyện tối đa `240 ký tự`. Tên khách được làm sạch và hiển thị dưới dạng văn bản thuần, an toàn tuyệt đối (không thực thi HTML/script).
- Mốc `100 / 250 / 500` và mỗi `500` điểm tiếp theo làm sáng thêm ánh đèn đại điện và kích hoạt lễ hoa sen.

---

## Quản trị (`/admin`)

- **Phòng điều khiển**: Xem trước trực tiếp, bảng tương tác thử cục bộ (Lễ Phật, Thắp nhang, Gửi quà, Gửi lời cầu nguyện, Cập nhật số người xem đồng thời mô phỏng lên tới `1.000+` người để lấp đầy 160 chỗ ngồi).
- **Lời cầu nguyện**: Xem danh sách lời cầu nguyện đã hiển thị hoặc duyệt/ẩn thủ công.
- **Quà tặng**: Ánh xạ mã quà TikTok thật sang hành động (`lotus`, `incense`, `bow`), cường độ hiệu ứng (`1–3`) và số điểm đóng góp.
- **Cài đặt**:
  - Chuyển đổi góc nhìn (**Toàn cảnh** / **Cận cảnh**) hoặc bật **Tự động chuyển góc máy** (chu trình 8 góc).
  - Bật/tắt **Giọng đọc AI**, chỉnh âm lượng giọng đọc, âm lượng nhạc nền và tiếng chuông.
  - Sao chép đường dẫn nguồn phát OBS (`/overlay` và `/overlay?audio=1`).
  - Cấu hình tài khoản **TikTok LIVE** (`@username`).

### Bảng tri ân theo phiên LIVE
- Bảng **Quà tặng** ghi nhận điểm đóng góp theo ánh xạ quà. Bảng **Tham gia miễn phí** ghi nhận lệnh lễ/nhang và lời cầu nguyện. Mỗi bảng hiển thị 5 người dẫn đầu trên màn hình LIVE (tự động luân phiên mỗi 12 giây giữa bảng Quà tặng và bảng Tham gia).
- Trong quản trị, bấm **Bắt đầu phiên mới → Xác nhận phiên mới** để đặt lại bảng xếp hạng của phiên mới mà vẫn giữ nguyên tiến độ công đức chung, cài đặt và ánh xạ quà.

### Cột mốc khán giả và chia sẻ
- Số **người xem đồng thời** lấy từ thống kê phòng TikTok LIVE thực tế (hoặc bộ mô phỏng trong `/admin`).
- Các mốc `100 / 250 / 500 / 1.000` và mỗi `1.000` người xem tiếp theo kích hoạt đại lễ hoa sen toàn chánh điện: toàn bộ phật tử đồng loạt vái lạy, ánh sáng chánh điện bừng sáng và giọng AI đọc lời chào mừng cột mốc.

---

## Kết nối TikTok LIVE

1. Mở [`http://lvh.me/admin`](http://lvh.me/admin) → tab **Cài đặt → Kết nối TikTok**.
2. Nhập **tên tài khoản TikTok đang phát LIVE** (ví dụ `ojv.music` hoặc `@ojv.music`) và bấm **Lưu thông tin**.
3. Bấm **Kết nối TikTok**. Khi kết nối thành công, huy hiệu góc trên bên phải cảnh chùa sẽ chuyển sang **`TikTok LIVE`**.
4. Nếu tài khoản chưa phát LIVE, bảng điều khiển sẽ báo rõ *"Tài khoản @... hiện chưa phát LIVE trên TikTok"*.
5. Bấm **Dùng mô phỏng** bất cứ lúc nào để ngắt kết nối TikTok và quay về chế độ thử cục bộ.

> **Lưu ý kỹ thuật:** Connector sử dụng `tiktok-live-connector` v2 (hỗ trợ chuẩn gói tin Webcast Protobuf v3 mới nhất, trích xuất đầy đủ `content`/`comment`, tự động bỏ qua `fetchAvailableGifts` không cần khóa trả phí và giữ kết nối bền bỉ khi gặp gói tin phụ lạ). Không yêu cầu mật khẩu hay cookie tài khoản TikTok.

---

## Thiết lập OBS Studio / TikTok LIVE Studio

1. Chạy ứng dụng bằng `ChayChua.bat` (hoặc `npm run dev`).
2. Trong **OBS Studio** hoặc **TikTok LIVE Studio**, thêm nguồn **Browser Source** (Nguồn trình duyệt):
   - **URL (Có đầy đủ âm thanh & giọng đọc AI):** `http://lvh.me/overlay?audio=1` (hoặc `http://127.0.0.1:3000/overlay?audio=1`)
   - **URL (Chỉ hình ảnh):** `http://lvh.me/overlay`
   - **Width (Chiều rộng):** `1080`
   - **Height (Chiều cao):** `1920`
   - **FPS:** `30` hoặc `60`
3. Tích chọn **Control audio via OBS** (Điều khiển âm thanh qua OBS) nếu muốn chỉnh âm lượng trực tiếp trên thanh Mixer của OBS.
4. Nếu mở trên trình duyệt Chrome/Edge thông thường với `?audio=1`, chỉ cần nhấp chuột 1 lần vào trang để trình duyệt mở khóa tự động phát âm thanh.

---

## Ứng dụng máy tính đóng gói sẵn (macOS, Windows)

- Tự dựng cục bộ cần [Bun](https://bun.sh) ≥ 1.4.4: chạy `npm ci`, sau đó `npm run package` (cho máy hiện tại) hoặc `npm run package -- --target bun-windows-x64` / `bun-darwin-arm64` / `bun-darwin-x64`. Kết quả xuất ra tại thư mục `release/`.
- Workflow `.github/workflows/build.yml` tự động dựng và kiểm tra cả ba bản trên GitHub Actions, đồng thời tạo Release khi đẩy tag `v*` (ví dụ `git tag v0.2.0 && git push origin v0.2.0`).

---

## Dữ liệu, Sao lưu & Kiểm thử

- Mặc định dữ liệu lưu tại `data/temple.sqlite` (cùng các tệp WAL/SHM). Thư mục `data/` và tệp `.env` được loại trừ khỏi Git để bảo mật.
- **Sao lưu:** Dừng máy chủ bằng `Ctrl+C`, sao chép toàn bộ thư mục `data/`, sau đó khởi động lại.
- **Kiểm thử & Xây dựng:**
  ```sh
  npm run check
  npm test
  npm run build
  ```

---

## Cấu trúc thư mục

- `apps/web`: Giao diện React tiếng Việt, cảnh chùa Phaser 4.2.1 (`game.ts`), bố cục lớp phủ (`TempleView.tsx`, `Leaderboard.tsx`, `style.css`), âm thanh & giọng đọc (`audio.ts`).
- `apps/server`: Engine xử lý trạng thái & lộ trình (`engine.ts`), lưu trữ SQLite (`store.ts`), tổng hợp giọng đọc AI tiếng Việt (`tts.ts`), kết nối TikTok LIVE (`connectors.ts`).
- `packages/shared`: Định nghĩa kiểu dữ liệu, schema kiểm tra hợp lệ (Zod) và trạng thái đồng bộ.
- `screenshots/`: Ảnh chụp giao diện Đạo tràng (toàn cảnh, cận cảnh) và Phòng điều khiển.
- `ChayChua.bat`: Công cụ khởi động nhanh 1 chạm trên Windows.
