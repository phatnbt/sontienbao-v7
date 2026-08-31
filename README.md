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
