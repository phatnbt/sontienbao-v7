# API tư vấn sơn theo lượt hỏi

Khi khách bấm **Hỏi AI** hoặc **Gửi AI**, trợ lý phân loại câu hỏi. Câu hỏi kỹ thuật khớp tài liệu được gửi tới Qwen qua Worker ngay sau khi tra cứu tại chỗ. Kết quả AI kèm nguồn thay cho phần hướng dẫn cùng nội dung. Phần hướng dẫn có nguồn vẫn dùng được nếu Worker hết hạn mức, lỗi hoặc khách bấm **Dừng chờ AI**. Tra giá, dự toán và so sánh sản phẩm do trình duyệt xử lý trực tiếp từ catalog.

Worker vận dụng cách chuẩn hóa tiếng Việt, hợp nhất thứ hạng và chuyển ca thiếu nguồn sang nhân viên từ repo nội bộ `son-tien-bao-chatbot` (`retrieval-ranking.ts` và `advisor-context.service.ts`). Bản public tìm tối đa ba chủ đề trong `paint-chatbot-knowledge.json`. Sau khi khớp chủ đề chính, Worker có thể đi theo quan hệ đã biên tập trong `worker.mjs` để tìm thêm một chủ đề có nguồn, ví dụ từ phấn hóa đến chuẩn bị tường cũ. Qwen tổng hợp dựa trên các đoạn được truy xuất. Worker đối chiếu số trích dẫn với tài liệu đã biên tập trước khi trả về.

Ô hỏi trên trang chủ dùng chung hội thoại với bong bóng chat. Khi khách cung cấp khu vực, diện tích và ngân sách, trình duyệt xếp hạng tối đa ba sản phẩm trong catalog dựa trên tiêu chí có tài liệu. Bộ lọc ngân sách chỉ nhận sản phẩm có chi phí ước tính trong mức khách đưa ra. Chi phí gồm sơn phủ hai lớp và 10% hao hụt, tính theo giá và quy cách hiện có trong catalog. Các câu hỏi về tồn kho, bảo hành và đổi trả được chuyển sang kênh liên hệ. Bấm **Câu hỏi mới** để xóa ngữ cảnh đang giữ trong phiên. Dữ liệu này chỉ nằm trong bộ nhớ của tab.

Các mốc trong bản yêu cầu rộng hơn gồm đồng bộ WaterCrawl, tìm kiếm vector, quản trị tri thức có phân quyền và phân tích hội thoại. Bản triển khai hiện tại dùng catalog phiên bản hóa theo Git và mạng quan hệ chủ đề trong Worker. Cập nhật chủ đề hoặc quan hệ qua thay đổi mã và chạy kiểm thử trước khi triển khai.

## Triển khai trên Workers Free

Cloudflare Workers AI cấp 10.000 Neurons mỗi ngày trên Workers Free theo tài liệu tại thời điểm triển khai. Khi vượt hạn mức, yêu cầu thất bại. Giữ tài khoản ở gói Free để tránh tính tiền vượt hạn mức. Worker dùng AI binding của tài khoản, giới hạn yêu cầu theo IP và không cần khóa API ở trình duyệt. [Bảng hạn mức Cloudflare](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [Mô hình Qwen](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/)

1. Đăng nhập tài khoản Cloudflare dùng cho website bằng `npx --yes wrangler@4 login`. Xác nhận bằng `npx --yes wrangler@4 whoami`.
2. Từ gốc repository chạy `npx --yes wrangler@4 deploy --config paint-rag/wrangler.jsonc`. Giữ `SITE_ORIGIN` trùng chính xác với trang công khai.
3. Đặt URL HTTPS của Worker kèm `/ask` vào thẻ `stb-paint-rag` trong `index.html`. Thêm **origin chính xác** của Worker vào `connect-src` của CSP rồi triển khai landing page. Để trống thẻ này để tắt gửi câu hỏi ra ngoài.
4. Thử gửi một câu có nguồn, chẳng hạn “Mặt tiền cũ bị phấn hóa thì làm gì?”. Kiểm tra nguồn đi kèm, sau đó thử lại khi tắt Worker để xác nhận hướng dẫn cục bộ vẫn dùng được.

Chỉ đưa tài liệu được phép công khai vào tệp dữ liệu. Worker nhận câu hỏi hiện tại và có thể nhận thêm mã chủ đề kỹ thuật ở lượt trước để hiểu câu hỏi nối tiếp. Lịch sử chat, diện tích, ngân sách đã lưu và dữ liệu báo giá không được gửi kèm. Trình duyệt chuyển các câu hỏi có dấu hiệu thông tin liên hệ hoặc yêu cầu kiểm tra đơn sang kênh hỗ trợ. Worker kiểm tra lại trước khi gọi Qwen. Giới hạn theo IP của Cloudflare là tương đối theo từng điểm mạng; hạn mức Free của nhà cung cấp là giới hạn chi phí cho mô hình.

Chạy `node tests/paint-rag.mjs` để kiểm tra API bằng binding giả lập. Chạy `npx --yes wrangler@4 deploy --dry-run --config paint-rag/wrangler.jsonc` để kiểm tra đóng gói mà không xuất bản.
