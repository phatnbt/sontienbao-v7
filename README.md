# Sơn Tiến Bảo V7

Landing Page V7 được xuất bản tại Vercel. Repository GitHub lưu mã nguồn và dữ liệu tĩnh.

- Landing Page: `https://sontienbao-v7.vercel.app/`.
- Admin Center duy nhất: `https://sontienbao-v7.vercel.app/admin.html`
- Website hiện có tại `https://nguyenbaolam.com/` vẫn hoạt động độc lập.
- Backend iTop bên ngoài: `https://sontienbao.com/admin`
- Production website: `https://sontienbao.com`

`admin-v2.html`, `admin-v3.html` và `index.html#admin` chỉ dùng để chuyển hướng về `admin.html`.

Xem [SECURITY.md](SECURITY.md) để biết giới hạn bảo mật của website tĩnh và cách sử dụng GitHub token.
Xem [DEPLOYMENT.md](DEPLOYMENT.md) để biết địa chỉ triển khai và cách gỡ bản ghi DNS cũ nếu còn tồn tại.

## Kiểm tra nhanh

Chạy bộ smoke test không cần cài thêm package:

```bash
node tests/smoke.js
```

Bộ test kiểm tra catalog/giá đồng bộ, form báo giá, tìm kiếm, calculator, copy mã màu, đóng dialog bằng Escape và tính ổn định của lớp SEO.

Landing page tự làm mới catalog khi có bản đồng bộ mới, hỗ trợ tìm kiếm tiếng Việt không dấu và chuyển tóm tắt calculator sang luồng nhận báo giá.

## Hỗ trợ chọn mua

- **Chọn sơn nhanh:** chọn khu vực, tình trạng tường, diện tích và thương hiệu; xem hướng xử lý ngắn có nguồn hãng, sản phẩm gợi ý từ catalog và nhận báo giá.
- **Chatbot tư vấn:** tải widget từ dịch vụ Sơn Tiến Bảo trên Railway khi `/health` xác nhận hoạt động. Trên điện thoại, nút chat nằm trên thanh liên hệ; khi dịch vụ không khả dụng, các nút gọi/Zalo/báo giá cũ vẫn hiển thị.
- **So sánh:** chọn tối đa ba sản phẩm để xem độ phủ, lượng cho hai lớp, quy cách và chi phí vật tư tham khảo. Sản phẩm thiếu dữ liệu hoặc không khớp đơn vị được đánh dấu cần xác nhận.
- **Ưu điểm và điểm cần cân nhắc:** hiển thị khi đã đối chiếu tài liệu hãng; bảng dẫn thẳng tới nguồn. Danh sách nguồn và giới hạn dữ liệu nằm trong [COMPARISON_SOURCES.md](COMPARISON_SOURCES.md).
- **Báo giá:** nút nhận báo giá chuyển sản phẩm đã chọn và lượng vật tư dự kiến vào form liên hệ. Email hỏi giá được soạn từ form này.
- **Ý tưởng công trình:** ba ảnh AI minh hoạ nội thất, ngoại thất và sân thể thao. Ảnh được ghi rõ là minh hoạ, không đại diện cho công trình đã thi công.

Trang tĩnh chưa có endpoint nhận yêu cầu báo giá. Trên bản xuất bản, form chuẩn bị nội dung kèm thông tin khách và dự toán để mở bằng Gmail, Outlook hoặc ứng dụng email; khách cần bấm **Gửi** trong kênh đã chọn. Có nút sao chép nội dung khi không dùng webmail. Nút Zalo sao chép nội dung để khách dán và gửi. Trang liên hệ chính thức là kênh dự phòng. Bản xem trước cục bộ chỉ lưu yêu cầu thử nghiệm trong trình duyệt.
