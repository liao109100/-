---
name: 貿易業務知識資料庫
description: 國貿署內部知識管理系統 — 讓每位公務員在三次互動內找到需要的資料
colors:
  # Primary
  primary-navy:    "#0F3F85"   # $primary
  brand-teal:      "#2C8086"   # $teal / $grad-start
  brand-indigo:    "#3145A5"   # $grad-end
  action-blue:     "#2457A7"   # $blue / $bdr-focus
  deep-navy:       "#1B3263"   # $navy
  # Semantic
  status-green:    "#21B298"   # $green
  status-red:      "#FF4D4D"   # $red
  status-amber:    "#E8911A"   # $amber
  keyword-highlight: "#FEF08A" # $hl
  # Neutral — Text
  text-primary:    "#2F3D50"   # $tx-main
  text-secondary:  "#566578"   # $tx-mid
  text-tertiary:   "#8898AA"   # $tx-light
  # Neutral — Surface
  bg-page:         "#F0F4F9"   # $bg-page
  bg-app:          "#EDF5F7"   # $bg-app
  bg-tree:         "#EBF1F7"   # hardcoded in _components.scss
  bg-surface:      "#FFFFFF"   # $bg-white
  # Neutral — Border
  border-default:  "#D8E2EE"   # $bdr
  border-focus:    "#2457A7"   # $bdr-focus
typography:
  headline:
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.35
  page-title:
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
  body-document:
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.9
  body:
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.72
  base:
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.5px"
rounded:
  sm:   "4px"    # $r-sm  — 按鈕、輸入框、chips
  md:   "10px"   # $r-md  — 卡片、Tree Panel
  lg:   "16px"   # $r-lg  — 首頁功能卡片
  xl:   "20px"   # $r-xl  — Modal
  pill: "20px"   # $r-pill — Tag pill
spacing:
  xs:  "4px"     # icon gap、micro padding
  sm:  "8px"     # tag padding、row gap
  md:  "14px"    # filter group gap、標準 gap
  lg:  "20px"    # section padding、卡片 padding
  xl:  "30px"    # detail body padding、大區塊
components:
  button-primary:
    backgroundColor: "{colors.primary-navy}"
    textColor: "{colors.bg-surface}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  button-primary-hover:
    backgroundColor: "#082d63"
    textColor: "{colors.bg-surface}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  button-gradient:
    backgroundColor: "{colors.brand-teal}"
    textColor: "{colors.bg-surface}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  button-outline:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  button-ghost:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "8px 20px"
  tag-new:
    backgroundColor: "#EDF7F6"
    textColor: "{colors.status-green}"
    rounded: "2px"
    padding: "4px 8px"
  tag-favorable:
    backgroundColor: "{colors.status-green}"
    textColor: "{colors.bg-surface}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  tag-unfavorable:
    backgroundColor: "{colors.status-red}"
    textColor: "{colors.bg-surface}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: 貿易業務知識資料庫

## 1. Overview

**Creative North Star: "知識索引的地圖"**

這套系統是一張為專業人員繪製的地圖：每個頁面都是一個定位點，每次互動都縮短使用者與答案之間的距離。介面不刻意彰顯自身，而是成為公務員工作流程的透明基礎設施。

**Key Characteristics:**
- 識別帶（Topbar + 功能性 Header）：僅在此處使用品牌漸層，其餘表面一律克制
- 色彩策略：Restrained — 中性底色 + `$primary` 為主要行動色，占比 ≤10%
- 陰影策略：靜止時無陰影，hover 升至 `$sh2`，Modal 用 `$sh3`
- 字型全系統單一字族：Noto Sans TC，層次靠字號與字重完成
- 語意色（綠/紅/琥珀）嚴格對應案件結果，不外借作裝飾

---

## 2. Colors: The Institutional Map Palette

> 所有數值與 `scss/_variables.scss` 保持同步。

### 2.1 品牌色（Brand）

