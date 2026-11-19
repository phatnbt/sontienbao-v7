# Triển khai Sơn Tiến Bảo V7

- Trang công khai: https://sontienbao-v7.vercel.app/
- Admin Center: https://sontienbao-v7.vercel.app/admin.html
- Mã nguồn: `phatnbt/sontienbao-v7`, nhánh `main`.
- `nguyenbaolam.com` là website riêng; landing page không dùng tên miền phụ của website này.
- iTop tại `sontienbao.com` vẫn là nguồn nghiệp vụ cho sản phẩm, giá và đơn hàng.

Không cần thêm bản ghi DNS để dùng địa chỉ Vercel. GitHub Pages đã tắt và file `CNAME` đã được xóa. Nếu bảng DNS của `nguyenbaolam.com` còn bản ghi `landing`, người quản lý DNS có thể xóa bản ghi riêng đó; không sửa bản ghi `@`, `www`, MX hoặc các bản ghi khác.

`admin-v2.html`, `admin-v3.html` và `index.html#admin` chuyển tới Admin Center trên Vercel. Tên miền phụ cũ hiện không phân giải DNS, nên không thể tự chuyển hướng khách truy cập. Hãy dùng địa chỉ Vercel trong mọi liên kết công khai.

CSS của trang công khai được tạo từ các tệp nguồn riêng bằng `node scripts/build-storefront-css.js`. Chạy lệnh này khi sửa CSS và tăng phiên bản `storefront.css?v=...` trong `index.html` để khách nhận bản mới. Bài kiểm tra triển khai xác nhận tệp tổng hợp khớp với nguồn.

Trang tĩnh chưa có endpoint nhận báo giá. Khách gửi nội dung đã soạn qua email, Zalo hoặc trang liên hệ chính thức. Chatbot Railway hiện tắt. Mã GA4 chưa được cấu hình nên chưa có báo cáo truy cập tập trung.

Kiểm tra trước khi xuất bản:

```bash
node tests/deployment.js
node tests/smoke.js
node tests/security.js
node tests/analytics.js
```
