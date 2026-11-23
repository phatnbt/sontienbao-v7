(function () {
  'use strict';
  var h = React.createElement;

  function text(value) {
    var result = String(value || '').toLowerCase();
    if (result.normalize) result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return result.replace(/đ/g, 'd');
  }
  function money(value) {
    return Number(value) > 0 ? Number(value).toLocaleString('vi-VN') + 'đ' : 'Liên hệ';
  }
  function unitOf(product) {
    return product.measureUnit === 'Kg' || /kg/i.test(product.unit || '') ? 'Kg' : 'L';
  }
  function isFinish(product) {
    if (product.calculatorRole !== 'finish' && !/son dau|rubylast|terratop|terracoat pro/.test(text(product.name || ''))) return false;
    var label = text((product.name || '') + ' ' + (product.category || ''));
    return !/son lot|primer|bot tret|bot ba|dung cu|keo ba|putty|skimcoat|handycoat|terramix|filler|patching/.test(label);
  }
  var COMPARISON_PROFILES = [
    { match: /essence de lau chui/, fit: 'Tường nội thất cần lau chùi thường xuyên', strengths: ['Dễ lau chùi', 'Nhẹ mùi, VOC thấp', 'Bề mặt mờ'], note: 'Hệ tham khảo của hãng gồm một lớp Essence Sơn Lót Chống Kiềm và hai lớp Essence Dễ Lau Chùi.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/essence-easy-clean' },
    { match: /essence trang tran chuyen dung/, fit: 'Trần nội thất cần lớp phủ trắng mờ, dễ thi công', strengths: ['Hạn chế văng bắn khi sơn', 'Độ trắng và độ che phủ tốt', 'Mùi nhẹ, VOC thấp'], note: 'Sản phẩm được thiết kế cho bề mặt trần.', source: 'https://www.jotun.com/vn-en/decorative/products/interior/all-interior-products/essence-easy-ceiling-vn' },
    { match: /jotaplast/, fit: 'Tường nội thất cần lớp phủ mờ với chi phí hợp lý', strengths: ['Dễ thi công', 'Chống nấm mốc', 'Che phủ khuyết điểm bề mặt'], note: 'Dùng cho tường nội thất; cần xử lý vết nứt hoặc ẩm trước khi sơn.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/jotaplast' },
    { match: /majestic dep nguyen ban/, fit: 'Không gian cần bề mặt siêu mờ, màu trung thực', strengths: ['Siêu mờ, không phản quang', 'Dễ lau chùi', 'Kháng khuẩn, chống nấm mốc'], note: 'Chọn khi bề mặt siêu mờ là ưu tiên chính.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-pure-color' },
    { match: /majestic bong sang trong/, fit: 'Tường nội thất cần bề mặt bóng, láng mịn', strengths: ['Bề mặt bóng, siêu láng mịn', 'Dễ lau chùi', 'Siêu nhẹ mùi'], note: 'Cần chọn đúng bề mặt bóng theo mẫu thực tế.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-sense' },
    { match: /majestic dep hoan hao.*bong/, fit: 'Tường nội thất cần bề mặt bóng, màu sắc sống động', strengths: ['Bề mặt nhẵn mịn', 'Dễ lau chùi', 'Kháng khuẩn và chống nấm mốc'], note: 'Là dòng hoàn thiện bóng; đối chiếu độ bóng với mẫu trước khi chọn.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-true-beauty-sheen' },
    { match: /majestic dep hoan hao.*mo/, fit: 'Tường nội thất cần bề mặt mờ, màu bền đẹp', strengths: ['Bề mặt nhẵn mịn', 'Dễ lau chùi', 'Kháng khuẩn và chống nấm mốc'], note: 'Là dòng hoàn thiện mờ; đối chiếu với bản bóng nếu cần lau chùi thường xuyên.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/majestic-true-beauty-matt' },
    { match: /jotashield ben mau toan dien/, fit: 'Mặt tiền cần giữ màu và hạn chế bám bụi', strengths: ['Bền màu', 'Chống bám bụi', 'Dễ thi công'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /jotashield sach vuot troi/, fit: 'Ngoại thất dễ bám bụi và vệt nước', strengths: ['Chống bám bụi', 'Ngăn vệt bẩn', 'Tự làm sạch khi mưa'], note: 'Tính năng tự làm sạch phụ thuộc điều kiện mưa thực tế.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-ultra-clean' },
    { match: /jotashield chong phai mau/, fit: 'Mặt tiền ưu tiên màu sắc bền lâu', strengths: ['Chống phai màu', 'Giảm nhiệt', 'Ngăn vệt nước'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotashield-antifade-colours' },
    { match: /jotashield che phu vet nut/, fit: 'Tường ngoại thất có vết nứt nhỏ', strengths: ['Che phủ vết nứt', 'Chống thấm', 'Kháng tia cực tím'], note: 'Cần kiểm tra tình trạng vết nứt trước khi chọn hệ sơn.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /tough shield max/, fit: 'Ngoại thất cần chống rong rêu, nấm mốc', strengths: ['Kháng tia cực tím', 'Chống rong rêu, nấm mốc', 'Che phủ tốt'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /tough shield/, exclude: /primer/, fit: 'Ngoại thất cần bảo vệ trước thời tiết', strengths: ['Bền với thời tiết', 'Chống rong rêu, nấm mốc', 'Chống bong tróc'], note: 'Dòng sơn phủ cho tường ngoại thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products' },
    { match: /waterguard/, fit: 'Tường ngoại thất thường chịu mưa', strengths: ['Chống thấm nước', 'Che phủ vết nứt', 'Chống nấm mốc'], note: 'Kiểm tra tình trạng thấm và bề mặt trước khi thi công.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotun-waterguard' },
    { match: /flexipave.*(?:texture|textured)/, fit: 'Sân thể thao cần bề mặt sần', strengths: ['Lớp phủ acrylic chịu thời tiết', 'Chống thấm', 'Bản Textured có cát tạo nhám'], note: 'Cần tính theo hệ Flexipave; định mức lớp trung gian và hoàn thiện khác nhau.', source: 'https://www.terraco.com/vn/products/flexipave-coating/' },
    { match: /flexipave.*smooth/, fit: 'Sân thể thao cần bề mặt láng', strengths: ['Lớp phủ acrylic chịu thời tiết', 'Chống thấm', 'Bản Smooth dùng làm lớp phủ láng'], note: 'Cần tính theo hệ Flexipave; định mức lớp trung gian và hoàn thiện khác nhau.', source: 'https://www.terraco.com/vn/products/flexipave-coating/' },
    { match: /matex sac mau diu mat/, fit: 'Nội thất cần bề mặt mờ, dễ dặm vá', strengths: ['Màng sơn phẳng mịn', 'Kháng nấm mốc', 'Mùi nhẹ, VOC thấp'], note: 'Hệ đề nghị có lớp lót trước hai lớp sơn phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/nippon-paint-matex-sac-mau-diu-mat' },
    { match: /(?:np |nippon )matex/, exclude: /super matex|sup+er white|sealer/, fit: 'Nội thất cần màng sơn mịn, độ che phủ cao', strengths: ['Độ che phủ cao', 'Màng sơn phẳng mịn', 'Chống rêu, mốc'], note: 'Cần đối chiếu đúng biến thể và hệ sơn lót trước khi thi công.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-matex' },
    { match: /^np easy wash \(/, fit: 'Tường nội thất cần lau chùi vết bẩn thường xuyên', strengths: ['Dễ lau chùi', 'Bề mặt mịn', 'Mùi nhẹ, VOC thấp'], note: 'Hệ đề nghị có sơn lót Easy Wash Sealer trước hai lớp phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/nippon-paint-easy-wash' },
    { match: /^np odour.?less bong sang trong/, fit: 'Tường nội thất cần bề mặt bóng và dễ lau chùi', strengths: ['Dễ chùi rửa', 'Bề mặt bóng, láng mịn', 'Kháng khuẩn'], note: 'Hệ đề nghị có sơn lót Odour-less Sealer trước hai lớp phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-odour-less-bong-sang-trong' },
    { match: /^np super matex \(/, fit: 'Tường ngoại thất cần lớp phủ dễ sử dụng, chống rêu mốc', strengths: ['Chống rêu, mốc', 'Độ che phủ cao', 'Chịu được thời tiết'], note: 'Hãng đề nghị dùng sơn lót ngoại thất phù hợp trước hai lớp phủ.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/son-ngoai-that-super-matex' },
    { match: /^weathergard plus moi \(/, fit: 'Mặt tiền cần giảm bám bụi và chịu mưa nắng', strengths: ['Chống bám bụi', 'Ngăn nước thấm từ bên ngoài', 'Bền màu'], note: 'Hệ đề nghị có WeatherGard Sealer trước hai lớp phủ.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/nippon-paint-weathergard-plus' },
    { match: /^weathergard hitex \(/, fit: 'Ngoại thất cần hạn chế bám bụi, bền màu', strengths: ['Chống bám bụi', 'Chống thấm từ bên ngoài', 'Độ che phủ cao'], note: 'Cần kiểm tra nền và dùng hệ sơn lót theo hướng dẫn của hãng.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/son-nippon-weathergard-hitex' },
    { match: /^weathergard sieu bong \(/, fit: 'Ngoại thất cần bề mặt bóng và chống thấm từ bên ngoài', strengths: ['Độ bóng cao', 'Chống thấm từ bên ngoài', 'Chống rêu, mốc'], note: 'Đối chiếu độ bóng thực tế và hệ sơn lót trước khi thi công.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/son-nippon-weathergard-sieu-bong' },
    { match: /^np trang tran toan dien/, fit: 'Trần nhà cần bề mặt trắng mờ, dễ thi công', strengths: ['Ít văng bắn', 'Chống rêu, nấm mốc', 'Độ che phủ cao'], note: 'Dòng chuyên dùng cho trần; kiểm tra bề mặt trước khi bỏ qua lớp lót.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-trang-tran-toan-dien' },
    { match: /odour.?less.*(?:crvt|chui rua vuot troi)/, fit: 'Nội thất cần chùi rửa thường xuyên', strengths: ['Dễ chùi rửa', 'Ít bám bẩn', 'Mùi nhẹ'], note: 'Cần xác nhận đúng phiên bản có tính năng kháng khuẩn nếu đây là ưu tiên.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-odour-less-chui-rua-vuot-troi' },
    { match: /spot.?less[\s-]*plus/, fit: 'Nội thất ưu tiên chống bám bẩn', strengths: ['Chống bám bẩn sinh hoạt', 'Công nghệ ion bạc', 'Dễ chùi rửa'], note: 'Cần xác nhận đúng sản phẩm Spot-less Plus khi chọn mua.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/nippon-paint-spot-less-plus' },
    { match: /odour.?less.*spot.?less/, fit: 'Nội thất dễ dính vết bẩn sinh hoạt', strengths: ['Chống bám bẩn', 'Dễ chùi rửa', 'Mùi nhẹ, VOC thấp'], note: 'Hệ đề nghị có lớp lót trước hai lớp sơn phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-odour-less-spot-less' },
    { match: /gardex premium gloss/, fit: 'Bề mặt gỗ và kim loại nội, ngoại thất cần sơn bóng', strengths: ['Sơn phủ bóng cho gỗ, kim loại', 'Nhẹ mùi', 'Nhanh khô'], note: 'Không dùng định mức sơn tường để dự toán gỗ hoặc kim loại.', source: 'https://www.jotun.com/vn-vi/products-and-services/products/gardex-premium-gloss' },
    { match: /jotashield primer/, fit: 'Lớp lót cho hệ sơn ngoại thất Jotashield', strengths: ['Kháng kiềm', 'Tăng bám dính lớp phủ', 'Hạn chế hơi ẩm từ nền'], note: 'Là sơn lót, không thay thế lớp phủ hoàn thiện.', source: 'https://www.jotun.com/vn-vi/products-and-services/products/jotashield-primer' },
    { match: /tough shield primer/, fit: 'Lớp lót cho hệ sơn ngoại thất Tough Shield', strengths: ['Bám dính giữa tường và lớp sơn phủ', 'Chống kiềm hóa'], note: 'Đây là sơn lót; hãng hướng dẫn một lớp trước sơn phủ.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotun-tough-shield-primer' },
    { match: /majestic primer/, fit: 'Lớp lót cho hệ sơn nội thất Majestic', strengths: ['Sơn lót chống kiềm gốc nước', 'Dùng cho nền tường xây nội thất'], note: 'Là sơn lót; cần chọn lớp phủ Majestic phù hợp.', source: 'https://www.jotun.com/vn-vi/products-and-services/products/majestic-primer' },
    { match: /alkyd primer/, fit: 'Lớp lót alkyd trên thép hoặc gỗ', strengths: ['Sơn lót alkyd một thành phần', 'Có màu đỏ và xám'], note: 'Xác nhận đúng hệ sơn và chuẩn bị nền trước khi thi công.', source: 'https://www.jotun.com/vn-en/products-and-services/products/Alkydprimer' },
    { match: /wp 200 plus/, fit: 'Tường đứng ngoại thất cần lớp chống thấm có màu', strengths: ['Chống thấm từ phía thi công', 'Không cần pha xi măng'], note: 'Đối chiếu đúng mã WP 200 Plus; không dùng thay sản phẩm cho sàn.', source: 'https://nipponpaint.com.vn/vi/hoa-chat-chong-tham/nippon-paint-wp-200-plus' },
    { match: /wp 200/, fit: 'Tường đứng ngoại thất cần lớp chống thấm có màu', strengths: ['Chống thấm nước', 'Chống kiềm và rêu mốc', 'Không cần pha xi măng'], note: 'Đối chiếu màu và độ dày lớp sơn theo tài liệu WP 200.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/son-chong-tham-wp-200' },
    { match: /wp ?100/, fit: 'Bề mặt ngang cần lớp chống thấm pha xi măng', strengths: ['Ngăn thấm từ trên xuống', 'Có thể dùng cho bề mặt thẳng đứng từ phía thi công'], note: 'Tài liệu hãng mô tả WP 100 White; xác nhận phiên bản trong catalog trước khi mua.', source: 'https://nipponpaint.com.vn/vi/hoa-chat-chong-tham/wp-100-white-chong-tham' },
    { match: /supergard/, fit: 'Tường ngoại thất cần lớp phủ mờ', strengths: ['Chịu thời tiết', 'Chống rêu mốc', 'Độ che phủ cao'], note: 'Hãng đề nghị sơn lót WeatherGard Sealer trước lớp phủ.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/son-ngoai-that-supergard' },
    { match: /(?:np )?vatex/, fit: 'Tường nội thất cần lớp phủ mờ kinh tế', strengths: ['Độ che phủ cao', 'Dễ sử dụng', 'Chống rêu mốc'], note: 'Hãng đề nghị sơn lót Matex Sealer trước lớp phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-nippon-vatex' },
    { match: /matex sup+er white/, fit: 'Tường hoặc trần nội thất cần màu trắng sáng', strengths: ['Màu trắng sáng', 'Độ che phủ tốt', 'Ít văng bắn'], note: 'Tên catalog ghi “Supper White”; trang hãng ghi “Super White”. Xác nhận nhãn bao bì.', source: 'https://nipponpaint.com.vn/en/interior-paint/nippon-paint-matex-super-white' },
    { match: /matex sealer/, fit: 'Lớp lót nội thất trước hệ sơn Matex', strengths: ['Chống kiềm hóa', 'Tăng bám dính lớp phủ', 'Khô nhanh'], note: 'Là sơn lót gốc nước, không dùng như sơn phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-lot-noi-that-matex-sealer' },
    { match: /(?:son dau nippon )?tilac/, exclude: /primer/, fit: 'Gỗ hoặc kim loại cần sơn dầu alkyd', strengths: ['Sơn phủ alkyd một thành phần', 'Dùng cho gỗ và kim loại nội, ngoại thất'], note: 'Mã màu và độ bóng khác nhau; xem đúng biến thể trên trang bán hàng.', source: 'https://nipponpaint.com.vn/vi/son-dan-dung/son-nippon-tilac' },
    { match: /terraseal/, fit: 'Khu vực ẩm cần hệ chống thấm hai thành phần', strengths: ['Hệ chống thấm gốc xi măng và acrylic', 'Dùng cho bề mặt bê tông, vữa'], note: 'Cần thi công đúng tỷ lệ trộn, số lớp và nền theo tài liệu hãng.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/TERRASEAL-VN.pdf' },
    { match: /weathercoat ultra/, fit: 'Mái và khu vực ẩm cần chống thấm hai thành phần', strengths: ['Hệ hai thành phần', 'Đàn hồi, che phủ vết nứt nhỏ'], note: 'Lượng dùng phải tính theo hệ chống thấm, không theo công thức sơn tường.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/WEATHERCOAT-Ultra-VN.pdf' },
    { match: /weathercoat gp/, fit: 'Mái, khu vực ẩm và cấu trúc giữ nước', strengths: ['Hệ chống thấm hai thành phần', 'Dùng được cho nhiều hạng mục chống thấm'], note: 'Xác nhận nền và quy trình trộn trước khi thi công.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/WEATHERCOAT-GP-VN.pdf' },
    { match: /flexicoat 1105f/, fit: 'Sàn cần lớp chống thấm trộn xi măng', strengths: ['Chống thấm gốc acrylic trộn xi măng', 'Dòng chuyên dụng cho sàn'], note: 'Chọn đúng dòng 1105F cho sàn, không thay bằng 1105 dùng cho tường.', source: 'https://www.terraco.com/vn/solutions/giai-phap-chong-tham/' },
    { match: /flexicoat 1105/, fit: 'Tường cần lớp chống thấm trộn xi măng', strengths: ['Chống thấm', 'Bám dính trên nền phù hợp', 'Kháng tia UV'], note: 'Phải trộn và thi công đúng tỷ lệ, số lớp của hãng.', source: 'https://www.terraco.com/vn/products/flexicoat-1105-chong-tham-1-thanh-phan/' },
    { match: /flexicoat thermo/, fit: 'Mái cần lớp phủ chống thấm và hạn chế hấp thụ nhiệt', strengths: ['Chống thấm mái', 'Phản xạ nhiệt'], note: 'Hiệu quả giảm nhiệt phụ thuộc cấu tạo mái và điều kiện thực tế.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXICOAT-THERMO-VN.pdf' },
    { match: /flexicoat w100/, fit: 'Mái hoặc mặt tiền cần lớp chống thấm co giãn', strengths: ['Chống thấm', 'Co giãn', 'Chịu thời tiết'], note: 'Xử lý vết nứt và vệ sinh nền trước khi thi công.', source: 'https://www.terraco.com/vn/products/flexicoat-w100-chong-tham-1-thanh-phan/' },
    { match: /flexicoat decor/, fit: 'Tường ngoài cần sơn chống thấm hoàn thiện màu', strengths: ['Chống thấm', 'Chịu thời tiết', 'Có thể pha màu'], note: 'Thi công theo hệ lót và lớp phủ được hãng hướng dẫn.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXICOAT-DECOR-VN-V12-2025.pdf' },
    { match: /flexipave cushion coat/, fit: 'Lớp đệm cho hệ sân thể thao', strengths: ['Lớp đệm cao su cho hệ sân Flexipave', 'Có biến thể hạt thô và hạt mịn'], note: 'BC và FC là các lớp khác nhau; không so trực tiếp như hai loại sơn phủ.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-CUSHION-COAT-VN-v2025.pdf' },
    { match: /flexipave line paint/, fit: 'Sơn kẻ vạch sân thể thao', strengths: ['Chuyên dùng kẻ vạch sân', 'Bám dính trên hệ sân phù hợp'], note: 'Chỉ dùng cho vạch sân, không thay lớp phủ toàn sân.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-LINE-PAINT-VN-V02-2025.pdf' },
    { match: /flexipave resurfacer/, fit: 'Xử lý bề mặt trước hệ sơn sân thể thao', strengths: ['Làm phẳng khuyết điểm nhỏ trên nền sân', 'Dùng trên nền bê tông hoặc asphalt phù hợp'], note: 'Là lớp chuẩn bị bề mặt; định mức tùy tình trạng nền.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-RESURFACER-VN-V2.2025.pdf' },
    { match: /terracoat pro smooth/, fit: 'Tường cần bề mặt vân gai mịn', strengths: ['Bề mặt vân mịn', 'Lớp phủ acrylic trộn sẵn'], note: 'Định mức phụ thuộc độ dày và cách tạo vân.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/TERRACOAT-PRO-SMOOTH-VN-v2-2026.pdf' },
    { match: /terracoat pro excel/, fit: 'Mặt dựng cần hiệu ứng vân gai thi công bằng bay', strengths: ['Lớp phủ acrylic trộn sẵn', 'Tạo vân bằng bay'], note: 'Cần dùng đúng hệ nền và lớp lót Terracoat.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/TERRACOAT-PRO-EXCEL-VN-v2-2026.pdf' },
    { match: /terralast/, fit: 'Tường nội thất cần lớp phủ mờ', strengths: ['Bề mặt mờ', 'Độ phủ cao'], note: 'Sửa khuyết điểm và kiểm tra nền trước khi sơn.', source: 'https://www.terraco.com/vn/products/terralast/' },
    { match: /terramatt/, fit: 'Tường và trần nội thất cần lớp phủ mờ', strengths: ['Bề mặt mờ', 'Có thể lau rửa'], note: 'Hãng hướng dẫn 2–3 lớp; kiểm tra nền trước khi sơn.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/TERRAMATT-VN-1.pdf' },
    { match: /terratop/, fit: 'Tường nội thất cần lớp phủ có thể lau rửa', strengths: ['Lớp phủ nội thất', 'Có thể lau rửa'], note: 'Dùng theo hướng dẫn hệ lót của hãng.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/TERRATOP-VN.pdf' },
    { match: /maxilux/, fit: 'Bề mặt nội hoặc ngoại thất cần lớp phủ mờ', strengths: ['Sơn acrylic mờ', 'Bám dính trên nền phù hợp'], note: 'Hãng mô tả nhiều loại nền; xác nhận hệ lót cho nền thực tế.', source: 'https://www.terraco.com/vn/products/maxilux/' },
    { match: /terrashield/, fit: 'Tường ngoại thất cần lớp phủ mờ chịu thời tiết', strengths: ['Chịu thời tiết', 'Chống rêu mốc', 'Bề mặt mờ'], note: 'Nền cũ hoặc xốp cần chuẩn bị theo hướng dẫn riêng của hãng.', source: 'https://www.terraco.com/vn/products/terrashield/' },
    { match: /terrashine super/, fit: 'Ngoại thất cần lớp phủ bóng cao', strengths: ['Lớp phủ ngoại thất bóng', 'Dùng trên hệ phủ Terraco phù hợp'], note: 'Kiểm tra lớp nền và lớp lót của hệ trước khi sử dụng.', source: 'https://www.terraco.com/vn/products/terrashine-super/' },
    { match: /terracoat pro granule/, fit: 'Mặt dựng cần bề mặt hạt 1 hoặc 2 mm', strengths: ['Lớp phủ acrylic trộn sẵn', 'Bề mặt hạt trang trí'], note: 'Chọn đúng cỡ hạt và định mức theo cấu tạo hệ.', source: 'https://www.terraco.com/vn/products/terracoat-pro-granule/' },
    { match: /terralite stone/, fit: 'Mặt dựng cần hiệu ứng đá tự nhiên', strengths: ['Lớp phủ có cốt liệu đá tự nhiên', 'Hiệu ứng bề mặt đá'], note: 'Hãng hướng dẫn phủ Terracoat Topcoat Plus sau khi khô.', source: 'https://www.terraco.com/vn/products/terralite-stone/' },
    { match: /ruby water.*proof 300/, sourceType: 'retailer', fit: 'Tường cần lớp chống thấm gốc acrylic', strengths: ['Vật liệu chống thấm gốc polymer', 'Theo mô tả cửa hàng: kháng nước và bền kiềm'], note: 'Chưa tìm được tài liệu kỹ thuật Ruby độc lập để kiểm tra các chỉ tiêu.', source: 'https://sontienbao.com/san-pham/son-ruby/son-chong-tham-ruby/chong-tham-ruby-water-proof-300-17l.html' },
    { match: /ruby wp.?11a/, sourceType: 'retailer', fit: 'Bề mặt cần lớp chống thấm pha xi măng', strengths: ['Vật liệu chống thấm gốc polymer', 'Mô tả cửa hàng yêu cầu pha xi măng'], note: 'Chưa tìm được tài liệu kỹ thuật Ruby độc lập; cần xác nhận tỷ lệ trộn.', source: 'https://sontienbao.com/san-pham/son-ruby/son-chong-tham-ruby/chong-tham-ruby-wp-11a-1kg.html' },
    { match: /rubylux ben dep/, sourceType: 'retailer', fit: 'Tường ngoại thất cần lớp phủ màu', strengths: ['Theo mô tả cửa hàng: kháng tia cực tím', 'Chống rong rêu và nấm mốc', 'Độ che phủ tốt'], note: 'Base A/B/C/White là nền pha màu; màu thành phẩm và giá có thể khác nhau. Chưa có tài liệu hãng độc lập.', source: 'https://sontienbao.com/san-pham/son-ruby/son-ngoai-that-ruby/rubylux-ben-dep-base-a-son-ngoai-that-cao-cap.html' },
    { match: /rubyroof/, sourceType: 'retailer', fit: 'Sàn cần lớp chống thấm pha xi măng', strengths: ['Vật liệu chống thấm gốc polymer', 'Mô tả cửa hàng yêu cầu pha xi măng'], note: 'Chưa có tài liệu hãng độc lập; cần xác nhận hệ sàn và tỷ lệ trộn.', source: 'https://sontienbao.com/san-pham/son-ruby/son-chong-tham-ruby/rubyroof-chong-tham-san-pha-xi-mang.html' },
    { match: /rubytus/, sourceType: 'retailer', fit: 'Tường ngoại thất cần lớp phủ mờ', strengths: ['Theo mô tả cửa hàng: bề mặt mờ', 'Độ phủ cao', 'Dễ sử dụng'], note: 'Bản PP ghi Rubytus C.Max; cần xác nhận đúng mã khi đặt hàng. Chưa có tài liệu hãng độc lập.', source: 'https://sontienbao.com/san-pham/son-ruby/son-ngoai-that-ruby/rubytus-base-a-5l-son-ngoai-that.html' },
    { match: /rubylast.*base/, sourceType: 'retailer', fit: 'Tường nội thất cần lớp phủ mờ', strengths: ['Theo mô tả cửa hàng: bề mặt mờ', 'Dễ sử dụng'], note: 'Chưa có tài liệu hãng độc lập; trang bán hàng khuyên dùng Ruby Sealer làm lớp lót.', source: 'https://sontienbao.com/san-pham/son-ruby/son-noi-that-ruby/son-rubylast-trong-base-a-5l.html' },
    { match: /ruby sealer/, sourceType: 'retailer', fit: 'Lớp lót cho hệ sơn tường Ruby', strengths: ['Theo mô tả cửa hàng: lót chống kiềm', 'Bề mặt mờ'], note: 'Là lớp lót, không dùng như sơn phủ. Chưa có tài liệu hãng độc lập.', source: 'https://sontienbao.com/san-pham/son-ruby/ruby-bot-tret-matit-deot-son-lot/son-lot-chong-kiem-ruby-sealer-17l.html' },
    { match: /essence primer/, fit: 'Lớp lót cho tường xây trước lớp phủ Essence', strengths: ['Kháng kiềm', 'Bám dính tốt', 'Dễ thi công'], note: 'Catalog ghi Essence Primer; trang hãng gọi Essence Easy Primer. Cần xác nhận tên trên bao bì.', source: 'https://www.jotun.com/vn-en/decorative/products/exterior/all-exterior-products/essence-easy-primer' },
    { match: /putty.*(?:in\b|int\b)/, exclude: /ext/, fit: 'Làm phẳng nền tường nội thất', strengths: ['Lấp lỗ và khuyết điểm nhỏ', 'Dùng trước hệ sơn phủ'], note: 'Bột trét không phải lớp phủ; định mức phụ thuộc độ dày bả.', source: 'https://www.jotun.com/api/v1/datasheets/download/merged?selectedFiles=4600' },
    { match: /putty ext/, fit: 'Làm phẳng nền tường ngoại thất', strengths: ['Lấp lỗ và khuyết điểm bề mặt', 'Dùng trước hệ sơn bảo vệ'], note: 'Bột trét không phải lớp phủ; định mức phụ thuộc độ dày bả.', source: 'https://www.jotun.com/api-b2b/v1/datasheets/download/merged?selectedFiles=4597' },
    { match: /ultra primer/, fit: 'Lớp lót cho nền bê tông mới', strengths: ['Tăng bám dính lớp phủ', 'Hạn chế muối hóa và loang màu'], note: 'Hãng có điều kiện độ ẩm và pH cho nền bê tông mới; cần kiểm tra tại công trình.', source: 'https://www.jotun.com/vn-vi/decorative/products/exterior/all-exterior-products/jotun-ultra-primer' },
    { match: /easy wash sealer/, fit: 'Lớp lót nội thất trước hệ Easy Wash', strengths: ['Chống kiềm', 'Độ bám dính tốt', 'Hỗ trợ lớp phủ Easy Wash'], note: 'Là sơn lót; hãng đề nghị một lớp trước sơn phủ.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-lot-noi-that-easy-wash' },
    { match: /hitex 5180 sealer/, fit: 'Lớp lót gốc dầu cho tường ngoại thất', strengths: ['Chống kiềm', 'Bám dính trên nền', 'Hạn chế vết ố tái xuất hiện'], note: 'Dùng dung môi phù hợp theo chỉ dẫn của hãng.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/nippon-paint-hitex-5180-sealer' },
    { match: /odour.?less sealer/, fit: 'Lớp lót nội thất cho hệ Odour-less', strengths: ['Sơn lót gốc nước', 'Hạn chế phai màu lớp phủ do kiềm nền'], note: 'Là sơn lót, không thay lớp phủ hoàn thiện.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-lot-noi-that-odour-less-sealer' },
    { match: /super.?matex sealer/, fit: 'Lớp lót cho tường ngoại thất', strengths: ['Chống kiềm', 'Hạn chế phai màu do muối hóa', 'Bám dính tốt'], note: 'Là lớp lót, cần sơn phủ ngoại thất phù hợp.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/son-lot-ngoai-that-super-matex-sealer' },
    { match: /weathergard sealer/, fit: 'Lớp lót cho hệ sơn ngoại thất WeatherGard', strengths: ['Chống kiềm và muối hóa', 'Tăng bám dính lớp phủ'], note: 'Là lớp lót; tham khảo điều kiện nền và lớp phủ trong tài liệu hãng.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/son-lot-ngoai-that-weathergard-sealer' },
    { match: /tilac grey primer/, fit: 'Lớp lót chống rỉ màu xám cho kim loại chứa sắt', strengths: ['Sơn lót alkyd', 'Dùng trong điều kiện ăn mòn nhẹ'], note: 'Cần làm sạch gỉ, bụi và dầu trước khi thi công.', source: 'https://nipponpaint.com.vn/vi/son-dan-dung/son-tilac-grey-primer' },
    { match: /tilac red oxide primer/, fit: 'Lớp lót chống rỉ nâu đỏ cho kim loại chứa sắt', strengths: ['Sơn lót alkyd', 'Dùng trong điều kiện ăn mòn nhẹ'], note: 'Cần làm sạch gỉ, bụi và dầu trước khi thi công.', source: 'https://nipponpaint.com.vn/vi/son-dan-dung/tilac-red-oxide-primer' },
    { match: /skimcoat interior/, fit: 'Làm phẳng tường nội thất', strengths: ['Vá khuyết điểm nhỏ', 'Làm phẳng nền trước sơn'], note: 'Bột trét không phải sơn phủ; cần xác nhận đúng định mức theo độ dày.', source: 'https://professional.nipponpaint.com.vn/vi/giai-phap-son-trang-tri/bot-tret-noi-that-interior-skimcoat' },
    { match: /(?:weatherbond|weathergard) skimcoat/, fit: 'Làm phẳng tường ngoại thất', strengths: ['Vá vết nứt chân chim nhỏ', 'Làm mịn nền xây'], note: 'Catalog ghi Weatherbond Skimcoat, trang hãng ghi WeatherGard Skimcoat; cần xác nhận bao bì trước khi áp dụng thông số.', source: 'https://nipponpaint.com.vn/vi/son-ngoai-that/skimcoat-weathergard' },
    { match: /p\.?\s*primer plus.*textures?/, sourceType: 'manufacturerArchive', fit: 'Lót nền xây trước lớp phủ vân Terracoat', strengths: ['Kháng kiềm', 'Tăng bám dính', 'Lớp lót trung gian có màu'], note: 'Tên catalog ghi “Textures”; TDS hãng ghi “Textured”. Xác nhận nhãn bao bì.', source: 'https://thacosil.com/datafiles/34793/upload/files/tai-lieu/p-primer-plus-textured-tds.pdf' },
    { match: /p\.?\s*primer plus.*clear/, sourceType: 'manufacturerArchive', fit: 'Lót nền xi măng, vữa hoặc bê tông trước lớp phủ', strengths: ['Thẩm thấu nền xốp', 'Kháng kiềm', 'Tăng bám dính'], note: 'TDS hãng dùng tên “Penetrating Primer Plus Clear”; xác nhận mã và nhãn bao bì của P Primer Plus Clear.', source: 'https://thacosil.com/datafiles/34793/upload/files/tai-lieu/penetrating-primer-plus-clear-tds.pdf' },
    { match: /p\.?\s*primer.*pigmented/, fit: 'Lớp lót có màu cho hệ phủ trang trí', strengths: ['Có thể pha màu theo lớp hoàn thiện', 'Tăng bám dính', 'Giảm muối hóa nền'], note: 'Dùng đúng màu và hệ sơn phủ được hãng hướng dẫn.', source: 'https://www.terraco.com/products/p-primer-pigmented/' },
    { match: /p\.?\s*primer/, fit: 'Lớp lót cho nền xi măng, vữa hoặc bê tông', strengths: ['Thẩm thấu bề mặt xốp', 'Liên kết nền cho lớp hoàn thiện'], note: 'Trang hãng mô tả bản Clear và White; kiểm tra đúng màu và quy cách.', source: 'https://www.terraco.com/vn/products/p-primer/' },
    { match: /penetrating primer.*clear/, sourceType: 'manufacturerArchive', fit: 'Lót nền xi măng, vữa hoặc bê tông cũ trước lớp phủ', strengths: ['Thẩm thấu nền xốp hoặc có bụi phấn', 'Liên kết bề mặt với nền'], note: 'Bản Clear trong suốt; TDS Terraco ghi quy cách 4 kg và 18 kg.', source: 'https://thacosil.com/datafiles/34793/upload/files/tai-lieu/penetrating-primer-clear-tds.pdf' },
    { match: /penetrating primer.*white/, sourceType: 'manufacturerArchive', fit: 'Lót nền xi măng, vữa hoặc bê tông cũ trước lớp phủ', strengths: ['Thẩm thấu nền xốp hoặc có bụi phấn', 'Liên kết bề mặt với nền'], note: 'Bản White màu trắng; TDS Terraco ghi quy cách 5 kg và 20 kg.', source: 'https://thacosil.com/datafiles/34793/upload/files/tai-lieu/penetrating-primer-white-tds.pdf' },
    { match: /handycoat exterior coarse/, fit: 'Bả và sửa nền ngoại thất cần lớp trét dày', strengths: ['Keo bả trộn sẵn', 'Có cốt liệu cho sửa nền'], note: 'Cần kiểm tra độ dày và thời gian khô theo tài liệu.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/HANDYCOAT-EXTERIOR-COARSE-VN-1.pdf' },
    { match: /handycoat exterior/, fit: 'Làm phẳng tường ngoại thất trước sơn', strengths: ['Keo bả trộn sẵn', 'Làm phẳng nền trước lớp phủ'], note: 'Không thay thế sơn phủ hoặc hệ chống thấm.', source: 'https://www.terraco.com/vn/products/keo-ba-ngoai-that-handycoat-exterior/' },
    { match: /handycoat interior/, fit: 'Làm phẳng tường nội thất trước sơn', strengths: ['Keo bả trộn sẵn', 'Sửa khuyết điểm nhỏ trên nền'], note: 'Không thay thế sơn lót hoặc lớp phủ.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/HANDYCOAT-INTERIOR-VN.pdf' },
    { match: /flexipave filler/, fit: 'Trám khuyết điểm nhỏ trên nền sân', strengths: ['Chất trám gốc acrylic', 'Chuẩn bị nền trước lớp Flexipave'], note: 'Định mức phụ thuộc tình trạng nền; không tính theo hai lớp sơn tường.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-FILLER-VN-v012025.pdf' },
    { match: /flexipave concrete primer plus/, sourceType: 'manufacturerArchive', fit: 'Lớp lót cho nền khó bám dính trước hệ sân', strengths: ['Tăng bám dính trên bê tông đặc, kim loại và gốm', 'Dùng trước hệ Flexipave trên nền phù hợp'], note: 'TDS hãng trong bản lưu yêu cầu thi công lớp mỏng, không pha loãng trên nền đặc chắc.', source: 'https://thacosil.com/datafiles/34793/upload/files/tai-lieu/flexipave-concrete-primer-plus-tds.pdf' },
    { match: /flexipave concrete primer/, exclude: /plus/, fit: 'Lớp lót nền bê tông cho hệ sân', strengths: ['Tăng bám dính trên nền bê tông', 'Dùng trước hệ Flexipave'], note: 'Bản Plus là mã khác; cần xác nhận tài liệu riêng.', source: 'https://www.terraco.com/vn/wp-content/uploads/2026/06/FLEXIPAVE-CONCRETE-PRIMER-VN-v2025.pdf' },
    { match: /flexipave patching compound/, fit: 'Trám sửa nền sân trước hệ Flexipave', strengths: ['Hệ acrylic và xi măng hai thành phần', 'Sửa khuyết điểm trên nền bê tông hoặc asphalt'], note: 'Cần trộn đúng bộ và kiểm tra độ dày sửa chữa.', source: 'https://www.terraco.com/vn/products/flexipave-patching-compound/' },
    { match: /terracoat pro classic/, fit: 'Mặt dựng cần lớp phủ vân gai thô', strengths: ['Lớp phủ acrylic trộn sẵn', 'Thi công bằng phun hoặc con lăn'], note: 'Định mức phụ thuộc độ dày lớp vân và phương pháp thi công.', source: 'https://www.terraco.com/vn/products/terracoat-pro-classic/' },
    { match: /terracoat pro craft/, fit: 'Mặt dựng cần lớp phủ vân gai đa dạng', strengths: ['Lớp phủ acrylic trộn sẵn', 'Có thể tạo vân bằng phun hoặc con lăn'], note: 'Cần chọn cách tạo vân và hệ nền trước khi tính vật tư.', source: 'https://www.terraco.com/vn/products/terracoat-pro-craft/' },
    { match: /terracoat topcoat plus/, fit: 'Lớp phủ trong cho hệ Terralite Stone', strengths: ['Lớp phủ trong suốt sau lớp đá Terralite Stone'], note: 'Trang hãng chỉ xác nhận vai trò trong hệ Terralite Stone; chưa có định mức độc lập.', source: 'https://www.terraco.com/vn/products/terralite-stone/' },
    { match: /odour.?less sieu bong/, fit: 'Tường nội thất cần bề mặt bóng cao', strengths: ['Độ bóng cao', 'Mùi rất nhẹ', 'VOC thấp'], note: 'Trang bán hàng ghi đây là All-in-1 Siêu Bóng; xác nhận nhãn bao bì trước khi mua.', source: 'https://nipponpaint.com.vn/vi/son-noi-that/son-odour-less-all-1-sieu-bong' },
    { match: /putty int.*ext/, sourceType: 'retailer', fit: 'Làm phẳng nền tường nội và ngoại thất', strengths: ['Theo mô tả cửa hàng: lấp lỗ nhỏ, làm phẳng nền'], note: 'Chưa có tài liệu Jotun khớp chính xác tên Putty Int & Ext; không suy định mức từ sản phẩm khác.', source: 'https://sontienbao.com/son-jotun-nauy/bot-tret-jotun/jotun-putty-in-ex-40kg-bot-tret-noi-ngoai-that.html' },
    { match: /^son phu chong tham flexicoat/, fit: 'Mái cần lớp phủ chống thấm acrylic', strengths: ['Chống thấm và chịu thời tiết', 'Lớp phủ liền mạch, co giãn'], note: 'Đây là Flexicoat nguyên bản; không dùng thông số của Flexicoat 1105, Decor hay W100.', source: 'https://www.terraco.com/products/flexicoat/' },
    { match: /terramix super interior/, sourceType: 'manufacturerArchive', fit: 'Bả và làm phẳng nền nội thất', strengths: ['Lấp vết nứt nhỏ, khuyết điểm nền', 'Tạo bề mặt phẳng trước sơn'], note: 'Thi công theo độ dày và lượng nước trong TDS; không tính như sơn phủ.', source: 'https://tdus.com.vn/wp-content/uploads/2023/05/TERRAMIX-SUPER-INT-VN.pdf' },
    { match: /terramix supper ex/, sourceType: 'manufacturerArchive', fit: 'Bả và làm phẳng nền ngoại thất', strengths: ['Lấp vết nứt nhỏ, khuyết điểm nền', 'Tạo bề mặt phẳng trước sơn'], note: 'Bản lưu TDS hãng ghi 1,0–1,4 kg/m² cho mỗi lớp dày 1 mm, khác số catalog; cần xác nhận lô hàng trước khi dự toán.', source: 'https://tdus.com.vn/wp-content/uploads/2023/05/TERRAMIX-SUPER-EXT-VN.pdf' }
  ];
  function comparisonProfile(product) {
    var name = text(product.name || '');
    if (/rubycoat|rubylast.*white/.test(name)) return null; // Tên trong mô tả bán hàng không khớp tên catalog.
    return COMPARISON_PROFILES.find(function (profile) { return profile.match.test(name) && (!profile.exclude || !profile.exclude.test(name)); }) || null;
  }
  function comparisonPurpose(product) {
    var label = text((product.name || '') + ' ' + (product.category || ''));
    if (/bot tret|bot ba|putty|skimcoat|handycoat|terramix|keo ba/.test(label)) return 'Bột trét / xử lý nền';
    if (/son lot|primer/.test(label)) return 'Sơn lót';
    if (/\bgo\b|kim loai|son dau|gardex|tilac/.test(label)) return 'Gỗ / kim loại';
    if (/son san|diamond coat|diamond seal/.test(label)) return 'Sàn';
    if (/san the thao|flexipave|san tennis/.test(label)) return 'Sân thể thao';
    if (/tran chuyen dung|trang tran|son tran/.test(label)) return 'Trần nội thất';
    if (/chong tham|waterguard|waterproof/.test(label)) return 'Chống thấm';
    if (/ngoai that|ngoai troi|jotashield|tough shield/.test(label)) return 'Tường ngoại thất';
    if (/noi that|trong nha|majestic|essence/.test(label)) return 'Tường nội thất';
    return product.category || 'Cần xác nhận khu vực dùng';
  }
  function comparisonSource(url, label) {
    return url ? h('a', { className: 'shop-compare-source', href: url, target: '_blank', rel: 'noopener noreferrer' }, label + ' ↗') : h('span', { className: 'shop-compare-unverified' }, 'Chưa có nguồn đối chiếu');
  }
  function comparisonMissingNote(product) {
    var name = text(product.name || '');
    if (/rubycoat/.test(name)) return 'Tên catalog là RUBYCOAT nhưng mô tả bán hàng ghi RUBYCOAST; cần xác nhận mã hàng.';
    if (/rubylast.*white/.test(name)) return 'Tên catalog là Rubylast nhưng mô tả bán hàng ghi Rubyplast; cần xác nhận mã hàng.';
    if (/diamond coat|diamond seal/.test(name)) return 'Các trang Diamond Coat/Seal có mô tả lẫn tên sản phẩm; cần TDS hoặc ảnh nhãn đúng mã.';
    if (/terralite topcoat/.test(name)) return 'Mô tả bán hàng ghi Terracoat Topcoat Plus; cần xác nhận đây có phải cùng sản phẩm.';
    return 'Chưa có tài liệu khớp chính xác mã sản phẩm; cần xác nhận trước khi thi công.';
  }
  var WALL_CONDITIONS = {
    normal: { label: 'Tường đang tốt', advice: 'Làm sạch bề mặt, kiểm tra độ khô và dùng hệ sơn lót, sơn phủ phù hợp.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/huong-dan-cach-son-tuong-nha-cu-thay-ao-moi-cho-ngoi-nha-cua-ban' },
    new: { label: 'Tường mới xây', advice: 'Chờ tường đủ khô, kiểm tra độ ẩm và dùng sơn lót phù hợp trước khi sơn phủ.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/tam-quan-trong-cua-do-am-tuong-khi-son-nha-do-am-tuong-bao-nhieu-thi-son-duoc' },
    mold: { label: 'Ẩm mốc', advice: 'Tìm và xử lý nguồn ẩm, làm sạch nấm mốc, để tường khô rồi mới sơn lót và sơn phủ. Sơn kháng mốc không thay thế bước xử lý ẩm.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/huong-dan-cach-son-tuong-nha-cu-thay-ao-moi-cho-ngoi-nha-cua-ban' },
    seepage: { label: 'Thấm nước', advice: 'Xác định nước đến từ đâu, xử lý nguồn thấm và kiểm tra mặt tường có thể thi công. Chỉ chọn hệ chống thấm sau khi xác định hướng nước thấm và tình trạng nền.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/tuong-bi-tham-nuoc' },
    peeling: { label: 'Bong tróc', advice: 'Cạo bỏ lớp sơn bong, xử lý nguyên nhân ẩm nếu có, làm sạch và sơn lót trước lớp phủ mới.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/huong-dan-cach-son-tuong-nha-cu-thay-ao-moi-cho-ngoi-nha-cua-ban' },
    stains: { label: 'Dễ bám bẩn', advice: 'Với tường đã khô và ổn định, cân nhắc lớp phủ dễ lau chùi hoặc chống bám bẩn theo khu vực sử dụng.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/essence-easy-clean' },
    chalk: { label: 'Phấn hóa, sờ ra bột', advice: 'Làm sạch bột phấn và lớp sơn bám yếu. Nếu có tinh thể trắng hoặc vệt ẩm, kiểm tra nguyên nhân thấm trước khi chọn lót.', source: 'https://www.sherwin-williams.com/architects-specifiers-designers/commercial-wallpaper-floorcovering/resources/SW-ARTICLE-PRO-CHALKINGPOWDER' },
    salt: { label: 'Muối trắng kết tinh', advice: 'Kiểm tra nguồn ẩm, làm sạch cặn và chờ nền đủ khô. Nếu muối xuất hiện lại, cần xử lý đường nước trước khi phủ.', source: 'https://www.sherwin-williams.com/property-facility-managers/interior-aerosols/resources/faqs/interior-troubleshooting-faqs' },
    cracks: { label: 'Tường bị nứt', advice: 'Xác định độ rộng, nước trong khe và vết nứt có phát triển hay không. Khe nứt ướt hoặc còn chuyển động cần kiểm tra tại chỗ trước khi chọn vật liệu.', source: 'https://vnm.sika.com/vi/serp.list.html/knowledge-hub/how-to-select-injection-material-to-seal-leaks.html' },
    colorChange: { label: 'Đổi màu tường cũ', advice: 'Kiểm tra độ bám và thử hệ lót, phủ trên một mảng nhỏ. Khi chuyển từ nền đậm sang màu sáng, xác nhận số lớp sau khi mẫu khô.', source: 'https://www.jotun.com/vn-vi/decorative/colours/colour-charts/interior' }
  };
  function matchesSurface(product, surface) {
    var explicit = product.calculatorSurface;
    var label = text((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || ''));
    if (surface === 'ceiling') return comparisonPurpose(product) === 'Trần nội thất';
    if (surface === 'interior' && comparisonPurpose(product) === 'Trần nội thất') return false;
    if (surface === 'sport') return explicit === 'sport' || /san the thao|flexipave|san tennis/.test(label);
    if (surface === 'waterproof') return /chong tham|waterguard|waterproof/.test(label);
    if (explicit === surface || explicit === 'both') return true;
    if (explicit && explicit !== 'other') return false;
    if (surface === 'interior') return /noi that|trong nha|majestic|essence/.test(label);
    return /ngoai that|ngoai troi|jotashield|tough shield/.test(label);
  }
  function estimate(product, area) {
    var application = text((product.name || '') + ' ' + (product.category || ''));
    if ((product.calculatorRole && product.calculatorRole !== 'finish') || product.calculatorSurface === 'sport' ||
        /flexipave|flexicoat|terraseal|weathercoat|rubyroof|wp.?200|wp.?100|chong tham|waterguard|waterproof|san the thao|son san|son dau|terracoat|terralite|topcoat/.test(application)) return null; // Những hệ này cần định mức thi công riêng.
    if (product.massOnly || (product.measureUnit && unitOf(product) !== product.measureUnit) ||
        (product.packageUnit && product.measureUnit && product.packageUnit !== product.measureUnit) ||
        (product.coverageBasis && product.coverageBasis !== 'm2_per_unit')) return null;
    var coverage = Number(product.coverage || 0);
    if (!(coverage > 0) || !(Number(area) > 0)) return null;
    var unit = unitOf(product);
    var coverageLabel = text(product.coverageLabel || '');
    if ((unit === 'Kg' && /m²\s*\/\s*l|m2\s*\/\s*l/.test(coverageLabel)) ||
        (unit === 'L' && /m²\s*\/\s*kg|m2\s*\/\s*kg/.test(coverageLabel))) return null;
    var quantity = Number(area) * 2 / coverage * 1.1;
    var prices = product.priceBySize && typeof product.priceBySize === 'object' ? product.priceBySize : {};
    var options = Object.keys(prices).map(function (size) {
      var pack = Number(size), price = Number(prices[size]);
      return pack > 0 && price > 0 ? { size: pack, count: Math.ceil(quantity / pack), price: price } : null;
    }).filter(Boolean);
    if (!options.length && Number(product.price) > 0) {
      var reference = Number(product.priceReferenceSize || (product.variants || [])[0] || 0);
      if (reference > 0) options.push({ size: reference, count: Math.ceil(quantity / reference), price: Number(product.price) });
    }
    options.sort(function (a, b) { return a.count * a.price - b.count * b.price; });
    var best = options[0] || null;
    return {
      quantity: Math.round(quantity * 10) / 10,
      unit: unit,
      packs: best ? best.count + ' × ' + best.size + unit : 'Cần xác nhận quy cách',
      cost: best ? best.count * best.price : 0
    };
  }
  var PAINT_PRIORITIES = {
    washable: { label: 'Dễ lau chùi', evidence: /de lau chui|de chui rua|chong bam ban|tu lam sach/ },
    odor: { label: 'Nhẹ mùi', evidence: /nhe mui|mui nhe|mui rat nhe|mui thap|it mui/ },
    matte: { label: 'Bề mặt mờ', evidence: /\b(sieu mo|be mat mo|manh son mo|mang son mo|phu mo)\b/ },
    weather: { label: 'Chịu mưa nắng', evidence: /chiu thoi tiet|ben voi thoi tiet|khang tia cuc tim|chong phai mau/ }
  };
  function priorityEvidence(profile, priority) {
    return profile && PAINT_PRIORITIES[priority] && profile.strengths.find(function (point) {
      return PAINT_PRIORITIES[priority].evidence.test(text(point));
    });
  }
  function score(product, condition, priority) {
    var label = text((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || ''));
    var profile = comparisonProfile(product);
    var strengths = text(profile ? profile.strengths.join(' ') : '');
    var value = product.image ? 8 : 0;
    if (priorityEvidence(profile, priority)) value += 40;
    if (Number(product.coverage) > 0) value += 12;
    if (condition === 'mold' && /chong nam moc|chong rong reu|khang nam moc/.test(strengths)) value += 30;
    if (condition === 'seepage' && /chong tham/.test(strengths)) value += 30;
    if (condition === 'stains' && /de lau chui|de chui rua|chong bam ban|tu lam sach/.test(strengths)) value += 30;
    if (condition === 'seepage' && /waterguard|chong tham/.test(label)) value += 8;
    if (product.featured) value += 4;
    return value;
  }
  function estimateContext(products, area, surface, condition) {
    var items = products.map(function (product) {
      var planned = estimate(product, area);
      return {
        id: product.id,
        name: product.name,
        quantity: planned ? planned.quantity : 0,
        unit: planned ? planned.unit : unitOf(product),
        packs: planned ? planned.packs : '',
        cost: planned ? planned.cost : 0
      };
    });
    return {
      source: 'bo-chon-son',
      surface: { interior: 'Nội thất', exterior: 'Ngoại thất', ceiling: 'Trần nội thất', sport: 'Sân thể thao', waterproof: 'Chống thấm' }[surface] || 'Cần xác nhận khu vực',
      condition: surface === 'sport' ? '' : (WALL_CONDITIONS[condition] || WALL_CONDITIONS.normal).label,
      area: Number(area) > 0 ? Number(area) : null,
      waste: items.some(function (item) { return item.quantity > 0; }) ? 10 : null,
      items: items,
      total: items.length === 1 ? items[0].cost : 0
    };
  }
  function estimateText(context) {
    var lines = ['YÊU CẦU TƯ VẤN SƠN TIẾN BẢO'];
    var alternatives = context.source === 'bo-chon-son' && (context.items || []).length > 1;
    if (context.surface) lines.push('Khu vực: ' + context.surface);
    if (context.condition) lines.push('Tình trạng tường: ' + context.condition);
    if (context.area) lines.push('Diện tích: ' + context.area + ' m²');
    if (context.waste != null) lines.push('Hao hụt dự kiến: ' + context.waste + '%');
    if (alternatives) lines.push('Vui lòng báo giá riêng cho từng lựa chọn:');
    (context.items || []).forEach(function (item, index) {
      var quantity = item.quantity ? item.quantity + ' ' + item.unit : 'cần xác nhận lượng';
      var packs = item.packs ? ', ' + item.packs : '';
      var price = alternatives && item.cost > 0 ? ' · Tham khảo: ' + money(item.cost) : '';
      lines.push((index + 1) + '. ' + item.name + ' — ' + quantity + packs + price);
    });
    if (!alternatives) lines.push('Chi phí vật tư tham khảo: ' + (Number(context.total) > 0 ? money(context.total) : 'cần báo giá'));
    lines.push('Vui lòng xác nhận sản phẩm, quy cách, giá và giao hàng.');
    return lines.join('\n');
  }
  class EmailDraft extends React.Component {
    constructor(props) { super(props); this.state = { status: '' }; this.field = null; }
    copy() {
      var self = this, value = this.props.message;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { self.setState({ status: 'Đã sao chép nội dung email.' }); }).catch(function () { self.fallbackCopy(); });
      } else this.fallbackCopy();
    }
    fallbackCopy() {
      if (!this.field) return;
      this.field.select();
      try {
        this.setState({ status: document.execCommand('copy') ? 'Đã sao chép nội dung email.' : 'Hãy chọn và sao chép nội dung bên dưới.' });
      } catch (error) { this.setState({ status: 'Hãy chọn và sao chép nội dung bên dưới.' }); }
    }
    render() {
      var self = this, site = this.props.site || {}, recipient = site.email || 'ctytienbao@gmail.com';
      var subject = 'Yêu cầu báo giá Sơn Tiến Bảo', message = this.props.message || '';
      var query = 'to=' + encodeURIComponent(recipient) + '&subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
      var gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(recipient) + '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(message);
      var outlook = 'https://outlook.live.com/mail/0/deeplink/compose?' + query;
      var mail = 'mailto:' + recipient + '?' + query.replace(/^to=[^&]+&/, '');
      return h('div', { className: 'email-draft', 'aria-label': 'Nội dung email báo giá' },
        h('strong', null, 'Email gửi tới ' + recipient),
        h('p', null, 'Chọn webmail hoặc ứng dụng email, kiểm tra nội dung rồi bấm Gửi. Nếu cửa sổ không mở, hãy sao chép nội dung và dán vào email của bạn.'),
        h('textarea', { readOnly: true, value: message, rows: 6, 'aria-label': 'Nội dung email để sao chép', ref: function (node) { self.field = node; } }),
        h('div', { className: 'email-draft-actions' },
          h('a', { href: gmail, target: '_blank', rel: 'noopener noreferrer' }, 'Mở Gmail ↗'),
          h('a', { href: outlook, target: '_blank', rel: 'noopener noreferrer' }, 'Mở Outlook ↗'),
          h('a', { href: mail }, 'Ứng dụng email'),
          h('button', { type: 'button', onClick: function () { self.copy(); } }, 'Sao chép nội dung')
        ),
        this.state.status && h('small', { role: 'status' }, this.state.status)
      );
    }
  }

  var projectExamples = ['Sơn phòng khách 60 m² dễ lau chùi', 'Sơn phòng cho bé, ưu tiên ít mùi', 'Tường ngoài bị thấm nước'];
  var extraProjectExamples = [
    'Tường nội thất mới tô 50 m²', 'Mặt tiền cũ bị phấn hóa', 'Tường ngoài có muối trắng',
    'Tường ngoài bị nứt chân chim', 'Đổi màu tường nội thất từ đậm sang sáng',
    'Sơn trần trắng 30 m²', 'Sơn lại sân pickleball', 'Chống thấm sân thượng'
  ];

  var SURFACE_EXAMPLES = {
    interior: [
      'phòng cho bé', 'phòng của con', 'phòng em bé', 'phòng trẻ nhỏ',
      'tường hành lang', 'vách cầu thang', 'phòng làm việc', 'tường căn hộ',
      'trong phòng', 'trần phòng', 'phòng sinh hoạt'
    ],
    exterior: [
      'tường hứng mưa', 'tường đón nắng', 'mặt ngoài ngôi nhà', 'tường bao sân',
      'vách ban công', 'sơn hàng rào bê tông', 'tường cổng nhà', 'mảng tường phơi nắng',
      'tường tiếp xúc mưa', 'vách ngoài nhà', 'tường sân trước'
    ],
    sport: [
      'sân cầu lông', 'sân bóng chuyền', 'sân bóng rổ', 'sân bóng ném',
      'sân tập luyện', 'kẻ vạch sân thi đấu', 'sân chơi tennis', 'sân chơi pickleball',
      'mặt sân thi đấu', 'sân tập thể dục', 'mặt sân cầu lông'
    ]
  };
  function wordPairs(phrase) {
    var words = text(phrase).match(/[a-z]+/g) || [];
    return words.slice(1).map(function (word, index) { return words[index] + ' ' + word; });
  }
  var surfaceModel;
  function predictSurface(phrase) {
    if (!surfaceModel) {
      var vocabulary = new Set();
      var classes = Object.keys(SURFACE_EXAMPLES).map(function (surface) {
        var counts = new Map();
        var total = 0;
        SURFACE_EXAMPLES[surface].forEach(function (example) {
          wordPairs(example).forEach(function (pair) {
            vocabulary.add(pair);
            counts.set(pair, (counts.get(pair) || 0) + 1);
            total++;
          });
        });
        return { surface: surface, counts: counts, total: total };
      });
      surfaceModel = { classes: classes, vocabulary: vocabulary };
    }
    var features = Array.from(new Set(wordPairs(phrase))).filter(function (pair) {
      return surfaceModel.vocabulary.has(pair);
    });
    if (features.length < 2) return '';
    var ranked = surfaceModel.classes.map(function (entry) {
      // Multinomial Naive Bayes with uniform class priors and Laplace smoothing.
      var denominator = entry.total + surfaceModel.vocabulary.size;
      var evidence = features.filter(function (pair) { return entry.counts.has(pair); }).length;
      var likelihood = features.reduce(function (sum, pair) {
        return sum + Math.log(((entry.counts.get(pair) || 0) + 1) / denominator);
      }, 0);
      return { surface: entry.surface, likelihood: likelihood, evidence: evidence };
    }).sort(function (a, b) { return b.likelihood - a.likelihood; });
    return ranked[0].evidence >= 2 && !ranked[1].evidence && ranked[0].likelihood - ranked[1].likelihood >= 0.8 ? ranked[0].surface : '';
  }

  function readProject(description) {
    var phrase = text(description);
    if (/\b(khong|chua|ngoai tru)\b/.test(phrase)) {
      return { message: 'Mô tả khu vực và tình trạng hiện tại, hoặc chọn trực tiếp trong bộ lọc bên dưới.' };
    }
    if (/\b(mai ton|san thuong|nha tam|nha ve sinh|be nuoc|ho boi|son go|cua go|sat thep|kim loai|san epoxy)\b/.test(phrase)) {
      return { message: 'Bề mặt này cần hệ sơn chuyên dụng. Mở trợ lý để xem hướng dẫn theo đúng bề mặt hoặc hỏi Tiến Bảo.' };
    }
    var ceiling = /\b(tran nha|son tran|tran trang|tran thach cao)\b/.test(phrase);
    var surfaces = [
      ['ceiling', /\b(tran nha|son tran|tran trang|tran thach cao)\b/],
      ['interior', ceiling ? /\btuong noi that\b/ : /\b(noi that|trong nha|phong khach|phong ngu|phong bep)\b/],
      ['exterior', /\b(ngoai that|ngoai troi|mat tien|tuong ngoai)\b/],
      ['sport', /\b(san the thao|san tennis|san pickleball|san bong ro)\b/]
    ].filter(function (entry) { return entry[1].test(phrase); });
    var seepage = /\b(chong tham|tham nuoc|tuong bi tham)\b/.test(phrase);
    var predicted = surfaces.length ? '' : predictSurface(phrase);
    if (surfaces.length > 1 || (seepage && (predicted === 'sport' || surfaces.some(function (entry) { return entry[0] === 'sport'; })))) {
      return { message: 'Mỗi lần hãy mô tả một khu vực. Bạn cũng có thể chọn khu vực trực tiếp bên dưới.' };
    }
    if (!seepage && !surfaces.length && !predicted) {
      return { message: 'Chưa nhận ra khu vực. Hãy thêm “nội thất”, “mặt tiền”, “chống thấm” hoặc “sân thể thao”.' };
    }
    var surface = seepage ? 'waterproof' : predicted || surfaces[0][0];
    var conditions = [
      ['salt', /\b(muoi hoa|muoi trang|tinh the trang)\b/],
      ['cracks', /\b(nut chan chim|vet nut|bi nut|tuong nut)\b/],
      ['chalk', /\b(phan hoa|bot phan|so ra bot)\b/],
      ['mold', /\b(am moc|nam moc|rong reu)\b/],
      ['peeling', /\b(bong troc|troc son|phong rop)\b/],
      ['new', /\b(tuong moi|moi xay|moi to|moi trat)\b/],
      ['colorChange', /\b(doi mau|dam sang sang|doi mau tuong)\b/],
      ['stains', /\b(lau chui|chui rua|bam ban)\b/]
    ];
    var found = conditions.find(function (entry) { return entry[1].test(phrase); });
    var condition = seepage ? 'seepage' : surface !== 'sport' && found ? found[0] : 'normal';
    var area = readChatFacts(description).area;
    var priority = [
      ['washable', /\b(lau chui|chui rua|bam ban)\b/],
      ['odor', /\b(it mui|nhe mui|mui nhe)\b/],
      ['matte', /\b(sieu mo|be mat mo|son mo)\b/],
      ['weather', /\b(chiu mua nang|chiu thoi tiet|ben mau)\b/]
    ].find(function (entry) { return entry[1].test(phrase); });
    return {
      surface: surface, condition: condition, area: area >= 1 && area <= 100000 ? area : '',
      priority: priority && surface !== 'sport' && surface !== 'waterproof' ? priority[0] : '',
      predicted: Boolean(predicted && !seepage)
    };
  }

  class ShopAssistant extends React.Component {
    constructor(props) {
      super(props);
      this.state = { surface: 'interior', condition: 'normal', priority: '', area: 100, brand: 'all', query: '', limit: 24, selected: null, project: '', projectStatus: '' };
    }
    applyProject(description) {
      var result = readProject(description);
      if (result.message) {
        this.setState({ project: description, projectStatus: result.message, projectNeedsHelp: true, selected: [] });
        return;
      }
      this.setState({
        project: description, surface: result.surface, condition: result.condition, priority: result.priority,
        area: result.area, brand: 'all', query: '', limit: 24, selected: null, projectNeedsHelp: false,
        projectStatus: (result.predicted ? 'Mô hình đã gợi ý khu vực. Bạn có thể sửa bộ lọc bên dưới. ' : 'Đã cập nhật bộ lọc. ') +
          (result.area ? 'Kiểm tra diện tích bề mặt trước khi dùng dự toán.' : 'Nhập diện tích bề mặt để xem lượng và chi phí dự kiến.')
      });
    }
    candidates() {
      var state = this.state;
      var query = text(state.query).trim();
      if (state.projectNeedsHelp && !query) return [];
      var products = (this.props.products || []).filter(function (product) {
        return product.enabled !== false && (state.brand === 'all' || product.brand === state.brand);
      });
      if (query) return searchCatalog(products, query).map(function (result) { return result.product; });
      return products.filter(function (product) {
        return isFinish(product) && matchesSurface(product, state.surface);
      }).map(function (product) {
        return { product: product, score: score(product, state.condition, state.priority) };
      }).sort(function (a, b) { return b.score - a.score; }).map(function (entry) { return entry.product; });
    }
    choose(id) {
      var state = this.state;
      var current = state.selected ? state.selected.slice() : this.candidates().slice(0, 2).map(function (product) { return product.id; });
      var index = current.indexOf(id);
      if (index >= 0) current.splice(index, 1);
      else if (current.length < 3) current.push(id);
      this.setState({ selected: current });
    }
    render() {
      var self = this, props = this.props, state = this.state;
      var brands = Array.from(new Set((props.products || []).map(function (product) { return product.brand; }).filter(Boolean))).sort();
      var query = text(state.query).trim();
      var candidates = this.candidates();
      var visible = candidates.slice(0, query ? state.limit : 6);
      var hasPriorityMatch = state.priority && candidates.some(function (product) {
        return priorityEvidence(comparisonProfile(product), state.priority);
      });
      var selectedIds = state.selected === null ? visible.slice(0, 2).map(function (product) { return product.id; }) : state.selected;
      var selected = selectedIds.map(function (id) { return (props.products || []).find(function (product) { return product.id === id; }); }).filter(Boolean);
      var comparison = estimateContext(selected, state.area, state.surface, state.condition);
      var condition = WALL_CONDITIONS[state.condition] || WALL_CONDITIONS.normal;
      var knownCosts = selected.map(function (product) { var plan = estimate(product, state.area); return plan && plan.cost || 0; }).filter(function (cost) { return cost > 0; });
      var lowestCost = knownCosts.length ? Math.min.apply(null, knownCosts) : 0;
      var highestCost = knownCosts.length ? Math.max.apply(null, knownCosts) : 0;
      var comparisonItems = selected.map(function (product) { return { product: product, plan: estimate(product, state.area), profile: comparisonProfile(product), purpose: comparisonPurpose(product) }; });
      var samePurpose = comparisonItems.every(function (item) { return item.purpose === comparisonItems[0].purpose; });
      var mixedPurpose = comparisonItems.length > 1 && !samePurpose;
      var rows = [
        { group: '01 · Mục đích & tính năng' },
        { label: 'Khu vực sử dụng', value: function (item) { return h('strong', { className: 'shop-compare-purpose' }, item.purpose); } },
        { label: 'Phù hợp khi', value: function (item) { return item.profile ? item.profile.fit : 'Chưa có nguồn đủ rõ để gợi ý công năng'; } },
        { label: 'Đặc điểm theo nguồn', value: function (item) { return item.profile ? h('div', null, item.profile.sourceType === 'retailer' && h('small', { className: 'shop-compare-unverified' }, 'Theo mô tả Tiến Bảo; chưa có tài liệu hãng'), h('ul', { className: 'shop-compare-list' }, item.profile.strengths.map(function (point) { return h('li', { key: point }, point); }))) : h('span', { className: 'shop-compare-unverified' }, 'Chưa có tài liệu tính năng đã đối chiếu'); } },
        { label: 'Lưu ý sử dụng', value: function (item) { return item.profile ? item.profile.note : comparisonMissingNote(item.product); } },
        { group: '02 · Lượng dùng & chi phí tham khảo' },
        { label: 'Độ phủ / định mức', value: function (item) { return item.plan ? (item.product.coverageLabel || item.product.coverage + ' m²/' + item.plan.unit + '/lớp') : 'Cần xác nhận định mức đúng quy cách'; } },
        { label: 'Lượng cho 2 lớp + 10% hao hụt', value: function (item) { return item.plan ? item.plan.quantity + ' ' + item.plan.unit : 'Chưa thể tính'; } },
        { label: 'Quy cách gợi ý', value: function (item) { return item.plan ? item.plan.packs : 'Cần xác nhận'; } },
        { label: 'Chi phí vật tư tham khảo', value: function (item) { return item.plan && item.plan.cost ? h('strong', { className: 'shop-compare-cost' }, money(item.plan.cost)) : 'Cần báo giá'; } },
        { label: 'So với mức thấp nhất', value: function (item) { var cost = item.plan && item.plan.cost; return !cost || knownCosts.length < 2 ? 'Chưa đủ giá để so sánh' : cost === lowestCost ? 'Mức thấp nhất trong các lựa chọn' : 'Cao hơn ' + money(cost - lowestCost); } },
        { group: '03 · Nguồn thông tin' },
        { label: 'Mức đối chiếu', value: function (item) { return !item.profile ? 'Chưa có nguồn khớp mã' : item.profile.sourceType === 'retailer' ? 'Mô tả cửa hàng, chưa có TDS hãng' : item.profile.sourceType === 'manufacturerArchive' ? 'TDS hãng lưu tại nhà phân phối' : 'Trang hoặc TDS hãng'; } },
        { label: 'Tính năng sản phẩm', value: function (item) { return comparisonSource(item.profile && (item.profile.sourceType === 'retailer' ? item.product.url : item.profile.source), item.profile && item.profile.sourceType === 'retailer' ? 'Mô tả Tiến Bảo' : item.profile && item.profile.sourceType === 'manufacturerArchive' ? 'TDS hãng (bản lưu)' : (item.product.brand || 'Hãng') + ' chính hãng'); } },
        { label: 'Định mức kỹ thuật', value: function (item) { return item.product.technicalSourceUrl ? comparisonSource(item.product.technicalSourceUrl, 'Tài liệu hãng') : item.plan ? comparisonSource(item.product.url, 'Thông tin Tiến Bảo') : 'Chưa có định mức đối chiếu'; } },
        { label: 'Giá & quy cách', value: function (item) { return comparisonSource(item.product.url, 'Trang sản phẩm Tiến Bảo'); } }
      ];
      return h('section', { className: 'shop-assistant-section', id: 'chon-son', 'aria-labelledby': 'shop-assistant-title' },
        h('div', { className: 'container' },
          h('div', { className: 'shop-assistant-heading' },
            h('h2', { id: 'shop-assistant-title' }, 'Chọn sơn theo công trình'),
            h('p', null, 'Mô tả nhu cầu hoặc chỉnh bộ lọc để xem sản phẩm, so sánh định mức và hỏi giá.')
          ),
          h('div', { className: 'project-brief' },
            h('form', { onSubmit: function (event) { event.preventDefault(); self.applyProject(state.project); } },
              h('label', { htmlFor: 'project-description' }, 'Bạn muốn sơn khu vực nào?'),
              h('div', { className: 'project-brief-input' },
                h('input', { id: 'project-description', value: state.project, required: true, maxLength: 200,
                  placeholder: 'Ví dụ: sơn mặt tiền 85 m²', onChange: function (event) { self.setState({ project: event.target.value, projectStatus: '', projectNeedsHelp: false }); } }),
                h('button', { type: 'submit', className: 'btn btn-red' }, 'Gợi ý sản phẩm')
              )
            ),
            h('div', { className: 'project-brief-examples', 'aria-label': 'Nhu cầu mẫu' }, projectExamples.map(function (example) {
              return h('button', { type: 'button', key: example, onClick: function () { self.applyProject(example); } }, example);
            })),
            h('details', { className: 'project-brief-more' },
              h('summary', null, 'Xem thêm tình huống'),
              h('div', { className: 'project-brief-examples' }, extraProjectExamples.map(function (example) {
                return h('button', { type: 'button', key: example, onClick: function () { self.applyProject(example); } }, example);
              }))
            ),
            h('p', { className: 'project-brief-status', role: 'status' }, state.projectStatus),
            state.projectNeedsHelp && h('button', { type: 'button', className: 'btn btn-outline', onClick: function () {
              window.dispatchEvent(new CustomEvent('stb:open-paint-chat', { detail: state.project }));
            } }, 'Hỏi trợ lý về tình huống này')
          ),
          h('div', { className: 'shop-assistant-controls' },
            h('label', null, 'Khu vực', h('select', { value: state.surface, onChange: function (event) { self.setState({ surface: event.target.value, condition: event.target.value === 'sport' ? 'normal' : state.condition, selected: null, projectStatus: '', projectNeedsHelp: false }); } },
              [['interior', 'Tường nội thất'], ['ceiling', 'Trần nội thất'], ['exterior', 'Ngoại thất'], ['waterproof', 'Chống thấm'], ['sport', 'Sân thể thao']].map(function (option) { return h('option', { key: option[0], value: option[0] }, option[1]); })
            )),
            h('label', null, 'Tình trạng tường', h('select', { value: state.condition, disabled: state.surface === 'sport', onChange: function (event) { var next = event.target.value; self.setState({ condition: next, surface: next === 'seepage' ? 'waterproof' : state.surface, selected: null, projectStatus: '', projectNeedsHelp: false }); } },
              Object.keys(WALL_CONDITIONS).map(function (key) { return h('option', { key: key, value: key }, WALL_CONDITIONS[key].label); })
            )),
            h('label', null, 'Diện tích bề mặt (m²)', h('input', { type: 'number', min: 1, max: 100000, step: 'any', value: state.area, onChange: function (event) { self.setState({ area: event.target.value }); } })),
            h('label', null, 'Ưu tiên', h('select', { value: state.priority, onChange: function (event) { self.setState({ priority: event.target.value, selected: null }); } },
              h('option', { value: '' }, 'Mọi tính năng'),
              Object.keys(PAINT_PRIORITIES).map(function (key) {
                return h('option', { key: key, value: key }, PAINT_PRIORITIES[key].label);
              })
            )),
            h('label', null, 'Thương hiệu', h('select', { value: state.brand, onChange: function (event) { self.setState({ brand: event.target.value, selected: null }); } },
              [h('option', { value: 'all', key: 'all' }, 'Tất cả')].concat(brands.map(function (brand) { return h('option', { key: brand, value: brand }, brand); }))
            ))
          ),
          state.surface === 'sport' ? h('p', { className: 'shop-condition-advice' }, 'Sân thể thao dùng hệ sơn riêng. Liên hệ để xác nhận kết cấu bề mặt và định mức từng lớp.') :
            h('div', { className: 'shop-condition-advice', role: 'note' },
              h('span', { className: 'shop-condition-icon', 'aria-hidden': 'true' }, '✓'),
              h('div', null, h('strong', null, condition.label === 'Tường đang tốt' ? 'Chuẩn bị bề mặt' : 'Gợi ý xử lý · ' + condition.label), h('p', null, condition.advice),
                h('a', { href: condition.source, target: '_blank', rel: 'noopener noreferrer' }, 'Xem hướng dẫn của hãng ↗'))
            ),
          h('label', { className: 'shop-product-search' }, 'Tìm trong toàn bộ catalog để so sánh',
            h('input', { type: 'search', value: state.query, placeholder: 'Nhập tên sản phẩm hoặc thương hiệu…', onChange: function (event) { self.setState({ query: event.target.value, limit: 24, selected: state.selected === null ? [] : state.selected }); } })
          ),
          state.priority && !hasPriorityMatch && h('p', { className: 'shop-evidence-note' }, 'Chưa tìm thấy tài liệu xác nhận ưu tiên này trong kết quả. Bạn có thể hỏi Tiến Bảo để kiểm tra thêm.'),
          h('p', { className: 'shop-result-count', role: 'status' }, candidates.length + ' sản phẩm ' + (query ? 'khớp tìm kiếm · Đang hiển thị ' + visible.length : 'theo khu vực · Hiển thị tối đa 6 gợi ý')),
          visible.length ? h('div', { className: 'shop-recommendations' }, visible.map(function (product) {
            var plan = estimate(product, state.area), active = selected.some(function (item) { return item.id === product.id; });
            var profile = comparisonProfile(product);
            var evidence = priorityEvidence(profile, state.priority);
            return h('article', { className: 'shop-recommendation', key: product.id },
              h('div', { className: 'shop-recommendation-image' }, product.image && h(props.Image, { src: product.image, alt: product.name, deferUntilNear: true })),
              h('div', { className: 'shop-recommendation-content' },
                h('small', null, product.brand || 'SƠN TIẾN BẢO'),
                h('h3', null, product.name),
                h('p', null, product.category || 'Sản phẩm sơn'),
                profile && h('div', { className: 'shop-product-evidence' },
                  h('p', null, profile.fit),
                  evidence && h('strong', null, evidence),
                  comparisonSource(profile.sourceType === 'retailer' ? product.url : profile.source,
                    profile.sourceType === 'retailer' ? 'Mô tả Tiến Bảo' :
                      profile.sourceType === 'manufacturerArchive' ? 'Tài liệu hãng (bản lưu)' : 'Tài liệu hãng')
                ),
                h('div', { className: 'shop-recommendation-facts' },
                  h('span', null, 'Độ phủ: ', h('b', null, plan ? (product.coverageLabel || product.coverage + ' m²/' + unitOf(product) + '/lớp') : 'cần đối chiếu hệ thi công')),
                  h('span', null, 'Vật tư dự kiến: ', h('b', null, plan ? plan.quantity + ' ' + plan.unit : 'cần xác nhận')),
                  h('span', null, 'Chi phí: ', h('b', null, plan && plan.cost ? money(plan.cost) : 'cần báo giá'))
                ),
                h('div', { className: 'shop-recommendation-actions' },
                  h('button', { type: 'button', className: active ? 'is-selected' : '', 'aria-pressed': active, onClick: function () { self.choose(product.id); } }, active ? 'Đã chọn so sánh' : 'Thêm so sánh'),
                  catalogLink(product.url) && h('a', { href: catalogLink(product.url), target: '_blank', rel: 'noopener' }, 'Xem đúng sản phẩm')
                )
              )
            );
          })) : h('div', { className: 'shop-empty' }, 'Chưa có sản phẩm khớp bộ lọc. Hãy thử khu vực hoặc thương hiệu khác.'),
          query && visible.length < candidates.length && h('button', { type: 'button', className: 'btn btn-outline shop-show-more', onClick: function () { self.setState({ limit: state.limit + 24 }); } }, 'Xem thêm sản phẩm (' + (candidates.length - visible.length) + ')'),
          selected.length > 0 && h('div', { className: 'shop-compare', 'aria-labelledby': 'shop-compare-title' },
            h('div', { className: 'shop-compare-heading' }, h('div', null, h('span', { className: 'section-kicker' }, 'SO SÁNH NHANH'), h('h3', { id: 'shop-compare-title' }, selected.length + ' sản phẩm đã chọn')), h('small', null, 'Lượng và chi phí chỉ tính khi có định mức phù hợp cho sơn tường.')),
            h('div', { className: 'shop-compare-cards' }, selected.map(function (product, index) {
              var plan = estimate(product, state.area), cost = plan && plan.cost || 0;
              return h('article', { className: 'shop-compare-card', key: product.id },
                h('div', { className: 'shop-compare-card-top' },
                  h('span', { className: 'shop-compare-number' }, String(index + 1).padStart(2, '0')),
                  cost > 0 && cost === lowestCost && knownCosts.length > 1 && h('span', { className: 'shop-compare-badge' }, 'Chi phí thấp nhất'),
                  h('button', { type: 'button', 'aria-label': 'Bỏ so sánh ' + product.name, onClick: function () { self.choose(product.id); } }, '×')
                ),
                h('div', { className: 'shop-compare-identity' },
                  h('div', { className: 'shop-compare-photo' }, product.image && h(props.Image, { src: product.image, alt: product.name, deferUntilNear: true })),
                  h('div', null, h('small', null, product.brand || 'SƠN TIẾN BẢO'), h('h4', null, product.name))
                ),
                h('div', { className: 'shop-compare-price' }, h('small', null, Number(state.area) > 0 ? 'Vật tư cho ' + state.area + ' m²' : 'Chưa nhập diện tích'), h('strong', null, cost ? money(cost) : 'Cần báo giá'), cost > 0 && h('span', null, 'Khoảng ' + money(Math.round(cost / Math.max(1, Number(state.area) || 1))) + '/m²')),
                highestCost > 0 && cost > 0 && h('div', { className: 'shop-compare-bar', 'aria-hidden': 'true' }, h('span', { style: { width: Math.max(8, Math.round(cost / highestCost * 100)) + '%' } })),
                h('dl', { className: 'shop-compare-facts' },
                  h('div', null, h('dt', null, 'Độ phủ'), h('dd', null, plan ? (product.coverageLabel || product.coverage + ' m²/' + unitOf(product) + '/lớp') : 'Cần đối chiếu hệ thi công')),
                  h('div', null, h('dt', null, 'Lượng dự kiến'), h('dd', null, plan ? plan.quantity + ' ' + plan.unit : 'Cần xác nhận')),
                  h('div', null, h('dt', null, 'Quy cách'), h('dd', null, plan ? plan.packs : 'Cần xác nhận'))
                ),
                h('a', { className: 'shop-compare-detail-link', href: product.url || props.site.catalogUrl, target: '_blank', rel: 'noopener' }, 'Xem sản phẩm ↗')
              );
            })),
            h('details', { className: 'shop-compare-details' },
              h('summary', null, h('span', null, 'Bảng so sánh chi tiết', h('small', null, 'Mục đích · tính năng · lượng dùng · nguồn')), h('span', { className: 'shop-compare-summary-icon', 'aria-hidden': 'true' }, '⌄')),
              h('div', { className: 'shop-compare-insight' + (mixedPurpose ? ' is-mixed' : ''), role: 'note' },
                h('span', { className: 'shop-compare-insight-icon', 'aria-hidden': 'true' }, mixedPurpose ? '!' : '✓'),
                h('div', null, h('strong', null, comparisonItems.length === 1 ? 'Chọn thêm sản phẩm để đối chiếu' : mixedPurpose ? 'Các sản phẩm phục vụ mục đích khác nhau' : 'Các sản phẩm cùng mục đích sử dụng'), h('p', null, comparisonItems.length === 1 ? 'Bạn có thể chọn tối đa 3 sản phẩm từ danh sách gợi ý.' : mixedPurpose ? 'Hãy chọn theo vị trí thi công trước khi so giá; sơn trần, sơn tường và chống thấm không thay thế trực tiếp cho nhau.' : 'Có thể đối chiếu tính năng và chi phí cho cùng nhu cầu.'))
              ),
              h('p', { className: 'shop-compare-source-note' }, 'Ưu điểm từ tài liệu hãng được phân biệt với mô tả cửa hàng. Lượng và chi phí chỉ được ước tính cho sơn tường đủ định mức; hệ chống thấm, sân, gỗ, kim loại và vật liệu xử lý nền cần tính riêng.'),
              h('small', { className: 'shop-compare-swipe-hint' }, 'Vuốt ngang để xem thêm sản phẩm →'),
              h('div', { className: 'shop-compare-scroll', role: 'region', 'aria-label': 'Bảng so sánh sản phẩm; có thể cuộn ngang' }, h('table', { className: 'shop-comparison-table', style: { minWidth: (220 + comparisonItems.length * 285) + 'px' } },
                h('caption', null, 'So sánh ' + comparisonItems.length + ' sản phẩm cho ' + state.area + ' m²'),
                h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Tiêu chí'), comparisonItems.map(function (item) { return h('th', { scope: 'col', key: item.product.id }, h('div', { className: 'shop-compare-column-head' }, h('div', { className: 'shop-compare-column-photo' }, item.product.image && h(props.Image, { src: item.product.image, alt: '', deferUntilNear: true })), h('div', null, h('small', null, item.product.brand || 'SƠN TIẾN BẢO'), h('strong', null, item.product.name)))); }))),
                h('tbody', null, rows.map(function (row) { return row.group ? h('tr', { key: row.group, className: 'shop-compare-section-row' }, h('th', { scope: 'rowgroup', colSpan: comparisonItems.length + 1 }, row.group)) : h('tr', { key: row.label }, h('th', { scope: 'row' }, row.label), comparisonItems.map(function (item) { return h('td', { key: item.product.id }, row.value(item)); })); }))
              ))
            ),
            h('div', { className: 'shop-compare-actions' },
              h('button', { type: 'button', className: 'btn btn-red', onClick: function () { props.onQuote(comparison); } }, 'Nhận báo giá')
            )
          ),
          h('small', { className: 'shop-data-note' }, 'Lượng và chi phí chỉ là dự kiến từ thông số catalog. Giá, màu và quy cách cần được Tiến Bảo xác nhận trước khi đặt hàng.')
        )
      );
    }
  }

  function ProjectGallery(props) {
    var examples = [
      { name: 'Phòng khách tông ấm', category: 'NỘI THẤT', image: 'assets/inspiration-interior-2026.webp', detail: 'Bề mặt sáng, dễ phối cùng gỗ và ánh sáng tự nhiên.' },
      { name: 'Mặt tiền hiện đại', category: 'NGOẠI THẤT', image: 'assets/inspiration-exterior-2026.webp', detail: 'Gợi ý phối màu sáng và mảng nhấn đậm cho nhà phố.' },
      { name: 'Sân thể thao đa năng', category: 'SÂN THỂ THAO', image: 'assets/inspiration-sport-2026.webp', detail: 'Bề mặt màu rõ, phân khu trực quan cho hoạt động ngoài trời.' }
    ];
    return h('section', { className: 'project-gallery-section', id: 'y-tuong-cong-trinh', 'aria-labelledby': 'project-gallery-title' },
      h('div', { className: 'container' },
        h('div', { className: 'project-gallery-heading' }, h('span', { className: 'section-kicker' }, 'GỢI Ý KHÔNG GIAN'), h('h2', { id: 'project-gallery-title' }, 'Hình dung màu sơn trên từng loại công trình'), h('p', null, 'Ba hình minh hoạ giúp bạn trao đổi về phong cách trước khi chốt sản phẩm và màu thực tế.')),
        h('div', { className: 'project-gallery-grid' }, examples.map(function (example) {
          return h('article', { className: 'project-gallery-card', key: example.name },
            h('img', { src: example.image, alt: 'Ảnh minh hoạ: ' + example.name, loading: 'lazy', decoding: 'async', width: 1536, height: 1024 }),
            h('div', { className: 'project-gallery-copy' }, h('small', null, example.category + ' · ẢNH MINH HOẠ'), h('h3', null, example.name), h('p', null, example.detail))
          );
        })),
        h('div', { className: 'project-gallery-footer' }, h('p', null, 'Ảnh do AI tạo để minh hoạ ý tưởng, không phải công trình Sơn Tiến Bảo đã thi công.'), h('button', { type: 'button', className: 'btn btn-dark', onClick: function () { props.onQuote(); } }, 'Nhờ tư vấn cho công trình của tôi'))
      )
    );
  }

  function normalizeQuestion(question) {
    return text(question).replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function catalogText(value) {
    return normalizeQuestion(text(value)
      .replace(/(\d)[,.](\d)/g, '$1d$2')
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/(\d)\s+(l|kg|ml)\b/g, '$1$2'));
  }

  function catalogLink(value) {
    try {
      var url = new URL(value);
      if (url.protocol === 'https:' && /^(?:www\.)?sontienbao\.com$/.test(url.hostname) &&
          !url.username && !url.password && !url.port && /\.html$/i.test(url.pathname)) return url.href;
    } catch (error) { /* A missing or malformed product URL has no detail link. */ }
    return '';
  }

  function searchCatalog(products, query, limit) {
    var phrase = catalogText(query);
    var terms = Array.from(new Set(phrase.split(' ').filter(Boolean)));
    var seen = new Set();
    return products.filter(function (product) { return product.enabled !== false; }).map(function (product) {
      var name = catalogText(product.name);
      var identity = [product.brand, product.name, product.sku, product.code].map(catalogText).join(' ');
      var category = catalogText(product.category);
      var href = catalogLink(product.url);
      var slug = href ? catalogText(new URL(href).pathname.split('/').pop().replace(/\.html$/i, '')) : '';
      var nameWords = new Set(name.split(' '));
      var identityWords = identity.split(' ');
      var words = new Set(identityWords.concat(category.split(' '), slug.split(' ')));
      var score = 0;
      for (var term of terms) {
        if (words.has(term)) {
          score += nameWords.has(term) ? 9 : identityWords.includes(term) ? 6 : 3;
        } else if (/^[a-z]{3,}$/.test(term) && identityWords.some(function (word) { return word.startsWith(term); })) {
          score += 2;
        } else return null;
      }
      if (phrase && name === phrase) score += 45;
      else if (phrase && name.includes(phrase)) score += 18;
      if (href) score += 1;
      return { product: product, href: href, score: score };
    }).filter(Boolean).sort(function (a, b) {
      return b.score - a.score;
    }).filter(function (result) {
      var key = result.href || result.product.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit == null ? products.length : limit);
  }

  function onePaintTypo(a, b) {
    if (!/^[a-z]{4,}$/.test(a) || !/^[a-z]{4,}$/.test(b) || Math.abs(a.length - b.length) > 1) return false;
    if (a.length > b.length) return onePaintTypo(b, a);
    var index = 0;
    while (index < a.length && a[index] === b[index]) index++;
    if (a.length !== b.length) return a.slice(index) === b.slice(index + 1);
    return a.slice(index + 1) === b.slice(index + 1) ||
      (a[index] === b[index + 1] && a[index + 1] === b[index] && a.slice(index + 2) === b.slice(index + 2));
  }

  function approximatePaintTopic(normalized, knowledge) {
    var words = normalized.split(' ');
    if (/\b(?:khong|chua)\b/.test(normalized)) return [];
    var candidates = knowledge.topics.filter(function (topic) {
      return topic.phrases.some(function (phrase) {
        var terms = normalizeQuestion(phrase).split(' ');
        if (terms.length < 2) return false;
        return words.some(function (_, index) {
          if (index + terms.length > words.length) return false;
          var mistakes = 0;
          return terms.every(function (term, offset) {
            if (term === words[index + offset]) return true;
            mistakes++;
            return mistakes === 1 && onePaintTypo(term, words[index + offset]);
          }) && mistakes === 1;
        });
      });
    });
    return candidates.length === 1 ? [{ topic: candidates[0] }] : [];
  }

  function findPaintAnswers(question, knowledge) {
    var normalized = normalizeQuestion(question);
    var padded = ' ' + normalized + ' ';
    var matchesByTopic = knowledge.topics.map(function (topic) {
      if (topic.id === 'specialty' && /\b(phoi mau|chon mau|mau tuong|mau son)\b/.test(normalized) &&
          !/\b(son san|son go|chong tham)\b/.test(normalized)) return { topic: topic, match: 0 };
      var matches = topic.phrases.filter(function (phrase) {
        var term = ' ' + normalizeQuestion(phrase) + ' ';
        var index = padded.indexOf(term);
        while (index >= 0) {
          // Skip descriptions such as “không bị thấm”, but keep questions ending in “không?”.
          var before = padded.slice(0, index + 1);
          if (!/\b(?:khong|chua)(?: bi| co)? $/.test(before)) return true;
          index = padded.indexOf(term, index + 1);
        }
        return false;
      });
      var yearQuery = topic.id === 'color-feng' && /\btuoi (?:19|20)\d{2}\b/.test(normalized);
      return { topic: topic, match: matches.length + Number(yearQuery) };
    }).filter(function (result) {
      return result.match > 0;
    }).sort(function (a, b) {
      return b.topic.priority - a.topic.priority || b.match - a.match;
    });
    if (!matchesByTopic.length) matchesByTopic = approximatePaintTopic(normalized, knowledge);
    return matchesByTopic.slice(0, 3).map(function (result) {
      var topic = result.topic;
      return {
        id: topic.id, title: topic.title, answer: topic.answer, action: topic.action,
        steps: topic.steps || [], caution: topic.caution || '', clarify: topic.clarify || '',
        sources: topic.sources.map(function (key) { return knowledge.sources[key]; })
      };
    });
  }

  function readChatFacts(question) {
    var normalized = text(question).replace(/²/g, '2').replace(/(\d)\s*(?:-|–|den|toi)\s*(?=\d)/g, '$1-');
    var facts = {};
    var number = '(\\d+(?:[.,]\\d+)?)';
    function readSingle(field, pattern, min, max) {
      var matches = Array.from(normalized.matchAll(pattern));
      if (matches.length !== 1) return;
      var value = Number(matches[0][1].replace(',', '.'));
      if (value >= min && value <= max) facts[field] = value;
    }
    readSingle('area', new RegExp('(?:^|[^\\d.,+\\-–])' + number + '\\s*(?:m2|met vuong)\\b(?!\\s*/)', 'g'), 1, 100000);
    readSingle('coats', /(?:^|[^\d.,+\-–])(\d+)\s*lop\b/g, 1, 10);
    readSingle('coverage', new RegExp('(?:^|[^\\d.,+\\-–])' + number + '\\s*m2\\s*/\\s*(?:lit|l)\\s*/\\s*lop\\b', 'g'), 0.1, 100);
    readSingle('waste', /hao hut\s*(?:la\s*)?(\d+(?:[.,]\d+)?)\s*%/g, 0, 50);
    if (!facts.coverage && /\d\s*m2\s*\/\s*(?:l|lit)\b/.test(normalized)) facts.coverageUnclear = true;
    if (!facts.coats && /\d\s*lop\b/.test(normalized)) facts.coatsUnclear = true;
    if (/\b(san the thao|pickleball|flexipave|chong tham|son epoxy|be nuoc|san thuong)\b/.test(normalized)) {
      facts.system = 'specialty';
    }
    var indoor = /\b(noi that|trong nha)\b/.test(normalized);
    var outdoor = /\b(ngoai that|ngoai troi|mat tien)\b/.test(normalized);
    if (indoor !== outdoor) facts.surface = indoor ? 'trong nhà' : 'ngoài trời';
    if (!facts.area && /\d\s*(?:m2|met vuong)\b(?!\s*\/)/.test(normalized)) facts.areaUnclear = true;
    // Measurements of floor area do not determine the total wall area.
    if (/\b(dien tich san|san rong|phong rong|phong dien tich)\b/.test(normalized)) {
      delete facts.area;
      facts.floorOnly = true;
    }
    return facts;
  }

  function quantityReply(facts) {
    if (facts.system === 'specialty') return 'Hệ này cần tính theo định mức từng lớp và đơn vị ghi trong tài liệu của đúng mã. Hãy gửi mã sản phẩm và diện tích để Tiến Bảo đối chiếu.';
    if (!facts.area) return facts.floorOnly ? 'Bạn có tổng diện tích tường thực cần sơn, sau khi trừ cửa, không? Diện tích sàn chưa đủ để tính sơn tường.' :
      facts.areaUnclear ? 'Mình thấy nhiều giá trị hoặc một khoảng diện tích. Hãy nhập một diện tích bề mặt để tính từng phần.' :
      'Bạn cho mình tổng diện tích bề mặt thực cần sơn bao nhiêu m²?';
    if (!facts.coats) return 'Với ' + facts.area + ' m², bạn dự định thi công mấy lớp cho loại sơn đang tính?';
    if (!facts.coverage) return 'Mình đã có ' + facts.area + ' m² và ' + facts.coats + ' lớp. Bạn cho mình định mức theo đơn vị m²/lít/lớp, ví dụ “10 m²/lít/lớp”, hoặc mở máy tính để chọn mã sản phẩm có định mức.';
    var liters = facts.area * facts.coats / facts.coverage;
    var format = function (number) { return Number(number.toFixed(2)).toLocaleString('vi-VN'); };
    var summary = format(facts.area) + ' m² × ' + facts.coats + ' lớp ÷ ' + format(facts.coverage) + ' m²/lít/lớp = khoảng ' + format(liters) + ' lít.';
    return facts.waste != null ? summary + ' Cộng ' + format(facts.waste) + '% hao hụt bạn nhập, dự kiến ' + format(liters * (1 + facts.waste / 100)) + ' lít.' :
      summary + ' Lượng này chưa cộng hao hụt. Bạn có thể nhập thêm “hao hụt 10%” nếu muốn tính theo tỷ lệ đó.';
  }

  function paintConversation(question, knowledge, previous) {
    var normalized = normalizeQuestion(question);
    var answers = findPaintAnswers(question, knowledge);
    var current = readChatFacts(question);
    var fresh = /\b(cau hoi moi|doi chu de|cong trinh khac|phong khac)\b/.test(normalized);
    var refersBack = /^(?:con |vay |the |loai do\b|loai nay\b|son do\b|tai sao\b|lam sao\b|co can\b)/.test(normalized);
    var quantity = answers.some(function (answer) { return answer.id === 'quantity'; });
    var hasMeasurements = Boolean(current.area || current.coats || current.coverage || current.floorOnly ||
      current.areaUnclear || current.coverageUnclear || current.coatsUnclear || current.waste != null);
    var onlyMeasurements = hasMeasurements && answers.every(function (answer) {
      return answer.id === 'interior' || answer.id === 'exterior' || answer.id === 'area-measure';
    });
    var previousQuantity = previous && previous.ids.includes('quantity');
    var surfaceReply = previous && current.surface && answers.length === 1 &&
      /^(?:tuong )?(?:o )?(?:trong nha|ngoai troi|noi that|ngoai that|mat tien)$/.test(normalized);
    var quantityContinuation = quantity && !current.area && !current.areaUnclear && !current.floorOnly;
    var usePrevious = previous && !fresh && (refersBack || surfaceReply ||
      (previousQuantity && onlyMeasurements) || quantityContinuation);
    var facts = Object.assign({}, usePrevious ? previous.facts : {}, current);
    if (current.floorOnly || current.areaUnclear) delete facts.area;
    if (current.coverageUnclear) delete facts.coverage;
    if (current.coatsUnclear) delete facts.coats;
    if (current.coverage) delete facts.coverageUnclear;
    if (current.coats) delete facts.coatsUnclear;
    if (current.area) {
      delete facts.floorOnly;
      delete facts.areaUnclear;
    }
    if (usePrevious && ((!answers.length && refersBack) || surfaceReply || (previousQuantity && onlyMeasurements))) {
      answers = previous.answers;
      quantity = previousQuantity;
    }
    var response = quantity ? quantityReply(facts) : '';
    if (!response && surfaceReply && !fresh) {
      response = 'Mình ghi nhận khu vực ' + current.surface + '. Khi chọn bước lót và phủ, hãy dùng hệ được hãng chỉ định cho khu vực này và tình trạng nền bên dưới.';
    }
    return {
      answers: answers, facts: facts, ids: answers.map(function (answer) { return answer.id; }),
      response: response
    };
  }

  var chatbotExamples = ['Phòng thiếu sáng chọn màu gì?', 'Chọn màu theo tuổi, mệnh', 'Tường ẩm mốc xử lý thế nào?', 'Cần bao nhiêu lít sơn?'];
  var chatbotActions = {
    choose: ['Mở bộ chọn sơn', '#chon-son'],
    calculate: ['Mở máy tính lượng sơn', '#calculator'],
    colors: ['Mở bảng màu', '#colors']
  };

  function paintRagEndpoint() {
    var meta = document.querySelector('meta[name="stb-paint-rag"]');
    try {
      var url = new URL(meta && meta.content);
      if (url.protocol === 'https:' && url.pathname === '/ask' && !url.username &&
          !url.password && !url.search && !url.hash && !url.port) return url.href;
    } catch (error) { /* The optional endpoint is off until configured. */ }
    return '';
  }

  class PaintChatbot extends React.Component {
    constructor(props) {
      super(props);
      this.state = { question: '', turns: [], pending: false, error: '', open: typeof location !== 'undefined' && location.hash === '#hoi-dap-son' };
      this.sequence = 0;
      this.openProject = event => {
        if (typeof event.detail === 'string') this.setState({ question: event.detail.slice(0, 500) });
        this.toggle(true);
      };
    }
    componentDidMount() {
      window.addEventListener('stb:open-paint-chat', this.openProject);
    }
    toggle(open) {
      var chatbot = this;
      this.setState({ open: open }, function () {
        var target = open ? chatbot.closeButton : chatbot.launcher;
        if (target) target.focus();
      });
    }
    componentWillUnmount() {
      window.removeEventListener('stb:open-paint-chat', this.openProject);
      if (this.controller) this.controller.abort();
      var ragController = this.ragController;
      this.ragController = null;
      if (ragController) ragController.abort();
    }
    explain(turn) {
      var endpoint = paintRagEndpoint();
      if (!endpoint || this.ragController) return;
      var controller = new AbortController();
      this.ragController = controller;
      var timeout = setTimeout(function () { controller.abort(); }, 14000);
      this.setState({ ragPending: turn.id, ragError: null });
      return fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: turn.question }), credentials: 'omit', signal: controller.signal
      }).then(response => {
        if (!response.ok) throw new Error('Advice unavailable');
        return response.json();
      }).then(result => {
        if (this.ragController !== controller) return;
        if (typeof result.answer !== 'string' || result.answer.length > 2400 || !Array.isArray(result.sources)) throw new Error('Invalid answer');
        var knownLinks = new Map(Object.values(this.knowledge.sources).map(link => [link[1], link]));
        var sources = result.sources.slice(0, 3).filter(source => source && Number.isInteger(source.number) &&
          source.number >= 1 && source.number <= 3 && Array.isArray(source.links)).map(source => ({
          number: source.number,
          links: source.links.slice(0, 5).filter(Array.isArray).map(link => knownLinks.get(link[1])).filter(Boolean)
        })).filter(source => source.links.length);
        if (!sources.length) throw new Error('Missing verified sources');
        var rag = { answer: result.answer, sources: sources };
        this.setState(state => ({
          turns: state.turns.map(item => item.id === turn.id ? Object.assign({}, item, { rag: rag }) : item)
        }));
      }).catch(() => {
        if (this.ragController === controller) this.setState({ ragError: turn.id });
      }).finally(() => {
        clearTimeout(timeout);
        if (this.ragController === controller) {
          this.ragController = null;
          this.setState({ ragPending: null });
        }
      });
    }
    ask(value) {
      var question = value.trim().slice(0, 500);
      if (!question || this.pending) return;
      this.pending = true;
      this.setState({ pending: true, error: '', question: question });
      var chatbot = this;
      this.controller = new AbortController();
      var signal = this.controller.signal;
      var load = this.knowledge ? Promise.resolve(this.knowledge) :
        fetch('paint-chatbot-knowledge.json?v=3', { signal: signal }).then(function (response) {
          if (!response.ok) throw new Error('Knowledge request failed');
          return response.json();
        });
      return load.then(function (knowledge) {
        if (signal.aborted) return;
        var conversation = paintConversation(question, knowledge, chatbot.conversation);
        chatbot.conversation = conversation;
        chatbot.knowledge = knowledge;
        var namedProduct = catalogText(question).match(/\b(?:(?:jotun|nippon|terraco|ruby)\s+.+|(?:wp|ct|ea|hitex)\s+\d+[a-z]*(?:\s+.*)?)/);
        var productQuery = namedProduct && namedProduct[0]
          .replace(/\b(?:gia bao nhieu|bao gia|co tot khong|mua o dau|cho minh hoi|la gi)\b.*$/, '').trim();
        var products = productQuery && productQuery.includes(' ') ?
          searchCatalog(chatbot.props && chatbot.props.products || [], productQuery)
            .filter(function (match) { return match.href; }).slice(0, 3) : [];
        var turn = { id: ++chatbot.sequence, question: question, answers: conversation.answers, response: conversation.response, products: products };
        chatbot.setState(function (state) {
          return { pending: false, question: '', turns: [turn].concat(state.turns).slice(0, 5) };
        }, function () {
          if (chatbot.body) chatbot.body.scrollTop = 0;
        });
      }).catch(function () {
        if (signal.aborted) return;
        chatbot.setState({ pending: false, error: 'Chưa tải được tài liệu. Hãy thử lại hoặc liên hệ Tiến Bảo.' });
      }).finally(function () {
        chatbot.pending = false;
      });
    }
    render() {
      var chatbot = this;
      var state = this.state;
      var contact = this.props.site.quoteUrl;
      var canSendToAi = state.open && Boolean(paintRagEndpoint());
      return h('div', { id: 'hoi-dap-son', className: 'paint-chatbot' },
          h('button', { type: 'button', className: 'paint-chatbot-launch', 'aria-label': state.open ? 'Thu gọn trợ lý sơn' : 'Mở trợ lý sơn',
            'aria-expanded': state.open, 'aria-controls': 'paint-chatbot-panel',
            ref: function (node) { chatbot.launcher = node; }, onClick: function () { chatbot.toggle(!state.open); } },
            this.props.icon, h('span', null, 'Tư vấn sơn')),
          h('section', { id: 'paint-chatbot-panel', className: 'paint-chatbot-panel', role: 'region',
            'aria-labelledby': 'paint-chatbot-title', hidden: !state.open, onKeyDown: function (event) {
              if (event.key === 'Escape') { event.stopPropagation(); chatbot.toggle(false); }
            } },
            h('div', { className: 'paint-chatbot-header' },
              h('h2', { id: 'paint-chatbot-title' }, 'Trợ lý Sơn Tiến Bảo'),
              h('button', { type: 'button', 'aria-label': 'Đóng trợ lý sơn',
                ref: function (node) { chatbot.closeButton = node; }, onClick: function () { chatbot.toggle(false); } }, '×')
            ),
            state.open && h('div', { className: 'paint-chatbot-body', ref: function (node) { chatbot.body = node; } },
              !state.turns.length && h('p', null, 'Hỏi về màu sơn, cách xử lý tường hoặc nhập tên sản phẩm cần tìm.'),
              !state.turns.length && h('div', { className: 'project-brief-examples paint-chatbot-examples', 'aria-label': 'Câu hỏi mẫu' }, chatbotExamples.map(function (example) {
                return h('button', { key: example, type: 'button', disabled: state.pending,
                  onClick: function () { chatbot.ask(example); } }, example);
              })),
              h('p', { className: 'paint-chatbot-status', role: 'status' }, state.error ||
                (state.pending ? 'Đang tra tài liệu…' : state.turns.length ? 'Đã tra cứu xong. Kết quả mới nhất ở bên dưới.' : '')),
              h('div', { className: 'paint-chatbot-turns', 'aria-label': 'Kết quả mới nhất ở trên' }, state.turns.map(function (turn) {
                return h('article', { key: turn.id, className: 'paint-chatbot-turn' },
                  h('h3', null, turn.question),
                  turn.rag && h('div', { className: 'paint-chatbot-context' },
                    h('h4', null, 'Giải thích thêm từ AI'),
                    h('p', { className: 'paint-rag-answer' }, turn.rag.answer),
                    h('ul', { className: 'paint-chatbot-sources', 'aria-label': 'Nguồn AI đối chiếu' }, turn.rag.sources.flatMap(function (source) {
                      return source.links.map(function (link) {
                        return h('li', { key: source.number + link[1] }, h('a', { href: link[1], target: '_blank', rel: 'noopener noreferrer' },
                          '[' + source.number + '] ' + link[0]));
                      });
                    }))
                  ),
                  turn.response && h('p', { className: 'paint-chatbot-context' }, turn.response),
                  turn.products.length > 0 && h('ul', { className: 'paint-chatbot-sources', 'aria-label': 'Sản phẩm khớp trong catalog' }, turn.products.map(function (match) {
                    return h('li', { key: match.href }, h('a', { href: match.href, target: '_blank', rel: 'noopener noreferrer' }, match.product.name));
                  })),
                  turn.answers.length ? turn.answers.map(function (answer) {
                    var action = chatbotActions[answer.action] || ['Nhờ Tiến Bảo tư vấn', contact];
                    return h('div', { key: answer.id, className: 'paint-chatbot-answer' },
                      h('h4', null, answer.title),
                      h('p', null, answer.answer),
                      answer.steps.length > 0 && h('ol', { className: 'paint-chatbot-steps' }, answer.steps.map(function (step) {
                        return h('li', { key: step }, step);
                      })),
                      answer.caution && h('p', { className: 'paint-chatbot-note' }, h('strong', null, 'Lưu ý. '), answer.caution),
                      answer.clarify && answer.id !== 'quantity' && h('p', { className: 'paint-chatbot-note' }, h('strong', null, 'Bạn cho mình biết thêm. '), answer.clarify),
                      h('ul', { className: 'paint-chatbot-sources', 'aria-label': 'Nguồn tham khảo' }, answer.sources.map(function (source) {
                        return h('li', { key: source[1] },
                          h('a', { href: source[1], target: '_blank', rel: 'noopener noreferrer' }, source[0]));
                      })),
                      h('a', { className: 'paint-chatbot-next', href: action[1], onClick: function () {
                        if (action[1].startsWith('#')) chatbot.setState({ open: false });
                      } }, action[0])
                    );
                  }) : !turn.products.length && h('div', { className: 'paint-chatbot-answer' },
                    h('p', null, 'Chưa có tài liệu khớp câu hỏi. Hãy thêm khu vực sơn và tình trạng bề mặt hoặc gửi ảnh để cửa hàng xem giúp.'),
                    h('a', { className: 'paint-chatbot-next', href: contact }, 'Nhờ Tiến Bảo tư vấn')
                  ),
                  canSendToAi && turn === state.turns[0] && !turn.rag && turn.answers.length > 0 &&
                    !turn.answers.some(function (answer) { return answer.id === 'quantity' || answer.id === 'quote'; }) &&
                    h('div', { className: 'paint-chatbot-note' },
                      h('button', { type: 'button', className: 'btn btn-outline', disabled: Boolean(state.ragPending),
                        onClick: function () { chatbot.explain(turn); } }, state.ragPending ? 'AI đang đối chiếu…' : 'Gửi câu này tới AI'),
                      h('p', null, 'Chỉ câu hỏi này được gửi tới Cloudflare. Bạn không cần nhập thông tin liên hệ.'),
                      state.ragError === turn.id && h('p', { role: 'status' }, 'AI chưa trả lời được. Bạn vẫn có thể dùng hướng dẫn và nguồn ở trên.')
                    )
                );
              }))
            ),
            state.open && h('div', { className: 'paint-chatbot-compose' },
              h('form', { onSubmit: function (event) { event.preventDefault(); chatbot.ask(state.question); } },
                h('div', { className: 'paint-chatbot-input' },
                  h('input', { type: 'text', maxLength: 500, required: true, 'aria-label': 'Câu hỏi của bạn',
                    placeholder: 'Nhập câu hỏi hoặc mã sơn…', value: state.question,
                    readOnly: state.pending, onChange: function (event) { chatbot.setState({ question: event.target.value }); } }),
                  h('button', { type: 'submit', className: 'btn btn-red', disabled: state.pending }, 'Gửi')
                )
              ),
              h('div', { className: 'paint-chatbot-contact' },
                state.turns.length > 0 && h('button', { type: 'button', disabled: state.pending, onClick: function () {
                  chatbot.conversation = null;
                  if (chatbot.ragController) chatbot.ragController.abort();
                  chatbot.ragController = null;
                  chatbot.setState({ turns: [], question: '', error: '', ragPending: null, ragError: null });
                } }, 'Câu hỏi mới'),
                h('a', { href: 'tel:' + this.props.site.hotline }, 'Gọi'),
                h('a', { href: 'https://zalo.me/' + this.props.site.zalo, target: '_blank', rel: 'noopener' }, 'Zalo'),
                h('button', { type: 'button', onClick: function () { chatbot.setState({ open: false }); chatbot.props.onQuote(); } }, 'Nhận báo giá')
              )
            )
          )
      );
    }
  }

  window.STB_SHOPPING = {
    ShopAssistant: ShopAssistant,
    EmailDraft: EmailDraft,
    ProjectGallery: ProjectGallery,
    PaintChatbot: PaintChatbot,
    findPaintAnswers: findPaintAnswers,
    paintConversation: paintConversation,
    searchCatalog: searchCatalog,
    catalogLink: catalogLink,
    estimate: estimate,
    estimateContext: estimateContext,
    estimateText: estimateText,
    comparisonProfile: comparisonProfile
  };
})();
