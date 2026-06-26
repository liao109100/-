# 開發筆記 / 已知 Bug 模式

## 共用 onclick 處理器不要依賴殘留的模組層旗標（2026-06-26）

**問題模式：** 同一個 onclick handler 被用在多個分類（處分案例 vs 海關答聯單）共用的列表項目上時，
如果處理函式靠模組層級的旗標（如 `Nav._flowSource`）判斷目前是哪個分類，而不是從被點擊的元素直接讀取，
就會因為旗標沒有在每次呼叫時更新、沿用上一次殘留的值，導致對應到錯誤的分類內容。

此 bug 模式在同一次開發中出現過至少兩次：

1. 處分案例列表的「處理流程」按鈕呼叫 `KM.goFlowList()`（沒帶 `source` 參數），
   導致沿用海關答聯單殘留的 `_flowSource`，編輯頁顯示錯誤分類的流程。
   → 修正：呼叫處明確帶入 `KM.goFlowList('cases')`。
2. 待審表單詳情頁所有列共用同一個 `KM.goFlowReviewView(true)` 呼叫
   （沒有區分列所屬的 `.pending-group`），同樣導致 `_flowSource` 沿用殘留值，
   點海關答聯單的「檢視」卻顯示處分案例流程。
   → 修正：`goFlowReviewView(fromPending, el)` 改為從 `el.closest('.pending-group').dataset.group`
   讀取所屬分類，HTML 端 onclick 一併補上 `this`。

**日後規則：** 任何跨分類共用的 onclick 邏輯（包含未來其他 6 個主功能上線後新增的類似清單頁），
都要從觸發元素的 DOM 結構（`closest('.xxx-group')`、`dataset.category` 等）即時判斷所屬分類，
不要讀取任何「上次設定」的全域/模組變數。

**驗證狀態：** 截至 2026-06-26，處分案例／海關答聯單之間的麵包屑跨主功能導航，
以及待審表單詳情頁「檢視」對應到正確流程分類，皆已修正並經使用者確認。
