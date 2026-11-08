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
    { match: /essence de lau chui/, fit: 'Tường nội thất cần lau chùi thường xuyên', strengths: ['Dễ lau chùi', 'Nhẹ mùi, VOC thấp', 'Bề mặt mờ'], note: 'Chỉ dùng cho khu vực nội thất.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/essence-easy-clean' },
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
    seepage: { label: 'Thấm nước', advice: 'Kiểm tra đường nước hoặc vết nứt, xử lý nguyên nhân thấm và khảo sát bề mặt trước khi chọn hệ chống thấm.', source: 'https://professional.nipponpaint.com.vn/vi/van-de-giai-phap' },
    peeling: { label: 'Bong tróc', advice: 'Cạo bỏ lớp sơn bong, xử lý nguyên nhân ẩm nếu có, làm sạch và sơn lót trước lớp phủ mới.', source: 'https://nipponpaint.com.vn/vi/tin-tuc/meo-son-nha/huong-dan-cach-son-tuong-nha-cu-thay-ao-moi-cho-ngoi-nha-cua-ban' },
    stains: { label: 'Dễ bám bẩn', advice: 'Với tường đã khô và ổn định, cân nhắc lớp phủ dễ lau chùi hoặc chống bám bẩn theo khu vực sử dụng.', source: 'https://www.jotun.com/vn-vi/decorative/products/interior/all-interior-products/essence-easy-clean' }
  };
  function matchesSurface(product, surface) {
    var explicit = product.calculatorSurface;
    var label = text((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || ''));
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
  function score(product, condition) {
    var label = text((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || ''));
    var profile = comparisonProfile(product);
    var strengths = text(profile ? profile.strengths.join(' ') : '');
    var value = product.image ? 8 : 0;
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
      surface: surface === 'interior' ? 'Nội thất' : surface === 'exterior' ? 'Ngoại thất' : surface === 'sport' ? 'Sân thể thao' : 'Chống thấm',
      condition: surface === 'sport' ? '' : (WALL_CONDITIONS[condition] || WALL_CONDITIONS.normal).label,
      area: Math.max(1, Number(area) || 1),
      waste: surface === 'sport' ? null : 10,
      items: items,
      total: items.every(function (item) { return item.cost > 0; }) ? items.reduce(function (sum, item) { return sum + item.cost; }, 0) : 0
    };
  }
  function estimateText(context) {
    var lines = ['YÊU CẦU TƯ VẤN SƠN TIẾN BẢO'];
    if (context.surface) lines.push('Khu vực: ' + context.surface);
    if (context.condition) lines.push('Tình trạng tường: ' + context.condition);
    if (context.area) lines.push('Diện tích: ' + context.area + ' m²');
    if (context.waste != null) lines.push('Hao hụt dự kiến: ' + context.waste + '%');
    (context.items || []).forEach(function (item, index) {
      lines.push((index + 1) + '. ' + item.name + ' — ' + (item.quantity ? item.quantity + ' ' + item.unit : 'cần xác nhận lượng') + (item.packs ? ', ' + item.packs : ''));
    });
    lines.push('Chi phí vật tư tham khảo: ' + (Number(context.total) > 0 ? money(context.total) : 'cần báo giá'));
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

  class ShopAssistant extends React.Component {
    constructor(props) {
      super(props);
      this.state = { surface: 'interior', condition: 'normal', area: 100, brand: 'all', query: '', limit: 24, selected: null };
    }
    choose(id) {
      var state = this.state;
      var current = state.selected ? state.selected.slice() : (this.props.products || []).filter(function (product) {
        return product.enabled !== false && isFinish(product) && matchesSurface(product, state.surface) &&
          (state.brand === 'all' || product.brand === state.brand);
      }).sort(function (a, b) { return score(b, state.condition) - score(a, state.condition); }).slice(0, 2).map(function (product) { return product.id; });
      var index = current.indexOf(id);
      if (index >= 0) current.splice(index, 1);
      else if (current.length < 3) current.push(id);
      this.setState({ selected: current });
    }
    render() {
      var self = this, props = this.props, state = this.state;
      var brands = Array.from(new Set((props.products || []).map(function (product) { return product.brand; }).filter(Boolean))).sort();
      var query = text(state.query).trim();
      var candidates = (props.products || []).filter(function (product) {
        return product.enabled !== false && (query ? text(product.name + ' ' + product.brand).includes(query) : isFinish(product) && matchesSurface(product, state.surface)) &&
          (state.brand === 'all' || product.brand === state.brand);
      }).sort(function (a, b) { return score(b, state.condition) - score(a, state.condition); });
      var visible = candidates.slice(0, query ? state.limit : 6);
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
            h('span', { className: 'section-kicker' }, 'CHỌN SƠN NHANH'),
            h('h2', { id: 'shop-assistant-title' }, 'Tìm dòng sơn phù hợp với công trình'),
            h('p', null, 'Cho biết khu vực và tình trạng tường để xem cách xử lý, sản phẩm gợi ý và báo giá tham khảo.')
          ),
          h('div', { className: 'shop-assistant-controls' },
            h('label', null, 'Khu vực', h('select', { value: state.surface, onChange: function (event) { self.setState({ surface: event.target.value, condition: event.target.value === 'sport' ? 'normal' : state.condition, selected: null }); } },
              [['interior', 'Nội thất'], ['exterior', 'Ngoại thất'], ['waterproof', 'Chống thấm'], ['sport', 'Sân thể thao']].map(function (option) { return h('option', { key: option[0], value: option[0] }, option[1]); })
            )),
            h('label', null, 'Tình trạng tường', h('select', { value: state.condition, disabled: state.surface === 'sport', onChange: function (event) { var next = event.target.value; self.setState({ condition: next, surface: next === 'seepage' ? 'waterproof' : state.surface, selected: null }); } },
              Object.keys(WALL_CONDITIONS).map(function (key) { return h('option', { key: key, value: key }, WALL_CONDITIONS[key].label); })
            )),
            h('label', null, 'Diện tích (m²)', h('input', { type: 'number', min: 1, max: 100000, value: state.area, onChange: function (event) { self.setState({ area: event.target.value }); } })),
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
          h('p', { className: 'shop-result-count', role: 'status' }, candidates.length + ' sản phẩm ' + (query ? 'khớp tìm kiếm · Đang hiển thị ' + visible.length : 'phù hợp · Hiển thị tối đa 6 gợi ý')),
          visible.length ? h('div', { className: 'shop-recommendations' }, visible.map(function (product) {
            var plan = estimate(product, state.area), active = selected.some(function (item) { return item.id === product.id; });
            return h('article', { className: 'shop-recommendation', key: product.id },
              h('div', { className: 'shop-recommendation-image' }, product.image && h('img', { src: props.resolveImage(product.image), alt: product.name, loading: 'lazy', decoding: 'async' })),
              h('div', { className: 'shop-recommendation-content' },
                h('small', null, product.brand || 'SƠN TIẾN BẢO'),
                h('h3', null, product.name),
                h('p', null, product.category || 'Sản phẩm sơn'),
                h('div', { className: 'shop-recommendation-facts' },
                  h('span', null, 'Độ phủ: ', h('b', null, plan ? (product.coverageLabel || product.coverage + ' m²/' + unitOf(product) + '/lớp') : 'cần đối chiếu hệ thi công')),
                  h('span', null, 'Vật tư dự kiến: ', h('b', null, plan ? plan.quantity + ' ' + plan.unit : 'cần xác nhận')),
                  h('span', null, 'Chi phí: ', h('b', null, plan && plan.cost ? money(plan.cost) : 'cần báo giá'))
                ),
                h('div', { className: 'shop-recommendation-actions' },
                  h('button', { type: 'button', className: active ? 'is-selected' : '', 'aria-pressed': active, onClick: function () { self.choose(product.id); } }, active ? 'Đã chọn so sánh' : 'Thêm so sánh'),
                  h('a', { href: product.url || props.site.catalogUrl, target: '_blank', rel: 'noopener' }, 'Chi tiết ↗')
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
                  h('div', { className: 'shop-compare-photo' }, product.image && h('img', { src: props.resolveImage(product.image), alt: product.name, loading: 'lazy', decoding: 'async' })),
                  h('div', null, h('small', null, product.brand || 'SƠN TIẾN BẢO'), h('h4', null, product.name))
                ),
                h('div', { className: 'shop-compare-price' }, h('small', null, 'Vật tư cho ' + state.area + ' m²'), h('strong', null, cost ? money(cost) : 'Cần báo giá'), cost > 0 && h('span', null, 'Khoảng ' + money(Math.round(cost / Math.max(1, Number(state.area) || 1))) + '/m²')),
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
                h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Tiêu chí'), comparisonItems.map(function (item) { return h('th', { scope: 'col', key: item.product.id }, h('div', { className: 'shop-compare-column-head' }, h('div', { className: 'shop-compare-column-photo' }, item.product.image && h('img', { src: props.resolveImage(item.product.image), alt: '', loading: 'lazy', decoding: 'async' })), h('div', null, h('small', null, item.product.brand || 'SƠN TIẾN BẢO'), h('strong', null, item.product.name)))); }))),
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

  window.STB_SHOPPING = {
    ShopAssistant: ShopAssistant,
    EmailDraft: EmailDraft,
    ProjectGallery: ProjectGallery,
    estimate: estimate,
    estimateContext: estimateContext,
    estimateText: estimateText,
    comparisonProfile: comparisonProfile
  };
})();