| Token | SCSS 變數 | Hex | 用途 |
|---|---|---|---|
| `primary-navy` | `$primary` | `#0F3F85` | 主要按鈕、Active 邊框、區塊標題。唯一允許占視覺主導的飽和色 |
| `brand-teal` | `$teal` / `$grad-start` | `#2C8086` | 漸層起點；單獨作為次要行動按鈕（新增系列）背景 |
| `brand-indigo` | `$grad-end` | `#3145A5` | 漸層終點；不單獨使用 |
| `action-blue` | `$blue` / `$bdr-focus` | `#2457A7` | Focus ring、hover 邊框、連結色 |
| `deep-navy` | `$navy` | `#1B3263` | Logo 文字、結構性小標題。權威感但非可點擊 |

**品牌漸層：** `linear-gradient(90deg, #2C8086 0%, #3145A5 100%)` — 僅用於 Topbar、Side Panel Header、Modal Active Tab。

### 2.2 語意色（Semantic）

| Token | SCSS 變數 | Hex | 語意 |
|---|---|---|---|
| `status-green` | `$green` | `#21B298` | 從輕裁決、近期更新標記 |
| `status-red` | `$red` | `#FF4D4D` | 從重裁決、必填欄位 |
| `status-amber` | `$amber` | `#E8911A` | 草稿狀態、OCR 辨識提示 |
| `keyword-highlight` | `$hl` | `#FEF08A` | 搜尋 `<mark>` 背景，僅用於命中片段 |

**The Semantic Color Quarantine Rule.** `status-green` 與 `status-red` 只能對應案件裁決（從輕/從重）。禁止外借作一般成功/錯誤色。

### 2.3 中性色（Neutral）

| Token | SCSS 變數 | Hex | 用途 |
|---|---|---|---|
| `text-primary` | `$tx-main` | `#2F3D50` | 正文、卡片標題、資料欄位值 |
| `text-secondary` | `$tx-mid` | `#566578` | 說明文字、欄位標籤、次要資訊 |
| `text-tertiary` | `$tx-light` | `#8898AA` | Placeholder、時間戳、空狀態提示 |
| `bg-page` | `$bg-page` | `#F0F4F9` | 外層畫布，讓白色卡片自然浮現 |
| `bg-app` | `$bg-app` | `#EDF5F7` | App 主頁面底色 |
| `bg-tree` | —（hardcoded） | `#EBF1F7` | 樹狀面板底色，比 bg-app 略深 |
| `bg-surface` | `$bg-white` | `#FFFFFF` | 卡片、Modal、Side Panel 主體 |
| `border-default` | `$bdr` | `#D8E2EE` | 預設邊框，帶藍調 |
| `border-focus` | `$bdr-focus` | `#2457A7` | Focus / hover 邊框 |

**The Navy Hierarchy Rule.** 三層藍各司其職：`$primary` 領導行動 → `$blue` 傳遞互動性 → `$navy` 錨定結構。禁止跨層互換。

---

## 3. Typography

**字族：** Noto Sans TC（weights 300 / 400 / 500 / 600 / 700），fallback `-apple-system, sans-serif`

**原則：** 全系統單一字族，層次靠字號跳躍和字重對比完成，不靠字族變化。

### 3.1 字型尺度（Type Scale）

| 層級 | 字號 | 字重 | 行高 | SCSS / CSS 類別 | 使用場景 |
|---|---|---|---|---|---|
| Headline | 26px | 700 | 1.35 | `.h-title` | 首頁大標題（全系統唯一展示層） |
| Page Title | 24px | 700 | 1.4 | `.page-title` | 內頁頁面標題（sub-header 內） |
| Title | 20px | 700 | 1.4 | `.cases-title` `.modal-title` `.side-title` | 區塊/面板層級標題 |
| Panel Heading | 18px | 700 | 1.4 | `.tree-heading` | 樹狀面板大標 |
| Section Header | 14px | 700 | 1.4 | `.doc-section-hd` `.section-label` | 卡片內區段標題 |
| Body Document | 16px | 400 | 1.9 | `.doc-body-text` `.side-text` | 公文主體長文 |
| Body | 14px | 400 | 1.72 | `.case-summary` `.meta-val` `.case-card` | 卡片正文、摘要 |
| Nav Item | 15px | 400/700 | 1.4 | `.tree-item` | 樹狀選單項目 |
| Base | 13px | 400 | 1.55 | `$fs-base`、`body` | 全系統預設字號 |
| Label | 12px | 700 | 1.4 | `.tag` `.attach-pill` `.tree-count` | 標籤、徽章、計數 |
| Input | 16px | 400 | 1.55 | `input` `select` | 所有表單輸入（防 iOS 縮放） |

