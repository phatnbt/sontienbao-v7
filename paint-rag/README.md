# API tư vấn sơn theo lượt hỏi

Landing page có hai chế độ. Trợ lý mặc định tra cứu bản kiến thức công khai trong trình duyệt. Khi kết nối Worker, khách có thể chủ động gửi câu hỏi cần giải thích thêm. Hướng dẫn có nguồn và phép tính định mức tiếp tục có sẵn khi Worker hết hạn mức hoặc không phản hồi.

Worker vận dụng cách chuẩn hóa tiếng Việt, hợp nhất thứ hạng và chuyển ca thiếu nguồn sang nhân viên từ repo nội bộ `son-tien-bao-chatbot` (`retrieval-ranking.ts` và `advisor-context.service.ts`). Bản public tìm ba chủ đề trong `paint-chatbot-knowledge.json`; mô hình Qwen tổng hợp dựa trên đoạn truy xuất và trích dẫn theo số. Worker đối chiếu số với nguồn đã biên tập trước khi trả về. Mã sản phẩm và tính lượng sơn tiếp tục dùng catalog và công thức của landing page.

## Triển khai trên Workers Free

Cloudflare Workers AI cấp 10.000 Neurons mỗi ngày trên Workers Free theo tài liệu tại thời điểm triển khai. Khi vượt hạn mức, yêu cầu thất bại. Giữ tài khoản ở gói Free để tránh tính tiền vượt hạn mức. Worker dùng AI binding của tài khoản, giới hạn yêu cầu theo IP và không cần khóa API ở trình duyệt. [Bảng hạn mức Cloudflare](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [Mô hình Qwen](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/)

1. Đăng nhập tài khoản Cloudflare dùng cho website bằng `npx --yes wrangler@4 login`. Xác nhận bằng `npx --yes wrangler@4 whoami`.
2. Từ gốc repository chạy `npx --yes wrangler@4 deploy --config paint-rag/wrangler.jsonc`. Giữ `SITE_ORIGIN` trùng chính xác với trang công khai.
3. Đặt URL HTTPS của Worker kèm `/ask` vào thẻ `stb-paint-rag` trong `index.html`. Thêm **origin chính xác** của Worker vào `connect-src` của CSP rồi triển khai landing page. Để trống thẻ này để tắt gửi câu hỏi ra ngoài.
4. Thử gửi một câu có nguồn, chẳng hạn “Mặt tiền cũ bị phấn hóa thì làm gì?”. Kiểm tra nguồn đi kèm, sau đó thử lại khi tắt Worker để xác nhận hướng dẫn cục bộ vẫn dùng được.

Chỉ đưa tài liệu được phép công khai vào tệp dữ liệu. Khi khách bấm **Gửi câu này tới AI**, chỉ câu hỏi đó được gửi. Worker từ chối một số dấu hiệu thông tin liên hệ hoặc yêu cầu kiểm tra đơn. Nội dung gửi tới Cloudflare cần tránh dữ liệu cá nhân. Giới hạn theo IP của Cloudflare là tương đối theo từng điểm mạng; hạn mức Free của nhà cung cấp là giới hạn chi phí cho mô hình.

Chạy `node tests/paint-rag.mjs` để kiểm tra API bằng binding giả lập. Chạy `npx --yes wrangler@4 deploy --dry-run --config paint-rag/wrangler.jsonc` để kiểm tra đóng gói mà không xuất bản.
