# Sơn Tiến Bảo V7 — GitHub Pages Preview

## Trạng thái
- Đây là bản frontend preview dành cho GitHub Pages.
- `#admin` và `admin.html` chuyển thẳng tới `https://sontienbao.com/admin`.
- Form báo giá trên site public chuyển tới `https://sontienbao.com/lien-he.html`; không lưu lead giả trong browser.
- Preview được đặt `noindex,nofollow` để tránh trùng SEO với website chính.

## GitHub Pages
1. Repository public: `sontienbao-v7`.
2. Upload toàn bộ NỘI DUNG thư mục này vào root của branch `main`.
3. Repository Settings → Pages → Build and deployment → Source = Deploy from a branch.
4. Branch = `main`, folder = `/(root)`, Save.
5. URL tạm dự kiến: `https://phatnbt.github.io/sontienbao-v7/`.

## Sau khi URL tạm hoạt động
Cấu hình custom domain `new.sontienbao.com` trong GitHub Pages rồi mới thêm CNAME DNS tại nơi quản lý DNS của sontienbao.com.

## Không được làm
- Không đổi DNS của `sontienbao.com` root trong giai đoạn test.
- Không đặt V7 GitHub Pages làm backend/admin. iTop vẫn là backend/admin thật.
