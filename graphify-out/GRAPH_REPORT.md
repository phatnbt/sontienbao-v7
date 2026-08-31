# Graph Report - sontienbao-v7  (2026-08-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 510 nodes · 1198 edges · 41 communities (20 shown, 8 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27d8a1f7`
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
- app.js
- itopApi
- App
- sync_full_calculator_catalog_fast.py
- sync_products.py
- Btn
- finalize_calculator_catalog.py
- asset
- Sơn Tiến Bảo V7 — triển khai không cần Supabase
- Header
- ErrorBoundary
- Sơn Tiến Bảo V7 — GitHub Pages Preview
- manual-product-overrides.js
- ITopQuickEdit
- asset-path-fix.js
- seo-copy-fix.js
- ColorManager
- QuoteModal
- v7-content-overrides.js
- AGENTS.md
- README.md

## God Nodes (most connected - your core abstractions)
1. `Calculator` - 27 edges
2. `clone()` - 24 edges
3. `Btn()` - 24 edges
4. `itopApi()` - 18 edges
5. `Admin` - 16 edges
6. `fmt_num()` - 16 edges
7. `Storefront()` - 16 edges
8. `build_product()` - 15 edges
9. `App` - 14 edges
10. `build_page()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `build_page()` --calls--> `extract_coverage()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py
- `build_page()` --calls--> `extract_liter_variants()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py
- `build_page()` --calls--> `extract_price_by_size()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py
- `build_page()` --calls--> `fetch_page()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py
- `build_page()` --calls--> `fmt_num()`  [EXTRACTED]
  scripts/sync_calculator_catalog.py → scripts/sync_technical.py

## Import Cycles
- None detected.

## Communities (41 total, 8 thin omitted)

### Community 0 - "sync_full_calculator_catalog.py"
Cohesion: 0.10
Nodes (63): build_page(), card_for_anchor(), consolidate(), crawl_category(), discover_urls(), family_name(), find_categories(), infer_surface() (+55 more)

### Community 1 - "clone"
Cohesion: 0.07
Nodes (18): Admin, clone(), Colors, download(), EditModal, fileToData(), getPopupTemplate(), isPlain() (+10 more)

### Community 2 - "admin-core.js"
Cohesion: 0.14
Nodes (40): addCategory(), addFaq(), api(), bindContentInputs(), bindStatic(), checkDeploy(), clearDraft(), clone() (+32 more)

### Community 3 - "admin.js"
Cohesion: 0.20
Nodes (30): api(), bindButtons(), bindStatic(), connect(), decode64(), encode64(), fileBase64(), getPath() (+22 more)

### Community 4 - "Calculator"
Cohesion: 0.15
Nodes (4): Calculator, score(), better(), walk()

### Community 5 - "admin-v2.js"
Cohesion: 0.17
Nodes (27): b64(), bytesText(), changePassword(), clearFails(), createVault(), decrypt(), derive(), encrypt() (+19 more)

### Community 6 - "itop-adapter.js"
Cohesion: 0.17
Nodes (25): createProduct(), csrf(), deleteProduct(), dtParams(), duplicateProduct(), extractPublicProduct(), fetchJson(), fetchText() (+17 more)

### Community 7 - "app.js"
Cohesion: 0.15
Nodes (17): activePopup(), AdminAuthLoading(), AdminGlobalSearch(), AdminList(), AdminLogin(), AdminSidebar(), AdminTop(), cx() (+9 more)

### Community 8 - "itopApi"
Cohesion: 0.15
Nodes (5): itopApi(), ITopColorManager, ITopMediaManager, ITopProductManager, SecuritySettings()

### Community 9 - "App"
Cohesion: 0.14
Nodes (10): App, goRealAdmin(), isLocalPreview(), loadData(), loadLeads(), saveLeads(), setTheme(), shouldUseITopAdmin() (+2 more)

### Community 10 - "sync_full_calculator_catalog_fast.py"
Cohesion: 0.16
Nodes (16): build_precise_product(), dedupe_exact_packages(), exact_product_id(), family_key(), main(), package_hint(), propagate_exact_family_coverage(), selected_size() (+8 more)

### Community 11 - "sync_products.py"
Cohesion: 0.26
Nodes (19): card_from_anchor(), clean_image_url(), compact_product_card(), detail_image_and_title(), discover_home_catalog(), fetch_soup(), find_home_product(), image_by_alt() (+11 more)

### Community 12 - "Btn"
Cohesion: 0.19
Nodes (19): ActivityManager(), Btn(), BuyingJourney(), Categories(), ContactDock(), Faq(), FinalCta(), Hero() (+11 more)

### Community 13 - "finalize_calculator_catalog.py"
Cohesion: 0.33
Nodes (9): consolidate(), family_key(), fmt_size(), is_legacy(), main(), norm(), package_unit(), parse_assignment() (+1 more)

### Community 14 - "asset"
Cohesion: 0.20
Nodes (6): AnnouncementModal(), asset(), BootOverlay(), BrandStrip(), Footer(), SmartImage

### Community 15 - "Sơn Tiến Bảo V7 — triển khai không cần Supabase"
Cohesion: 0.22
Nodes (8): A. Test local, B. Test iTop Live, C. Dữ liệu nào đang dùng iTop thật?, D. Dữ liệu Landing chưa map trực tiếp vào module iTop riêng, E. Báo giá, F. Điều kiện bắt buộc, Kiến trúc, Sơn Tiến Bảo V7 — triển khai không cần Supabase

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

## Knowledge Gaps
- **13 isolated node(s):** `A. Test local`, `B. Test iTop Live`, `C. Dữ liệu nào đang dùng iTop thật?`, `D. Dữ liệu Landing chưa map trực tiếp vào module iTop riêng`, `E. Báo giá` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Calculator` connect `Calculator` to `clone`, `app.js`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `clone()` connect `clone` to `App`, `app.js`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `App` connect `App` to `clone`, `asset`, `app.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `Btn()` (e.g. with `ActivityManager()` and `.renderTab()`) actually correct?**
  _`Btn()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **What connects `A. Test local`, `B. Test iTop Live`, `C. Dữ liệu nào đang dùng iTop thật?` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sync_full_calculator_catalog.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09743589743589744 - nodes in this community are weakly interconnected._
- **Should `clone` be split into smaller, more focused modules?**
  _Cohesion score 0.0672316384180791 - nodes in this community are weakly interconnected._