### 3.2 字重使用規則

| 字重 | 用途 |
|---|---|
| 400 | 正文、說明文字、表單輸入 |
| 500 | Sidebar 項目、次要導覽 |
| 600 | 按鈕、強調標籤 |
| 700 | 所有標題、主要行動、徽章 |

**The No Italic Rule.** 斜體只允許在 Step Bar 的 `.step-label` 中出現（區分狀態標籤與資料標籤）。所有 UI 強調靠字重完成。

**The Weight Jump Rule.** 相鄰層級字重必須跨至少一個步級（400 → 600 → 700）。500 與 600 對比不足，禁止作層次區分使用。

**The 11px Minimum Rule.** 全系統字號下限為 **11px**。任何元素（包含副標、徽章、輔助說明、按鈕內 icon 容器）的 `font-size` 不得低於此值。10.5px 一律進位至 11px，8–10px 同理。唯一例外：Material Icons 的 `::before` content 由 `font-size: 0` 的容器驅動，但圖示本身的 `font-size` 在 `::before` 中仍須 ≥ 11px（目前設定為 20px，符合規範）。

---

## 4. Elevation

靜止平坦、互動升起。背景層次靠底色差異建立，陰影只作為互動回饋。

### Shadow Vocabulary

| Token | SCSS 變數 | 值 | 使用時機 |
|---|---|---|---|
| Ambient Low | `$sh1` | `0 1px 4px rgba(44,63,90,0.09)` | 首頁功能卡片靜止 |
| Interaction | `$sh2` | `0 4px 18px rgba(44,63,90,0.14)` | 卡片 hover 升起 |
| Overlay | `$sh3` | `0 10px 36px rgba(44,63,90,0.20)` | Modal（搭配 blur） |

**The Flat-at-Rest Rule.** 表面靜止時無陰影（sh1 唯一例外是首頁卡片）。陰影是互動獎賞。

**The Blur is for Modals Only Rule.** `backdrop-filter: blur()` 只能用於 `.overlay` Modal 遮罩層。

---

## 5. Spacing & Radius

### 5.1 間距尺度（Spacing Scale）

| Token | 值 | SCSS 對應 | 常見使用場景 |
|---|---|---|---|
| `xs` | 4px | — | Icon gap、micro padding、tag 內距 |
| `sm` | 8px | — | Tag padding、row gap、徽章間距 |
| `md` | 14px | — | Filter group gap、標準欄位間距 |
| `lg` | 20px | — | Section padding、卡片 padding、navbar padding |
| `xl` | 30px | — | Detail body padding、大區塊 padding |

**補充常用值：** 10px（tree-item gap）、12px（卡片 margin-bottom）、16px（section border padding）、24px（sub-header padding）均為 lg 的中間步級，出現在元件層不在尺度變數中宣告。

### 5.2 圓角尺度（Radius Scale）

| Token | SCSS 變數 | 值 | 用途 |
|---|---|---|---|
| `sm` | `$r-sm` | 4px | 按鈕、輸入框、chips、toolbar 按鈕 |
| `md` | `$r-md` | 10px | 文件卡片、Tree Panel、Step Content |
| `lg` | `$r-lg` | 16px | 首頁功能卡片 |
| `xl` | `$r-xl` | 20px | Modal |
| `pill` | `$r-pill` | 20px | Tag pill、Toggle Track |

---

## 6. Components

元件設計標準：乾淨且精確。每個元件只傳達它需要傳達的資訊，沒有多餘的裝飾層。

### Buttons

