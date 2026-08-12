# Sơn Tiến Bảo V7 — triển khai không cần Supabase

## Kiến trúc

```text
Khách truy cập sontienbao.com
        ↓
Landing Page V7
        ↓
Dữ liệu sản phẩm / màu / Media
        ↓
iTop hiện tại của sontienbao.com
```

V7 không yêu cầu Supabase, VPS hay database sản phẩm thứ hai.

## A. Test local

1. Giải nén project.
2. VS Code → `index.html` → **Open with Live Server**.
3. Trang chủ chạy ở `127.0.0.1:5500/...`.
4. Admin preview: thêm `#admin` vào URL hoặc mở `admin.html`.

Local Preview cố ý KHÔNG ghi iTop do cookie + CSRF cùng origin.

## B. Test iTop Live

Upload **nguyên thư mục** lên hosting đang phục vụ `sontienbao.com`.
Ví dụ đặt tại:

```text
/stb-v7/
```

Sau đó:

1. Đăng nhập `https://sontienbao.com/admin` như hiện tại.
2. Mở `https://sontienbao.com/stb-v7/index.html#admin`.
3. Dashboard phải hiện trạng thái **iTop Live đang kết nối**.
4. Vào **Sản phẩm** → tìm một SKU → thử **Sửa nhanh** với một sản phẩm test.
5. Vào **Bảng màu** → kiểm tra danh mục được cấu hình trong `itop-config.js`.
6. Vào **Media** → upload một ảnh test nhỏ.
7. Vào **Bảo mật & mật khẩu** → dùng trang Tài khoản iTop gốc.

## C. Dữ liệu nào đang dùng iTop thật?

- Authentication/session Admin.
- Product search/create/edit/delete/duplicate/move.
- Product price / sale price / code / publish state qua form iTop native.
- Color products qua danh mục iTop.
- Media list/upload.
- Account/password qua `/admin/profile`.

## D. Dữ liệu Landing chưa map trực tiếp vào module iTop riêng

- Hero visual/design tokens.
- Landing template.
- Banner riêng của V7.
- Popup riêng của V7.
- FAQ riêng của V7.

Các phần này hiện là cấu hình frontend và có Export/Import JSON. Không tạo database trả phí mới.

## E. Báo giá

- Local Preview: lead được lưu local chỉ để test UX.
- Khi V7 chạy trên `sontienbao.com`, form báo giá chuyển sang `/lien-he.html` của website hiện tại kèm query data.
- Khi xác minh được endpoint submit chính thức của form iTop, có thể nối trực tiếp mà không thêm backend mới.

## F. Điều kiện bắt buộc

Admin live phải chạy cùng origin `sontienbao.com`; không đặt Admin writer trên Cloudflare Pages vì cookie/CSRF iTop không được dùng cross-origin.

Frontend public có thể tách CDN sau, nhưng phần Admin writer nên ở cùng hosting/domain với iTop.


V7.0.1: Nút “Nhận báo giá” trên Header chuyển trực tiếp tới https://sontienbao.com/lien-he.html, không mở modal nội bộ.
