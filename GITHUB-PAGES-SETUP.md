# Sơn Tiến Bảo V7 — GitHub Pages

## Trạng thái hiện tại
- Frontend chạy trên GitHub Pages; tên miền phụ dự kiến là `landing.nguyenbaolam.com`.
- Admin duy nhất: `admin.html`.
- Sau khi chuyển DNS, admin ở `https://landing.nguyenbaolam.com/admin.html`.
- `admin-v2.html`, `admin-v3.html` và `index.html#admin` chỉ chuyển hướng về `admin.html` để giữ tương thích link cũ.
- `https://sontienbao.com/admin` là backend iTop bên ngoài, không phải Admin Center V7.
- Form báo giá trên site public chuyển tới `https://sontienbao.com/lien-he.html`.
- Chatbot Railway hiện không hoạt động và không được tải trên trang public. Các nút liên hệ điện thoại, Zalo và báo giá vẫn hoạt động.
- Trang chính sẽ cho phép lập chỉ mục khi chuyển sang tên miền mới.

## GitHub Pages
- Repository: `phatnbt/sontienbao-v7`.
- Source: branch `main`, folder `/(root)`.
- Custom domain GitHub Pages: `landing.nguyenbaolam.com`.
- DNS của tên miền phụ chưa được cấu hình; website hiện tại tại `nguyenbaolam.com` được giữ nguyên.

## Trỏ tên miền phụ, giữ nguyên website cũ

Nhờ người đang quản lý DNS của `nguyenbaolam.com` thực hiện duy nhất bản ghi sau:

| Loại | Tên/Host | Giá trị/Target |
| --- | --- | --- |
| CNAME | `landing` | `phatnbt.github.io` |

Không thêm tên repository vào giá trị CNAME. Không thay bản ghi `@`, `www`, nameserver, MX hoặc TXT. Sau khi DNS có hiệu lực, kiểm tra `https://landing.nguyenbaolam.com/` và bật **Enforce HTTPS** trong Settings → Pages khi chứng chỉ sẵn sàng.

## Admin Center
- Chỉ chỉnh và sử dụng `admin.html` làm giao diện admin.
- Mật khẩu cục bộ khóa giao diện Admin trên thiết bị. GitHub token là quyền ghi thực tế, chỉ giữ trong bộ nhớ của lần mở trang và cần nhập lại sau khi tải lại.
- Dữ liệu chỉnh sửa Landing Page được lưu vào GitHub qua `v7-content.js` và `manual-products.js`.
- iTop vẫn là nguồn nghiệp vụ cho dữ liệu sản phẩm gốc, giá, tồn kho, biến thể, công thức và đơn hàng.

## Đo hiệu quả liên hệ

`analytics.js` đã gắn sự kiện `quote_open`, `quote_draft` và `contact_click` (gọi điện, Zalo, Gmail, Outlook, form chính thức). Không gửi họ tên, điện thoại, email, nội dung báo giá hay từ khóa tìm kiếm vào sự kiện.

Hiện chưa có GA4 Measurement ID nên mã đo lường bên ngoài chưa tải và chưa có báo cáo tập trung. Khi chủ website tạo GA4 Web data stream cho `https://landing.nguyenbaolam.com/`, điền mã `G-...` vào `analytics-config.js`, commit/push và kiểm tra Realtime trong Analytics. `quote_draft` chỉ có nghĩa là khách đã chuẩn bị nội dung; không được coi là báo giá đã gửi. Nguồn truy cập và chiến dịch UTM do GA4 ghi nhận sau khi tag hoạt động.

## Không được làm
- Không tạo thêm `admin-v4.html`, `admin-v5.html` hoặc một bản admin song song khác.
- Không đổi DNS của `sontienbao.com` root trong giai đoạn test.
- Không coi GitHub Pages là backend thay thế iTop.
