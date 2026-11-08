# Graph Report - landing page  (2026-11-08)

## Corpus Check
- 40 files · ~34,424 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 8, (none) 4, .bat 2)

## Summary
- 580 nodes · 1362 edges · 39 communities (22 shown, 2 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a1b7f65`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sync_full_calculator_catalog.py
- clone
- admin-core.js
- admin.js
- Calculator
- admin-v2.js
- itop-adapter.js
- itopApi
- App
- sync_full_calculator_catalog_resilient.py
- sync_products.py
- app.js
- finalize_calculator_catalog.py
- shopping-tools.js
- Sơn Tiến Bảo V7 — triển khai không cần Supabase
- Q: Kiểm tra toàn bộ chức năng landing page và Admin
- Sơn Tiến Bảo V7 — GitHub Pages Preview
- manual-product-overrides.js
- asset-path-fix.js
- seo-copy-fix.js
- merge
- AGENTS.md
- Sơn Tiến Bảo V7
- smoke.js

## God Nodes (most connected - your core abstractions)
1. `Calculator` - 27 edges
2. `clone()` - 25 edges
3. `Btn()` - 24 edges
4. `Icon()` - 18 edges
5. `itopApi()` - 17 edges
6. `Storefront()` - 17 edges
7. `fmt_num()` - 17 edges
8. `Admin` - 16 edges
9. `App` - 15 edges
10. `norm()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `package_hint_precise()` --calls--> `selected_size()`  [EXTRACTED]
  scripts/sync_full_calculator_catalog_resilient.py → scripts/sync_full_calculator_catalog_fast.py
- `main()` --calls--> `main()`  [EXTRACTED]
  scripts/sync_full_calculator_catalog_resilient.py → scripts/sync_full_calculator_catalog_fast.py
- `find_categories()` --calls--> `fetch_page()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py
- `card_for_anchor()` --calls--> `first_price()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py
- `discover_urls()` --calls--> `fetch_page()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py

## Import Cycles
- None detected.

## Communities (39 total, 2 thin omitted)

### Community 0 - "sync_full_calculator_catalog.py"
Cohesion: 0.08
Nodes (73): build_page(), card_for_anchor(), consolidate(), crawl_category(), discover_urls(), family_name(), find_categories(), infer_surface() (+65 more)

### Community 1 - "clone"
Cohesion: 0.07
Nodes (20): Admin, clone(), download(), EditModal, fileToData(), getPopupTemplate(), isPlain(), Leads() (+12 more)

### Community 2 - "admin-core.js"
Cohesion: 0.14
Nodes (40): addCategory(), addFaq(), api(), bindContentInputs(), bindStatic(), checkDeploy(), clearDraft(), clone() (+32 more)

### Community 3 - "admin.js"
Cohesion: 0.20
Nodes (30): api(), bindButtons(), bindStatic(), connect(), decode64(), encode64(), fileBase64(), getPath() (+22 more)

### Community 4 - "Calculator"
Cohesion: 0.16
Nodes (4): Calculator, score(), better(), walk()

### Community 5 - "admin-v2.js"
Cohesion: 0.17
Nodes (27): b64(), bytesText(), changePassword(), clearFails(), createVault(), decrypt(), derive(), encrypt() (+19 more)

### Community 6 - "itop-adapter.js"
Cohesion: 0.17
Nodes (25): createProduct(), csrf(), deleteProduct(), dtParams(), duplicateProduct(), extractPublicProduct(), fetchJson(), fetchText() (+17 more)

### Community 8 - "itopApi"
Cohesion: 0.11
Nodes (6): itopApi(), ITopColorManager, ITopMediaManager, ITopProductManager, ITopQuickEdit, SecuritySettings()

### Community 9 - "App"
Cohesion: 0.07
Nodes (13): AnimatedStat, begin(), tick(), App, BackToTop, goRealAdmin(), isLocalPreview(), loadLeads() (+5 more)

### Community 10 - "sync_full_calculator_catalog_resilient.py"
Cohesion: 0.26
Nodes (9): canonical(), discover_categories_resilient(), add(), discover_children(), main(), package_hint_precise(), parse_calc_products(), parse_meta() (+1 more)

### Community 11 - "sync_products.py"
Cohesion: 0.26
Nodes (19): card_from_anchor(), clean_image_url(), compact_product_card(), detail_image_and_title(), discover_home_catalog(), fetch_soup(), find_home_product(), image_by_alt() (+11 more)

### Community 12 - "app.js"
Cohesion: 0.06
Nodes (50): activePopup(), ActivityManager(), AdminAuthLoading(), AdminGlobalSearch(), AdminList(), AdminLogin(), AdminSidebar(), AdminTop() (+42 more)

### Community 13 - "finalize_calculator_catalog.py"
Cohesion: 0.33
Nodes (9): consolidate(), family_key(), fmt_size(), is_legacy(), main(), norm(), package_unit(), parse_assignment() (+1 more)

### Community 14 - "shopping-tools.js"
Cohesion: 0.22
Nodes (12): estimate(), EstimateActions, estimateContext(), estimateText(), isFinish(), matchesSurface(), money(), savedEstimates() (+4 more)

### Community 15 - "Sơn Tiến Bảo V7 — triển khai không cần Supabase"
Cohesion: 0.22
Nodes (8): A. Test local, B. Test iTop Live, C. Dữ liệu nào đang dùng iTop thật?, D. Dữ liệu Landing chưa map trực tiếp vào module iTop riêng, E. Báo giá, F. Điều kiện bắt buộc, Kiến trúc, Sơn Tiến Bảo V7 — triển khai không cần Supabase

### Community 17 - "Q: Kiểm tra toàn bộ chức năng landing page và Admin"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Kiểm tra toàn bộ chức năng landing page và Admin, Source Nodes

### Community 18 - "Sơn Tiến Bảo V7 — GitHub Pages Preview"
Cohesion: 0.33
Nodes (5): Admin Center, GitHub Pages, Không được làm, Sơn Tiến Bảo V7 — GitHub Pages Preview, Trạng thái hiện tại

### Community 19 - "manual-product-overrides.js"
Cohesion: 0.70
Nodes (4): findOverride(), isHidden(), keys(), normUrl()

### Community 21 - "asset-path-fix.js"
Cohesion: 0.83
Nodes (3): fixData(), fixObject(), localAsset()

### Community 22 - "seo-copy-fix.js"
Cohesion: 0.83
Nodes (3): applyFeaturedSeoCopy(), normalize(), start()

### Community 27 - "Sơn Tiến Bảo V7"
Cohesion: 0.50
Nodes (3): Hỗ trợ chọn mua, Kiểm tra nhanh, Sơn Tiến Bảo V7

### Community 41 - "smoke.js"
Cohesion: 0.24
Nodes (13): assert, elementText(), expand(), findElement(), fs, main(), makeContext(), path (+5 more)

## Knowledge Gaps
- **21 isolated node(s):** `fs`, `path`, `vm`, `projectRoot`, `graphify` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 83 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Calculator` connect `Calculator` to `clone`, `app.js`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `clone()` connect `clone` to `App`, `app.js`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `App` connect `App` to `clone`, `app.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `Btn()` (e.g. with `ActivityManager()` and `.renderTab()`) actually correct?**
  _`Btn()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `Icon()` (e.g. with `.render()` and `BuyingJourney()`) actually correct?**
  _`Icon()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `vm` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sync_full_calculator_catalog.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08441558441558442 - nodes in this community are weakly interconnected._