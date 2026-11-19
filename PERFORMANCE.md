# Đo tốc độ và hiệu quả landing page

## Kết quả kiểm tra 19/11/2026

Chạy Lighthouse 12.8.2 bằng Chrome headless trên URL production `https://sontienbao-v7.vercel.app/`, chế độ mô phỏng tốc độ mạng và CPU. Mỗi cột là một lần chạy, không phải số liệu khách truy cập thực tế.

| Chế độ | Bản trước | Bản sau khi hoãn ảnh danh mục |
| --- | --- | --- |
| Mobile: điểm hiệu năng | 78 | 77 |
| Mobile: LCP | 4,0 giây | 4,0 giây |
| Mobile: TBT | 330 ms | 360 ms |
| Mobile: CLS | 0 | 0 |
| Desktop: điểm hiệu năng | 38 | 46 |
| Desktop: LCP | 4,3 giây | 4,7 giây |
| Desktop: TBT | 710 ms | 350 ms |
| Desktop: CLS | 0 | 0 |

Các lần chạy có dao động; hiện chưa có bằng chứng rằng LCP đã cải thiện. Lighthouse phát hiện ảnh danh mục tải sớm dưới màn hình đầu. Sau thay đổi, tổng dung lượng *có thể tiết kiệm do ảnh không đúng kích thước* trong lần chạy mobile giảm từ khoảng 1,64 MB xuống 0,43 MB. Đây là kết quả audit, không phải tổng byte thực tế tiết kiệm cho mọi lượt xem.

## Dữ liệu khách truy cập thực tế

- Trên bản Vercel, `vitals.js` tải Speed Insights từ tuyến nội bộ của dự án. Xem chỉ số tại **Vercel → dự án sontienbao-v7 → Speed Insights** sau khi có lượt truy cập. Route script đã trả HTTP 200 trong lúc triển khai. Việc thấy script tải thành công chưa thay thế cho việc xác nhận dashboard có dữ liệu.
- Có thể mở `https://sontienbao-v7.vercel.app/?vitals=1` để xem LCP, INP, CLS của **chính thiết bị đang mở trang**. INP chỉ xuất hiện sau khi tương tác. Bảng debug không tạo thêm kênh lưu trữ riêng.
- Các sự kiện `contact_click` (gọi, Zalo, email), `quote_open` và `quote_draft` đã được gắn. Hiện `analytics-config.js` chưa có mã GA4 nên chưa có báo cáo tổng hợp các lượt bấm. Khi chủ website tạo luồng GA4, điền `measurementId` dạng `G-...` vào tệp đó để bật gửi sự kiện và Web Vitals; không đưa tên, số điện thoại, nội dung báo giá hay từ khóa tìm kiếm vào sự kiện.

## Việc cần tối ưu tiếp

Ưu tiên giảm LCP khoảng 4 giây bằng cách xem lại thời điểm React dựng phần đầu trang và kích thước ảnh hero; đo lại nhiều lần trên cùng môi trường sau mỗi thay đổi. Dùng dữ liệu Speed Insights của khách thật để xác nhận INP và CLS trước khi kết luận độ mượt.

Tham khảo: [Google Web Vitals](https://web.dev/articles/vitals), [Vercel Speed Insights](https://vercel.com/docs/speed-insights/quickstart), [Vercel custom events](https://vercel.com/docs/analytics/custom-events).
