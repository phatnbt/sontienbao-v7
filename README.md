# Sơn Tiến Bảo V7

Landing Page V7 preview trên GitHub Pages.

- Website preview: `https://phatnbt.github.io/sontienbao-v7/`
- Admin Center duy nhất: `https://phatnbt.github.io/sontienbao-v7/admin.html`
- Backend iTop bên ngoài: `https://sontienbao.com/admin`
- Production website: `https://sontienbao.com`

`admin-v2.html`, `admin-v3.html` và `index.html#admin` chỉ dùng để chuyển hướng về `admin.html`.

## Kiểm tra nhanh

Chạy bộ smoke test không cần cài thêm package:

```bash
node tests/smoke.js
```

Bộ test kiểm tra catalog/giá đồng bộ, form báo giá, tìm kiếm, calculator, copy mã màu, đóng dialog bằng Escape và tính ổn định của lớp SEO.

Landing page tự làm mới catalog khi có bản đồng bộ mới, hỗ trợ tìm kiếm tiếng Việt không dấu và chuyển tóm tắt calculator sang luồng nhận báo giá.

## Hỗ trợ chọn mua

- **Chọn sơn nhanh:** lọc theo khu vực, ưu tiên, diện tích và thương hiệu; gợi ý sản phẩm phù hợp từ catalog hiện có.
- **So sánh:** chọn tối đa ba sản phẩm để xem độ phủ, lượng cho hai lớp, quy cách và chi phí vật tư tham khảo. Sản phẩm thiếu dữ liệu hoặc không khớp đơn vị được đánh dấu cần xác nhận.
- **Dự toán:** lưu tối đa năm bản trên thiết bị, chia sẻ hoặc sao chép nội dung, và soạn email hỏi giá kèm sản phẩm đã chọn.
- **Ý tưởng công trình:** ba ảnh AI minh hoạ nội thất, ngoại thất và sân thể thao. Ảnh được ghi rõ là minh hoạ, không đại diện cho công trình đã thi công.

GitHub Pages chưa có endpoint nhận yêu cầu báo giá. Trên bản xuất bản, form chuẩn bị nội dung kèm thông tin khách và dự toán để mở bằng Gmail, Outlook hoặc ứng dụng email; khách cần bấm **Gửi** trong kênh đã chọn. Có nút sao chép nội dung khi không dùng webmail. Nút Zalo sao chép nội dung để khách dán và gửi. Trang liên hệ chính thức là kênh dự phòng. Bản xem trước cục bộ chỉ lưu yêu cầu thử nghiệm trong trình duyệt.
