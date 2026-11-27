# KE Studio

App tạo ảnh đăng bài theo nhận diện **K-Embroidery**: tải ảnh sản phẩm lên, chọn mẫu (hoặc bấm 🎲), chỉnh, rồi tải ảnh về để đăng. Logo KE luôn có trên ảnh. Mọi xử lý chạy ngay trên máy người dùng: không AI, không ảnh mẫu có sẵn, không gửi ảnh đi đâu.

Lõi xử lý ảnh dựa trên tab Ảnh của Vietlink-App (`photo.js`). Phần nhận diện (logo, màu, chữ, bố cục) thay toàn bộ bằng của KE, rút ra từ logo gốc, website k-embroidery.com và ảnh trong kho content KE. Chi tiết ở [BRAND.md](BRAND.md).

## Dùng

Mở file **`dist/KE-Studio.html`** bằng Chrome, Edge hoặc Safari. Không cần cài, không cần đăng nhập. Lần đầu cần mạng để tải font (Montserrat, Cormorant Garamond, Jost); thiếu mạng thì chữ dùng font dự phòng.

1. **Chọn ảnh**: JPG, PNG hoặc HEIC (ảnh iPhone), tối đa 12 ảnh.
2. **Chọn mẫu** ở nhóm **✨ Khám phá** (mặc định): bộ sinh mẫu ghép **27 bố cục × 8 hình cắt ảnh × 12 kiểu chữ × 12 hoạ tiết × 17 bảng màu × 4 font**, theo **8 mùa** (Hằng ngày, Valentine, St. Patrick, Easter, Mother's Day, Mùa hè, Halloween, Giáng sinh). Hơn 1,9 triệu kiểu kết hợp. Thư viện tự sinh thêm khi cuộn xuống, không bao giờ hết. Trong lúc chỉnh, mục **Đổi từng phần của mẫu** có nút đổi riêng bố cục, hình cắt ảnh, kiểu chữ, hoạ tiết, màu, font, hình nhỏ và mùa; phần khác giữ nguyên.
   - Kiểu chữ: xếp tầng, khung trắng, ruy băng, viên thuốc, nhãn chỉ khâu, gạch chân smock, huy hiệu tròn, thanh dọc, thẻ treo, chữ nghiêng lớn, chữ vòng cung, hai dải màu.
   - Hoạ tiết may thêu: sọc, kẻ ô, chấm Swiss dot, đường smock, viền chỉ khâu, viền vỏ sò, viền ric-rac, ren chấm, nơ, rắc hoạ tiết theo mùa (tim, cỏ 3 lá, trứng, thỏ, hoa, mặt trời, bí ngô, sao, bông tuyết).

   Ngoài ra còn 38 mẫu cố định × 17 tông màu ở các nhóm khác. Nhóm **Kiểu kho KE** là các kiểu đúng như ảnh trong kho content:
   - Khung chữ trắng giữa ảnh: dòng nghiêng xanh lá, tiêu đề IN HOA xanh dương, dòng nghiêng.
   - Câu khẩu hiệu ở đáy ảnh.
   - Viền sọc hoặc kẻ ô.
   - Ảnh cắt hình vỏ sò.
3. **Chỉnh**:
   - Chữ: chọn câu có sẵn đúng sự thật, hoặc tự gõ.
   - Ảnh: cắt, xoay, lật, kéo để đổi vị trí.
   - **Che mặt bé**: hình tròn đỏ có tim trắng, kéo tới đúng mặt bé.
   - Logo: vị trí, cỡ, bản trắng cho ảnh tối.
   - **Số WhatsApp**: mỗi người tự nhập số của mình (ô ở đầu thư viện mẫu hoặc mục Logo và WhatsApp). App nhớ số trên máy, mọi mẫu và mỗi lần bấm 🎲 đều giữ số đó. Để trống thì ảnh không có số.
   - Màu và ánh sáng.
4. **Tải ảnh này**: ảnh JPG 1920 px. Có nút áp dụng cùng mẫu cho cả loạt ảnh.

Trên điện thoại: mở file rồi *Thêm vào màn hình chính*. Không tải được thì nhấn giữ ảnh, chọn *Lưu ảnh*.

## Thay vải giữ nếp gấp

Trong trình chỉnh, mục *Cắt, xoay, lật* → **🧵 Thay vải (giữ nếp gấp)**: chọn vùng bộ đồ bằng đũa thần / cọ, chọn ảnh vải phẳng hoặc một màu, chỉnh độ đậm nếp, độ cong hoạ tiết, độ bóng, rồi **Áp dụng vào ảnh** (Ctrl+Z để hoàn tác). Chỉ thay mặt vải, không đổi dáng bộ đồ; ảnh thay vải là ảnh minh hoạ, kiểm trước khi đăng.

## Phím tắt

Bấm **⌨ Phím tắt** trong trình chỉnh (hoặc F1, `?`) để xem bảng đầy đủ. Trên Mac dùng ⌘ thay cho Ctrl.

| Phím | Việc |
|---|---|
| Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z) | Hoàn tác / làm lại (đổi mẫu, chữ, màu, cắt ảnh, thay vải…) |
| Ctrl+S | Tải ngay ảnh đang chỉnh (JPG 1920 px) |
| Ctrl+C | Chép ảnh đang chỉnh, dán thẳng vào Zalo, Messenger, Word |
| Ctrl+X | Cắt ảnh gốc đang chọn khỏi danh sách (đã chép sẵn) |
| Ctrl+V | Dán ảnh vừa chép / ảnh chụp màn hình vào danh sách |
| Ctrl+O | Chọn ảnh từ máy |
| Mũi tên, + / − | Dời ảnh (Shift: nhanh), phóng to / thu nhỏ |
| R · Delete · Esc | Mẫu ngẫu nhiên · bỏ miếng che mặt cuối · quay lại / đóng |
| Trong Thay vải | Ctrl+Z/Y vùng chọn, Ctrl+A chọn hết, W đũa thần, B cọ, Ctrl+V dán ảnh vải, Ctrl+Enter áp dụng, Esc huỷ |