| 變體 | 背景 | 文字 | 圓角 | Padding | 用途 |
|---|---|---|---|---|---|
| Primary | `#0F3F85` | white | 4px | 10px 14px | 主要行動（處理流程、確認送出）|
| Gradient | `#2C8086` | white | 4px | 10px 14px | 新增類行動（新增範本）|
| Outline | white | `#2F3D50` | 4px | 10px 14px | 次要行動（一鍵下載）|
| Ghost | white | `#566578` | 4px | 8px 20px | Modal 清除條件 |
| Search | gradient | white | 4px | 8px 24px | Modal 搜尋送出 |

### Tags / Chips

| 變體 | 背景 | 文字 | 圓角 | 語意 |
|---|---|---|---|---|
| New | `#EDF7F6` | `#21B298` | 2px | 近期更新（矩形角，故意區隔 pill）|
| Favorable | `#21B298` | white | 20px | 從輕裁決 |
| Unfavorable | `#FF4D4D` | white | 20px | 從重裁決 |
| Law Filter | `#2C8086` | white | 20px | 法規篩選 tag（含移除按鈕）|

### Cards / Containers

- **首頁卡片 `.card`:** 圓角 16px，白底，sh1，hover 上移 2px + sh2 + 漸層邊框（background-clip）
- **案件卡片 `.case-card`:** 圓角 5px，白底，`#CBCBCB` 邊框，hover sh2 + `#A0B5D8` 邊框
- **文件卡片 `.doc-card`:** 圓角 10px，白底，`$bdr` 邊框
- **Step Content:** 圓角 10px，`$bg-page` 底色，padding 20px
- **Tree Panel:** 圓角 10px，`#EBF1F7` 底色，無邊框

### Inputs

- **預設：** 白底，1.5px `#CDD8E8` 邊框，圓角 4px
- **Focus：** 邊框轉 `$bdr-focus`（`#2457A7`）+ box-shadow `0 0 0 3px rgba(36,87,167,0.25)`
- **Placeholder：** `#B0BECA`（比 `$tx-light` 再淡）
- **表單字號：** 16px（防 iOS Safari 自動縮放）

### Navigation

| 元件 | 高度 | 背景 | 備注 |
|---|---|---|---|
| Topbar | 56px | `$grad-h` | 漸層識別帶，全系統最高優先視覺錨點 |
| Sidebar | 240px wide | white | `is-active` 漸層背景，縮合至 56px |
| Tree Panel | — | `#EBF1F7` | Tab 高度 50px，item padding 14px 10px |
| Side Panel | 560px wide | white | 0.28s cubic-bezier 滑入，頂部 44px 漸層帶 |

---

## 7. Do's and Don'ts

### Do

- **Do** 使用品牌漸層（`#2C8086 → #3145A5`）作為 Topbar 和功能性 Header 的識別帶
- **Do** 讓卡片靜止時平坦，hover 才升至 sh2
- **Do** 以字重（400 → 600 → 700）和字號完成視覺層次，不靠顏色數量增加
- **Do** 將 `$primary`（`#0F3F85`）保留給最主要的行動元素，確保稀有性
- **Do** Focus 狀態使用 box-shadow 而非 outline，與圓角對齊
- **Do** `status-green` / `status-red` 只對應裁決結果，不作通用狀態色
- **Do** 以底色差異（bg-page → bg-tree → bg-surface）建立左側導覽層次

### Don't

- **Don't** ERP 密集風格：零間距、多層索引標籤疊加
- **Don't** 傳統政府入口網站：過時藍白配色、滿版文字連結
- **Don't** 極簡白底工具（Notion/Linear）：全白無識別感
- **Don't** `border-left > 1px` 彩色條紋作卡片/說明區塊強調
- **Don't** 漸層文字（`background-clip: text`），強調靠字重
- **Don't** 漸層用於 Topbar 以外表面
- **Don't** Glassmorphism，blur 只在 Modal 遮罩層合法
- **Don't** 同一畫面超過三種邊框顏色（`$bdr` / `$bdr-focus` / `$primary`）
