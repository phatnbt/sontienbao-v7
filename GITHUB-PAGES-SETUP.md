# Sơn Tiến Bảo V7 — GitHub Pages

## Trạng thái hiện tại
- Frontend chạy trên GitHub Pages; đang chuẩn bị chuyển sang `nguyenbaolam.com`.
- Admin duy nhất: `admin.html`.
- Sau khi chuyển tên miền, admin ở `https://nguyenbaolam.com/admin.html`.
- `admin-v2.html`, `admin-v3.html` và `index.html#admin` chỉ chuyển hướng về `admin.html` để giữ tương thích link cũ.
- `https://sontienbao.com/admin` là backend iTop bên ngoài, không phải Admin Center V7.
- Form báo giá trên site public chuyển tới `https://sontienbao.com/lien-he.html`.
- Chatbot Railway hiện không hoạt động. `chatbot-loader.js` chỉ hiển thị widget khi `/health` hoạt động; các nút liên hệ hiện tại là phương án dự phòng. Không kích hoạt Railway nếu chưa có yêu cầu mới.
- Trang chính sẽ cho phép lập chỉ mục khi chuyển sang tên miền mới.

## GitHub Pages
- Repository: `phatnbt/sontienbao-v7`.
- Source: branch `main`, folder `/(root)`.
- Tên miền dự kiến: `https://nguyenbaolam.com/`.
- Trước khi chuyển DNS, GitHub Pages đang ở `https://phatnbt.github.io/sontienbao-v7/`.

## Chuyển tên miền đang phục vụ website cũ

Tên miền hiện trỏ tới website khác. Chỉ thực hiện các bước sau khi có quyền quản lý DNS và sẵn sàng thay thế website cũ:

1. Gộp nhánh chuẩn bị tên miền vào `main` và kiểm tra GitHub Pages đã build xong.
2. Trong repository, mở **Settings → Pages → Custom domain**, nhập `nguyenbaolam.com` rồi lưu. Kiểm tra file `CNAME` tại gốc nhánh xuất bản.
3. Tại nơi quản lý DNS, thay các bản ghi `A` cho `@` bằng bốn địa chỉ GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Xóa bản ghi `A` cũ `125.253.125.119` và các bản ghi `AAAA`/`ALIAS` xung đột (nếu có).
4. Đặt `www` là `CNAME` tới `phatnbt.github.io` (không thêm đường dẫn repository). Xóa bản ghi `A`/`AAAA` của `www` nếu xung đột.
5. Chờ GitHub xác minh DNS và cấp chứng chỉ, sau đó bật **Enforce HTTPS** trong Settings → Pages. Kiểm tra tên miền gốc và `www`.

Không thay nameserver nếu chỉ cần sửa bản ghi. Giữ nguyên các bản ghi email (MX, TXT/SPF/DKIM).

## Admin Center
- Chỉ chỉnh và sử dụng `admin.html` làm giao diện admin.
- Bảo mật sử dụng lớp khóa/mật khẩu cục bộ và mã hóa GitHub token như Admin V2 trước đây.
- Dữ liệu chỉnh sửa Landing Page được lưu vào GitHub qua `v7-content.js` và `manual-products.js`.
- iTop vẫn là nguồn nghiệp vụ cho dữ liệu sản phẩm gốc, giá, tồn kho, biến thể, công thức và đơn hàng.

## Không được làm
- Không tạo thêm `admin-v4.html`, `admin-v5.html` hoặc một bản admin song song khác.
- Không đổi DNS của `sontienbao.com` root trong giai đoạn test.
- Không coi GitHub Pages là backend thay thế iTop.