Đang gõ trong ô chữ thì Ctrl+Z/X/C/V là của ô chữ.

## Quy tắc

- Logo KE luôn có trên ảnh xuất ra, không tắt được.
- Màu và câu chữ có sẵn chỉ lấy từ `BRAND.md`. Câu khác do người dùng tự gõ. Chỉ ghi điều có thật. MOQ là **15 chiếc/mẫu**. Không tự thêm giá hay cam kết.
- Số WhatsApp do người dùng tự nhập, không cố định trong app. Nick SM của team dùng số chung +84 855 555 490.
- Ảnh có mặt trẻ em thì che mặt như kho content.
- 🎲 chỉ đổi bản xem trước. Xuất ảnh luôn là bấm tay.

## Sửa và đóng gói lại

Sửa `src/studio.js` (mẫu, màu, câu chữ) hoặc `src/index.html` (giao diện), rồi chạy:

```bash
py build.py
```

Lệnh này ghép logo, biểu tượng và mã thành một file `dist/KE-Studio.html` (~355 KB), chỉ dùng thư viện có sẵn của Python. Thêm mẫu cố định: thêm một dòng `add('id', NHÓM, g => { ... })` trong `src/studio.js`. Mở rộng bộ sinh: thêm bố cục vào `SKELETONS`, kiểu chữ vào `drawText`, hoạ tiết vào `DECORS`, mùa vào `SEASONS` trong `src/gen.js`; số tổ hợp tự tăng theo.

| Tệp | Vai trò |
|---|---|
| `BRAND.md` | Logo, mã màu, font, bố cục, câu chữ của KE và nguồn gốc từng thứ |
| `assets/logo-k-embroidery.png` | Logo gốc 1536×373 nền trong suốt (từ website KE) |
| `assets/icon.png` | Biểu tượng app (chữ K + vòng chỉ) |
| `src/studio.js` | Xử lý ảnh, 38 mẫu cố định, giao diện chỉnh |
| `src/gen.js` | Bộ sinh mẫu: bố cục, hình cắt ảnh, kiểu chữ, hoạ tiết, bảng màu mùa lễ, font. Cùng một số `seed` luôn ra cùng một mẫu |
| `src/index.html` | Khung trang theo màu/font website KE |
| `build.py` | Đóng gói thành `dist/KE-Studio.html` |

Đã thử 22/11/2026 trên Chrome với 3 ảnh thật từ kho content: 14.544 mẫu (mọi bố cục × kiểu chữ × hoạ tiết ở 3 khổ, cùng 2.880 mẫu ngẫu nhiên theo 8 mùa) vẽ không lỗi; xuất JPG 1920 px; che mặt; số WhatsApp tự nhập giữ nguyên qua các lần 🎲.
