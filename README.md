# KE Studio

App tạo ảnh đăng bài theo nhận diện **K-Embroidery**: tải ảnh sản phẩm lên, chọn mẫu (hoặc bấm 🎲), chỉnh, rồi tải ảnh về để đăng. Logo KE luôn có trên ảnh. Mọi xử lý chạy ngay trên máy người dùng: không AI, không ảnh mẫu có sẵn, không gửi ảnh đi đâu.

Lõi xử lý ảnh dựa trên tab Ảnh của Vietlink-App (`photo.js`). Phần nhận diện (logo, màu, chữ, bố cục) thay toàn bộ bằng của KE, rút ra từ logo gốc, website k-embroidery.com và ảnh trong kho content KE. Chi tiết ở [BRAND.md](BRAND.md).

## Dùng

Mở file **`dist/KE-Studio.html`** bằng Chrome, Edge hoặc Safari. Không cần cài, không cần đăng nhập. Lần đầu cần mạng để tải font (Montserrat, Cormorant Garamond, Jost); thiếu mạng thì chữ dùng font dự phòng.

1. **Chọn ảnh**: JPG, PNG hoặc HEIC (ảnh iPhone), tối đa 12 ảnh.
2. **Chọn mẫu**: 38 bố cục × 8 tông màu = 304 mẫu, khổ 1:1 / 4:5 / 9:16. Nhóm **Kiểu kho KE** là các kiểu đúng như ảnh trong kho content:
   - Khung chữ trắng giữa ảnh: dòng nghiêng xanh lá, tiêu đề IN HOA xanh dương, dòng nghiêng.
   - Câu khẩu hiệu ở đáy ảnh.
   - Viền sọc hoặc kẻ ô.
   - Ảnh cắt hình vỏ sò.
3. **Chỉnh**:
   - Chữ: chọn câu có sẵn đúng sự thật, hoặc tự gõ.
   - Ảnh: cắt, xoay, lật, kéo để đổi vị trí.
   - **Che mặt bé**: hình tròn đỏ có tim trắng, kéo tới đúng mặt bé.
   - Logo: vị trí, cỡ, bản trắng cho ảnh tối.
   - Số WhatsApp: tuỳ chọn.
   - Màu và ánh sáng.
4. **Tải ảnh này**: ảnh JPG 1920 px. Có nút áp dụng cùng mẫu cho cả loạt ảnh.

Trên điện thoại: mở file rồi *Thêm vào màn hình chính*. Không tải được thì nhấn giữ ảnh, chọn *Lưu ảnh*.

## Quy tắc

- Logo KE luôn có trên ảnh xuất ra, không tắt được.
- Màu và câu chữ có sẵn chỉ lấy từ `BRAND.md`. Câu khác do người dùng tự gõ. Chỉ ghi điều có thật. MOQ là **15 chiếc/mẫu**. Không tự thêm giá hay cam kết.
- Số WhatsApp chung của team là +84 855 555 490. Đổi số phải hỏi người phụ trách.
- Ảnh có mặt trẻ em thì che mặt như kho content.
- 🎲 chỉ đổi bản xem trước. Xuất ảnh luôn là bấm tay.

## Sửa và đóng gói lại

Sửa `src/studio.js` (mẫu, màu, câu chữ) hoặc `src/index.html` (giao diện), rồi chạy:

```bash
py build.py
```

Lệnh này ghép logo, biểu tượng và mã thành một file `dist/KE-Studio.html` (~315 KB), chỉ dùng thư viện có sẵn của Python. Thêm mẫu mới: thêm một dòng `add('id', NHÓM, g => { ... })` trong `src/studio.js`.

| Tệp | Vai trò |
|---|---|
| `BRAND.md` | Logo, mã màu, font, bố cục, câu chữ của KE và nguồn gốc từng thứ |
| `assets/logo-k-embroidery.png` | Logo gốc 1536×373 nền trong suốt (từ website KE) |
| `assets/icon.png` | Biểu tượng app (chữ K + vòng chỉ) |
| `src/studio.js` | Xử lý ảnh, 38 bố cục, 8 tông màu, giao diện chỉnh |
| `src/index.html` | Khung trang theo màu/font website KE |
| `build.py` | Đóng gói thành `dist/KE-Studio.html` |

Đã thử 22/11/2026 trên Chrome: nạp 3 ảnh thật từ kho content, đủ 304 mẫu, xuất JPG 1920×1920, che mặt, số WhatsApp, 912 tổ hợp mẫu × tông × khổ vẽ không lỗi.
