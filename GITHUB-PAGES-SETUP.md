# Sơn Tiến Bảo V7 — GitHub Pages Preview

## Trạng thái hiện tại
- Frontend preview chạy trên GitHub Pages.
- Admin duy nhất: `admin.html`.
- URL hiện tại: `https://phatnbt.github.io/sontienbao-v7/admin.html`.
- `admin-v2.html`, `admin-v3.html` và `index.html#admin` chỉ chuyển hướng về `admin.html` để giữ tương thích link cũ.
- `https://sontienbao.com/admin` là backend iTop bên ngoài, không phải Admin Center V7.
- Form báo giá trên site public chuyển tới `https://sontienbao.com/lien-he.html`.
- Chatbot website dùng widget của dự án `Tphat24/son-tien-bao-chatbot` tại Railway. `chatbot-loader.js` chỉ hiển thị widget khi `/health` hoạt động; các nút liên hệ hiện tại là phương án dự phòng. Backend Railway phải có bản triển khai đang chạy và cho phép origin `https://phatnbt.github.io` trong `ALLOWED_ORIGINS`.
- Preview được đặt `noindex,nofollow` để tránh trùng SEO với website chính.

## GitHub Pages
- Repository: `phatnbt/sontienbao-v7`.
- Source: branch `main`, folder `/(root)`.
- GitHub Pages hiện chưa gắn custom domain cho repo này.
- URL site: `https://phatnbt.github.io/sontienbao-v7/`.

## Admin Center
- Chỉ chỉnh và sử dụng `admin.html` làm giao diện admin.
- Bảo mật sử dụng lớp khóa/mật khẩu cục bộ và mã hóa GitHub token như Admin V2 trước đây.
- Dữ liệu chỉnh sửa Landing Page được lưu vào GitHub qua `v7-content.js` và `manual-products.js`.
- iTop vẫn là nguồn nghiệp vụ cho dữ liệu sản phẩm gốc, giá, tồn kho, biến thể, công thức và đơn hàng.

## Không được làm
- Không tạo thêm `admin-v4.html`, `admin-v5.html` hoặc một bản admin song song khác.
- Không đổi DNS của `sontienbao.com` root trong giai đoạn test.
- Không coi GitHub Pages là backend thay thế iTop.
