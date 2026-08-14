#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'app.js'

text = APP.read_text(encoding='utf-8')

replacements = {
    "if(p.technicalSource==='iTop')return 'iTop đồng bộ';": "if(p.technicalSource==='iTop')return 'Dữ liệu sản phẩm';",
    "if(p.technicalSource==='hybrid')return 'Dung tích iTop • độ phủ V7';": "if(p.technicalSource==='hybrid')return 'Quy cách & độ phủ';",
    "if(p.technicalSource==='iTop-variants')return 'Dung tích iTop';": "if(p.technicalSource==='iTop-variants')return 'Quy cách sản phẩm';",
    "return 'Cấu hình kỹ thuật V7';": "return 'Thông số sản phẩm';",
    "Bạn đã đổi primer thủ công; kết quả vẫn tính theo thông số của lựa chọn hiện tại.": "Bạn đã đổi sơn lót; kết quả vẫn tính theo thông số của lựa chọn hiện tại.",
    "Hệ thống tự ưu tiên primer tương thích với sơn phủ": "Hệ thống tự ưu tiên sơn lót tương thích với sơn phủ",
    "Chưa đồng bộ được sơn lót '+this.surfaceLabel().toLowerCase()+' có đủ độ phủ, dung tích và giá từ iTop.": "Chưa có đủ thông tin về sơn lót '+this.surfaceLabel().toLowerCase()+' để tính chính xác.",
    "Chưa có sản phẩm sơn phủ '+this.surfaceLabel().toLowerCase()+' đủ dữ liệu kỹ thuật để tính. iTop cần có độ phủ và quy cách dung tích rõ ràng.": "Chưa có đủ thông tin kỹ thuật của sơn phủ '+this.surfaceLabel().toLowerCase()+' để tính chính xác.",
    "Chỉ cộng các thùng có giá đúng dung tích từ dữ liệu iTop.": "Chi phí được ước tính theo giá và quy cách sản phẩm hiện có.",
    "Ghép hệ sơn là gợi ý hỗ trợ mua hàng dựa trên tên dòng, khu vực sử dụng và dữ liệu iTop; không được xem là khuyến nghị kỹ thuật chính thức của Jotun. Báo giá và tư vấn Tiến Bảo là bước xác nhận cuối cùng.": "Kết quả là ước tính hỗ trợ chọn mua dựa trên diện tích, khu vực sử dụng, quy cách và thông tin sản phẩm hiện có. Để chọn hệ sơn phù hợp nhất với bề mặt thực tế, vui lòng liên hệ Tiến Bảo để được tư vấn và xác nhận báo giá.",
    "Chọn Nội thất hoặc Ngoại thất trước. V7 lọc sản phẩm phù hợp, tự ghép primer với sơn phủ cùng dòng khi có thể, rồi tính lượng sơn, số thùng và chi phí theo dữ liệu iTop.": "Chọn Nội thất hoặc Ngoại thất trước. Hệ thống sẽ lọc sản phẩm phù hợp, gợi ý sơn lót và sơn phủ tương thích, sau đó ước tính lượng sơn, số thùng và chi phí theo thông tin sản phẩm hiện có."
}

changed = 0
for old, new in replacements.items():
    if old in text:
        text = text.replace(old, new)
        changed += 1

if changed:
    APP.write_text(text, encoding='utf-8')
    print(f'Sanitized {changed} public-facing calculator strings.')
else:
    print('Public calculator copy already sanitized; no changes needed.')
