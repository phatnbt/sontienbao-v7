# Bảo mật Landing Page Sơn Tiến Bảo

## Ranh giới hệ thống

Đây là website tĩnh trên GitHub Pages. Mã HTML, JavaScript, hình ảnh và dữ liệu trong repository có thể được xem công khai. Không đặt mật khẩu, GitHub token, thông tin khách hàng hay khóa API vào source, ảnh, file JSON hoặc lịch sử commit.

Admin Center dùng mật khẩu cục bộ để khóa giao diện trên thiết bị. **GitHub mới là nơi kiểm tra quyền ghi.** Token chỉ giữ trong bộ nhớ của trang Admin đang mở và mất khi tải lại; bản token từng lưu trong vault cũ được xóa khi Admin tải. Đăng nhập bằng mật khẩu cục bộ không cấp quyền sửa GitHub nếu chưa nhập token.

Trang public chỉ tải mã JavaScript cùng origin và mã Google Analytics khi cấu hình GA4 hợp lệ. Chatbot Railway đang tắt. Chính sách CSP giới hạn nơi tải mã, ảnh và kết nối. Ảnh tải qua Admin phải là PNG, JPEG, WebP hoặc GIF có nội dung khớp loại file, tối đa 8 MB; tên file được tạo ngẫu nhiên.

Form báo giá bản public chỉ soạn nội dung để khách chủ động gửi qua email hoặc Zalo; không ghi thông tin khách vào repository. Bản xem trước trên localhost có thể lưu yêu cầu thử nghiệm trên trình duyệt cục bộ.

## Việc cần hoàn tất trên tài khoản và tên miền

1. Bật xác thực hai bước hoặc passkey cho tài khoản GitHub quản lý repository.
2. Dùng fine-grained personal access token chỉ cho `phatnbt/sontienbao-v7`, quyền `Contents: Read and write`, với ngày hết hạn. Thu hồi token cũ nếu từng nhập trên thiết bị không tin cậy.
3. Khi DNS của `landing.nguyenbaolam.com` hoạt động, kiểm tra chứng chỉ và bật **Enforce HTTPS** tại Settings → Pages. Xác minh tên miền trong GitHub Pages nếu có quyền quản lý DNS.
4. Website gốc `nguyenbaolam.com` và backend `sontienbao.com` là hệ thống riêng, cần được kiểm tra bảo mật tại nơi đang lưu trữ chúng.

Tài liệu: [GitHub token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), [xác minh tên miền](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), [OWASP CSP](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).
