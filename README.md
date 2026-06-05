# 國貿署 KM 系統 — 前端原型

## 目錄結構

```
trade-km/
├── index.html          # 主頁面（HTML 結構）
├── scss/               # SCSS 樣式原始碼
│   ├── _variables.scss # Design Tokens（顏色、尺寸、漸層…）
│   ├── _base.scss      # Reset + :root CSS 變數 + 動畫
│   ├── _home.scss      # 首頁（Home Dashboard）
│   ├── _layout.scss    # App 佈局（Topbar / Sidebar / Main / 搜尋列）
│   ├── _components.scss# Tree / Cards / Side Panel / Modals / Buttons
│   └── main.scss       # Entry Point（@use 所有 partials）
├── css/                # ← 編譯後放這裡（git ignore）
│   └── main.css        # 由 SCSS 編譯產生
└── js/
    └── main.js         # 前端互動邏輯（模組化，掛載至 window.KM）
```

## 品牌設計規範

| Token         | 值                                      |
|---------------|----------------------------------------|
| 漸層（水平）   | `#2C8085` → `#3145A5`（左至右）         |
| 主要文字色     | `#2F3D50`                              |
| 中性文字色     | `#566578`                              |
| 輔助文字色     | `#8898AA`                              |
| 頁面背景       | `#F0F4F9`                              |
| 邊框色         | `#D8E2EE`                              |
| Keyword Highlight | `#FFF176`（黃色）                    |

漸層應用位置：
- Topbar 導覽列
- Sidebar active 選項
- Card icon 背景
- Modal 搜尋按鈕、確認按鈕
- 進階搜尋 active Tab
- Side Panel 頂部欄

## 快速開始

### 安裝 Sass 並編譯

```bash
# 安裝（需要 Node.js）
npm install -g sass

# 一次性編譯
sass scss/main.scss css/main.css

# 監聽模式（開發時使用）
sass --watch scss/main.scss css/main.css

# 壓縮輸出（生產環境）
sass scss/main.scss css/main.css --style=compressed
```

### 直接預覽（不需編譯）

若不想安裝 Sass，可直接將 `<link rel="stylesheet" href="css/main.css">` 替換為內聯 `<style>` 標籤，貼入編譯後的 CSS 內容。

## JavaScript API（window.KM）

| 方法                            | 說明                           |
|---------------------------------|-------------------------------|
| `KM.goApp()`                    | 切換至 App 頁                  |
| `KM.goHome()`                   | 回到首頁                       |
| `KM.onSearch(value)`            | 搜尋輸入事件                   |
| `KM.clearSearch()`              | 清除搜尋                       |
| `KM.switchTab('ex'\|'im')`      | 切換出口 / 進口 Tab            |
| `KM.selectTree(el, title)`      | 選取樹狀選單項目               |
| `KM.openPanel()`                | 開啟側滑面板                   |
| `KM.closePanel()`               | 關閉側滑面板                   |
| `KM.openModal(id)`              | 開啟指定 Modal                 |
| `KM.closeModal(id)`             | 關閉指定 Modal                 |
| `KM.submitSearch()`             | 執行進階搜尋                   |
| `KM.clearAdvanced()`            | 清除進階搜尋條件               |
| `KM.toggleLawItem(el)`          | 切換法規選項                   |
| `KM.filterLawList(query)`       | 過濾法規清單                   |
| `KM.confirmLaws()`              | 確認法規選擇                   |
| `KM.toast(msg?)`                | 顯示輕提示訊息                 |
