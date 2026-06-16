/**
 * main.js
 * 國貿署 KM 系統 — 前端互動邏輯
 *
 * 模組結構：
 *   Nav        — 頁面切換（Home ↔ App）
 *   Search     — 搜尋列邏輯（輸入、清除、結果顯示）
 *   Tree       — 左側樹狀選單（Tab 切換、選項選取）
 *   SidePanel  — 右側側滑面板
 *   Sidebar    — 側欄縮合
 *   Modal      — 進階搜尋 & 法規選擇彈窗
 *   Toast      — 輕提示訊息
 *   FileModal  — 附件下載彈窗（顯示同一卡片所有附件）
 *   Render     — 共用內容動態渲染（資料來源：js/data.js）
 *   Init       — DOM 事件綁定入口
 */

'use strict';

// ─────────────────────────────────────────────────────────
//  工具函式
// ─────────────────────────────────────────────────────────

/** 安全取得 DOM 元素 */
const $ = id => document.getElementById(id);

/** HTML 跳脫（防 XSS） */
const esc = str =>
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;');

// ─────────────────────────────────────────────────────────
//  Nav — 頁面切換
// ─────────────────────────────────────────────────────────
const SCREENS = ['home', 'app', 'app-flow-list', 'app-flow-edit', 'app-case-detail', 'app-customs', 'app-customs-detail', 'app-new-case'];

const Nav = {
  _show(id) {
    SCREENS.forEach(s => $(s)?.classList.remove('on'));
    $(id)?.classList.add('on');
  },

  goApp() {
    this._show('app');
  },

  goHome() {
    this._show('home');
    SidePanel.close();
    Search.clear();
  },

  goCustoms() {
    this._show('app-customs');
  },

  goCustomsDetail() {
    this._show('app-customs-detail');
  },

  goCaseDetail() {
    SidePanel.close();
    this._show('app-case-detail');
  },

  goFlowList() {
    this._show('app-flow-list');
  },

  goNewCase() {
    this._show('app-new-case');
    NewCase.init();
  },

  goFlowEdit() {
    // 進入編輯模式 → 確保清除 view mode
    const screen = $('app-flow-edit');
    if (screen) screen.classList.remove('is-view-mode');
    const banner = $('flow-view-banner');
    if (banner) banner.style.display = 'none';
    document.querySelectorAll('#app-flow-edit .btn--search, #app-flow-edit .btn--clear, .flow-add-btn')
      .forEach(b => b.style.display = '');
    this._show('app-flow-edit');
    FlowEdit.init();
  },

  goFlowView() {
    // 進入檢視模式 → 設定 view mode，不清除
    const screen = $('app-flow-edit');
    if (screen) screen.classList.add('is-view-mode');
    const banner = $('flow-view-banner');
    if (banner) banner.style.display = 'flex';
    document.querySelectorAll('#app-flow-edit .btn--search, #app-flow-edit .btn--clear, .flow-add-btn')
      .forEach(b => b.style.display = 'none');
    this._show('app-flow-edit');
    FlowEdit.init();
  },
};

// ─────────────────────────────────────────────────────────
//  Search — 搜尋列
// ─────────────────────────────────────────────────────────
const Search = {
  /** 輸入事件 */
  onInput(rawValue) {
    const v = rawValue.trim();
    const hasValue = !!v;
    const kw = v.toLowerCase();

    $('search-clear-btn')?.classList.toggle('is-visible', hasValue);
    $('filter-btn')?.classList.toggle('is-active', hasValue);
    $('preset-chip')?.classList.toggle('is-hidden', hasValue);

    // 過濾卡片
    const cards = document.querySelectorAll('.case-card');
    let visibleCount = 0;
    cards.forEach(card => {
      const text = (card.dataset.text || '').toLowerCase();
      const match = !hasValue || kw.split(/[,，;；]+/).some(k => k.trim() && text.includes(k.trim()));
      card.classList.toggle('is-filtered-out', !match);
      if (match) visibleCount++;
      card.querySelectorAll('.snippet-block').forEach(s => {
        s.classList.toggle('is-visible', hasValue && match);
      });
    });

    // 更新關鍵字標記
    const firstKw = v.split(/[,，;；]/)[0].trim() || v;
    document.querySelectorAll('.kw-mark, [id^="kw-mark-"]').forEach(el => {
      el.textContent = firstKw;
    });

    $('result-info')?.classList.toggle('is-visible', hasValue);
    if (hasValue) {
      $('result-info').innerHTML =
        `與「<mark>${esc(v)}</mark>」相符的所有搜尋結果，查詢結果共計 <strong>${visibleCount}</strong> 筆`;
    }

    TreeCount.refresh();
  },

  /** 清除搜尋 */
  clear() {
    const input = $('search-input');
    if (input) input.value = '';
    document.querySelectorAll('.case-card.is-filtered-out')
      .forEach(c => c.classList.remove('is-filtered-out'));
    this.onInput('');
  },
};

// ─────────────────────────────────────────────────────────
//  FlowEdit — 流程編輯（步驟 DnD + 選取 + 標題同步）
// ─────────────────────────────────────────────────────────
// ── 流程步驟假資料 ──────────────────────────────────────────────
const FLOW_STEPS_DATA = [
  {
    title: '接收海關發《違章案件移送書》',
    body: `<p>接收海關發來之違章案件移送書及相關證明文件，確認案件基本資料是否完整，包括進出口報單號碼、違章事實說明、當事人資料等必要資訊。</p><p>核對移送書所附文件是否齊全，如有缺漏應即通知海關補件，並於系統中建立案件基本檔案。</p>`
  },
  {
    title: '確認管轄權與違規事實',
    body: `<p>依貿易法規定確認本署是否具有管轄權，釐清違規行為是否屬於貿易法第17條至第28條所規範之範疇。</p><p>比對進出口報單、產地聲明書及相關文件，確認違規事實是否成立，並記錄違規性質（如產地標示不實、未依規定申報等）。</p><p>如屬管轄爭議案件，應依職務管轄規定移送權責機關，並留存移送紀錄。</p>`
  },
  {
    title: '發函通知廠商暨回收廠商回覆',
    body: `<p>依行政程序法第102條規定，以書面通知當事人（廠商）就違規事實及擬處分情形表示意見，給予陳述意見之機會。</p><p>函文應載明：案件概要、違規法條依據、廠商回覆期限（通常為10至14工作日）及聯絡窗口。</p><p>回覆期限屆滿後，彙整廠商所提供之說明文件及抗辯理由，納入後續審查。</p>`
  },
  {
    title: '核相關資料',
    body: `<p>就廠商回覆之說明及所附文件，進行實質審核：</p><p><strong>一、</strong> 核對原產地認定標準（實質轉型規定），確認加工程序是否達到實質轉型門檻。</p><p><strong>二、</strong> 比對相關法規規定與歷史案例，判斷本案違規情節輕重。</p><p><strong>三、</strong> 如有需要，得請海關或相關機關提供補充文件，或委請鑑定機構出具意見。</p>`
  },
  {
    title: '初步處分決策',
    body: `<p>由承辦人員依審核結果，研擬初步裁處意見，包含：</p><p>● 違規事實認定及適用法條（貿易法第28條第1項各款）</p><p>● 裁處類型：警告、停止輸出入許可、或罰鍰（3萬至300萬元）</p><p>● 從輕或從重量處之建議依據（如主動申報、情節輕微、初犯等）</p><p>初步意見提送組長或科長審閱，如有疑義退回重查或召開案件研討。</p>`
  },
  {
    title: '送簽審與最終處分決定',
    body: `<p>完成簽辦文件後，依授權層級送核：</p><p>● 罰鍰30萬元（含）以下：組長核定</p><p>● 罰鍰30萬元以上或涉及停止輸出入：署長或副署長核定</p><p>核定後，如有必要召開裁決委員會，就案件進行集體審議，確保處分決定之合法性與一致性。</p>`
  },
  {
    title: '發出處分書與結案',
    body: `<p>依行政程序法第96條規定，製作行政處分書，內容應記載：</p><p><strong>一、</strong> 相對人（廠商）基本資料</p><p><strong>二、</strong> 主文：處分類型與金額</p><p><strong>三、</strong> 事實與理由：違規事實、適用法條、量處依據</p><p><strong>四、</strong> 救濟告知：申請訴願之期限（30日內）及受理機關</p><p>以雙掛號郵寄送達當事人，並於系統中登錄送達回執及結案日期。</p>`
  },
  {
    title: '追蹤後續結果',
    body: `<p>結案後應追蹤下列事項：</p><p>● <strong>罰鍰繳納</strong>：確認當事人是否於期限內繳納罰鍰，逾期移送行政執行署強制執行。</p><p>● <strong>訴願申請</strong>：如當事人提起訴願，依程序轉送訴願委員會，並配合補充答辯資料。</p><p>● <strong>行政訴訟</strong>：如進入行政訴訟階段，協助法務單位準備訴訟文件。</p><p>● <strong>案例歸檔</strong>：將本案處理結果歸檔，供後續相似案件參考。</p>`
  }
];

const FlowEdit = {
  dragSrc: null,

  init() {
    const isView = $('app-flow-edit')?.classList.contains('is-view-mode');
    if (!isView) this.bindDrag();  // 檢視模式不綁 drag
    // 檢視模式設 contenteditable="false"
    const body = $('flow-rich-body');
    if (body) body.contentEditable = isView ? 'false' : 'true';
    const first = document.querySelector('#flow-step-list .step-card');
    if (first) this.selectStep(first);
  },

  bindDrag() {
    document.querySelectorAll('#flow-step-list .step-card').forEach(card => {
      card.addEventListener('dragstart', e => { this.dragSrc = card; e.dataTransfer.effectAllowed = 'move'; card.style.opacity = '0.5'; });
      card.addEventListener('dragend',   ()  => { card.style.opacity = '1'; document.querySelectorAll('#flow-step-list .step-card').forEach(c => c.classList.remove('drag-over')); });
      card.addEventListener('dragover',  e => { e.preventDefault(); if (card !== this.dragSrc) card.classList.add('drag-over'); });
      card.addEventListener('dragleave', ()  => card.classList.remove('drag-over'));
      card.addEventListener('drop',      e => { e.preventDefault(); this.drop(card); });
    });
  },

  drop(target) {
    if (!this.dragSrc || this.dragSrc === target) return;
    const list = document.getElementById('flow-step-list');

    // 移除所有 sep，只剩卡片，避免索引計算含 sep
    list.querySelectorAll('.step-sep').forEach(s => s.remove());

    const cards  = [...list.querySelectorAll('.step-card')];
    const srcIdx = cards.indexOf(this.dragSrc);
    const dstIdx = cards.indexOf(target);

    if (srcIdx < dstIdx) list.insertBefore(this.dragSrc, target.nextSibling);
    else                  list.insertBefore(this.dragSrc, target);

    target.classList.remove('drag-over');

    // 重建所有箭頭分隔
    this._rebuildSeps();
    this.renumber();
    this.bindDrag();
    // 移動後讓被拖動的卡片保持 active
    this.selectStep(this.dragSrc);
  },

  /** 依當前卡片順序重建 sep 箭頭 */
  _rebuildSeps() {
    const list  = document.getElementById('flow-step-list');
    const cards = [...list.querySelectorAll('.step-card')];
    list.querySelectorAll('.step-sep').forEach(s => s.remove());
    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        const sep = document.createElement('div');
        sep.className   = 'step-sep';
        sep.textContent = '↓';
        card.after(sep);
      }
    });
  },

  renumber() {
    document.querySelectorAll('#flow-step-list .step-card').forEach((card, i) => {
      card.querySelector('.step-num').textContent = `Step${i + 1}`;
    });
  },

  selectStep(card) {
    document.querySelectorAll('#flow-step-list .step-card').forEach(c => c.classList.remove('is-active'));
    card.classList.add('is-active');
    const numText = card.querySelector('.step-num')?.textContent || '';
    const title   = card.querySelector('.step-title-sm')?.textContent || '';

    const numEl   = $('flow-right-num');
    const titleEl = $('flow-right-title');
    const bodyEl  = $('flow-rich-body');
    if (numEl)   numEl.textContent = numText;
    if (titleEl) titleEl.value     = title;

    // 載入對應步驟的假資料內容
    if (bodyEl) {
      const idx  = parseInt(numText.replace(/\D/g, ''), 10) - 1;
      const data = FLOW_STEPS_DATA[idx];
      if (data) {
        bodyEl.innerHTML = data.body;
        if (titleEl) titleEl.value = data.title;
        card.querySelector('.step-title-sm').textContent = data.title;
      }
    }
  },

  updateTitle(val) {
    const active = document.querySelector('#flow-step-list .step-card.is-active');
    if (active) active.querySelector('.step-title-sm').textContent = val;
  },

  addStep() {
    const list = document.getElementById('flow-step-list');

    // 建立新步驟卡（獨特樣式）
    const card = document.createElement('div');
    card.className = 'step-card step-card--new';
    card.draggable = true;
    card.innerHTML = `
      <div class="step-drag">⠿</div>
      <div class="step-info">
        <div class="step-num">Step</div>
        <div class="step-title-sm">新步驟</div>
      </div>`;
    card.querySelector('.step-info').addEventListener('click', () => this.selectStep(card));

    list.insertBefore(card, list.firstChild);
    this._rebuildSeps();
    this.renumber();
    this.bindDrag();
    this.selectStep(card);
  },
};

// ─────────────────────────────────────────────────────────
//  FlowList — 流程清單（草稿 / 發佈 / 預設）
// ─────────────────────────────────────────────────────────
// 目前選中的 flow-row（供複製用）
let _selectedFlowRow = null;

const FlowList = {
  /** 點擊 flow-row 選中效果 */
  selectRow(el) {
    document.querySelectorAll('#app-flow-list .flow-row').forEach(r => r.classList.remove('is-selected'));
    el.classList.add('is-selected');
    _selectedFlowRow = el;
  },

  save() {
    Nav.goFlowList();
    const draftRow = $('flow-draft-row');
    if (draftRow) draftRow.style.display = '';
    const editBtn = $('flow-1-edit-btn');
    if (editBtn) editBtn.style.display = 'none';
    Toast.show('草稿已儲存');
  },

  publish() {
    const draft   = $('flow-draft-row');
    const archive = $('flow-1-archive');
    const ver     = $('flow-1-version');
    if (draft)   draft.style.display   = 'none';
    if (archive) archive.style.display = '';
    if (ver)     ver.textContent       = 'v3.1';
    const editBtn = $('flow-1-edit-btn');
    if (editBtn) editBtn.style.display = '';
    Toast.show('發佈成功！流程已更新至 v3.1');
  },

  setDefault(id) {
    [1, 2, 3].forEach(i => {
      const t = $(`toggle-${i}`);
      if (t) t.classList.toggle('is-on', i === id);
    });
    const container  = $('flow-group-list');
    const target     = $(`flow-group-${id}`);
    const firstGroup = container?.querySelector('.flow-group');
    if (container && target && target !== firstGroup) {
      container.insertBefore(target, firstGroup);
    }
  },

  /** 複製選中（或第一個）的流程，附加到清單最下方 */
  copy() {
    const list   = $('flow-group-list');
    const source = _selectedFlowRow?.closest('.flow-group') || list?.querySelector('.flow-group');
    if (!source || !list) { Toast.show('請先點選要複製的流程'); return; }

    const clone = source.cloneNode(true);
    clone.id = 'flow-group-copy-' + Date.now();
    // 僅保留第一個 flow-row（移除草稿/封存列）
    clone.querySelectorAll('.flow-row--draft, .flow-row--archive').forEach(r => r.remove());
    const row = clone.querySelector('.flow-row');
    if (row) {
      row.classList.remove('flow-row--active', 'is-selected');
      // 標題加「（複本）」
      const nameEl = row.querySelector('.flow-name');
      if (nameEl && !nameEl.textContent.includes('（複本）')) nameEl.textContent += '（複本）';
      // 版本重置
      const verEl = row.querySelector('.flow-version'); if (verEl) verEl.textContent = 'v1.0';
      // 日期更新
      const dateEl = row.querySelector('.flow-date'); if (dateEl) dateEl.textContent = new Date().toLocaleDateString('zh-TW');
      // 移除預設 toggle
      row.querySelectorAll('.toggle-track')?.forEach(t => { const wrap = t.closest('[style*="flex"]') || t.parentNode; wrap?.remove(); });
      // 加草稿標籤
      const badge = document.createElement('span');
      badge.className = 'flow-draft-badge'; badge.textContent = '複本';
      row.insertBefore(badge, row.firstChild);
      // click handler
      row.setAttribute('onclick', 'KM.flowSelectRow(this)');
    }
    list.appendChild(clone);
    clone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    Toast.show('已複製流程，顯示於清單末端');
  },

  /** 進入檢視模式（唯讀） */
  view() {
    Nav.goFlowView();
  },
};

// ─────────────────────────────────────────────────────────
//  TreeCount — 樹狀計數（依可見卡片動態更新）
// ─────────────────────────────────────────────────────────
const TreeCount = {
  refresh() {
    // 計算每個 data-category 的可見卡片數
    const counts = {};
    document.querySelectorAll('#app .case-card').forEach(card => {
      if (card.classList.contains('is-filtered-out')) return;
      const cat = card.dataset.category;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });

    // 更新每個 tree-item 的 tree-count
    document.querySelectorAll('#app .tree-item[data-cat]').forEach(item => {
      const cat = item.dataset.cat;
      const n = counts[cat] || 0;
      const span = item.querySelector('.tree-count');
      if (span) span.textContent = n;
    });

    // 計算 Tab 總計（出口 = ex-* 之和，進口 = im-* 之和）
    const exTotal = Object.entries(counts)
      .filter(([k]) => k.startsWith('ex-'))
      .reduce((s, [, v]) => s + v, 0);
    const imTotal = Object.entries(counts)
      .filter(([k]) => k.startsWith('im-'))
      .reduce((s, [, v]) => s + v, 0);

    const tabEx = $('tab-export');
    const tabIm = $('tab-import');
    if (tabEx) tabEx.textContent = `出口（${exTotal}）`;
    if (tabIm) tabIm.textContent = `進口（${imTotal}）`;
  },
};

// ─────────────────────────────────────────────────────────
//  Tree — 樹狀選單
// ─────────────────────────────────────────────────────────
const Tree = {
  /** 切換出口 / 進口 Tab，自動選中第一個項目 */
  switchTab(type) {
    const tEx = $('tree-export');
    const tIm = $('tree-import');
    const bEx = $('tab-export');
    const bIm = $('tab-import');

    const isExport = type === 'ex';
    tEx.style.display = isExport ? '' : 'none';
    tIm.style.display = isExport ? 'none' : '';
    bEx.className = 'tree-tab ' + (isExport ? 'is-active' : 'is-inactive');
    bIm.className = 'tree-tab ' + (isExport ? 'is-inactive' : 'is-active');

    // 自動選中新 Tab 的第一個項目，確保右側不為空
    const activeList = isExport ? tEx : tIm;
    const first = activeList?.querySelector('.tree-item');
    if (first) {
      const title = first.querySelector('span:not(.tree-count):not(.tree-folder)')?.textContent.trim() || '';
      this.select(first, title);
    }
  },

  /** 選取樹狀項目，更新右側標題 */
  select(el, title) {
    document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('is-active'));
    el.classList.add('is-active');
    $('section-title').textContent = title;
    SidePanel.close();
  },
};

// ─────────────────────────────────────────────────────────
//  SidePanel — 右側滑面板
// ─────────────────────────────────────────────────────────
const SidePanel = {
  open() {
    $('side-panel').classList.add('is-open');
    $('dim').classList.add('is-open');
  },

  close() {
    $('side-panel').classList.remove('is-open');
    $('dim').classList.remove('is-open');
  },
};

// ─────────────────────────────────────────────────────────
//  Sidebar — 側欄縮合
// ─────────────────────────────────────────────────────────
const Sidebar = {
  toggle() {
    const isCollapsed = document.querySelector('.sidebar-wrap')?.classList.contains('is-collapsed');
    document.querySelectorAll('.sidebar-wrap').forEach(w =>
      w.classList.toggle('is-collapsed', !isCollapsed)
    );
    document.querySelectorAll('.sidebar-toggle').forEach(btn =>
      btn.classList.toggle('is-collapsed', !isCollapsed)
    );
  },
};

// ─────────────────────────────────────────────────────────
//  Modal — 進階搜尋 & 法規選擇
// ─────────────────────────────────────────────────────────
const Modal = {
  open(id) {
    // ① 開啟進階搜尋時同步主搜尋欄關鍵字
    if (id === 'modal-adv') {
      const mainKw = $('search-input')?.value.trim() || '';
      const advKw  = $('adv-keyword');
      if (advKw && mainKw) advKw.value = mainKw;
      this._syncLawPlaceholder();
    }
    const el = $(id);
    if (el) el.classList.add('is-open');
  },

  close(id) {
    const el = $(id);
    if (el) el.classList.remove('is-open');
  },

  /** Overlay 點擊關閉（僅點擊背景本身） */
  overlayClick(event, id) {
    if (event.target === $(id)) this.close(id);
  },

  // ── 進階搜尋 Modal ─────────────────────────────────────
  setSearchMode(btn) {
    btn.closest('.modal-tabs')
       .querySelectorAll('.modal-tab')
       .forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  },

  removeFilterTag(id) {
    const el = $(id);
    if (!el) return;
    const lawText = el.dataset.law;
    el.remove();
    // 同步取消法規 modal 中的勾選
    if (lawText) {
      document.querySelectorAll('#law-list .law-item').forEach(item => {
        if (item.querySelector('label')?.textContent.trim() === lawText) {
          item.classList.remove('is-checked');
          const cb = item.querySelector('input[type="checkbox"]');
          if (cb) cb.checked = false;
        }
      });
      Modal._updateLawCount();
      Modal._syncLawPlaceholder();  // ③ 移除 tag 後更新 placeholder
    }
  },

  clearAdvanced() {
    $('adv-keyword').value = '';
    document.querySelectorAll('#modal-adv .filter-tag').forEach(t => t.remove());
    ['penalty-all', 'penalty-1', 'penalty-2', 'penalty-3'].forEach(id => {
      const el = $(id);
      if (el) el.checked = false;
    });
    // ② 重置日期選擇器
    const sel = $('date-range-select');
    if (sel) { sel.value = '近一年'; this.handleDateRange(sel); }
    if (window._datePicker) window._datePicker.clear();
    // ③ 恢復法規 placeholder
    this._syncLawPlaceholder();
  },

  submitSearch() {
    const kw = $('adv-keyword').value.trim() || '出口貿易限制';
    this.close('modal-adv');
    const input = $('search-input');
    if (input) {
      input.value = kw;
      Search.onInput(kw);
    }
    // ④⑤ TreeCount.refresh() 已在 Search.onInput 末尾呼叫
    // 自動切換到結果較多的 Tab
    const counts = {};
    document.querySelectorAll('#app .case-card:not(.is-filtered-out)').forEach(c => {
      const cat = c.dataset.category || '';
      const tab = cat.startsWith('im-') ? 'im' : 'ex';
      counts[tab] = (counts[tab] || 0) + 1;
    });
    if ((counts.im || 0) > (counts.ex || 0)) Tree.switchTab('im');
    else Tree.switchTab('ex');
  },

  // ── 法規選擇 Modal ─────────────────────────────────────
  toggleLawItem(item) {
    const cb = item.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    item.classList.toggle('is-checked', cb.checked);
    this._updateLawCount();
  },

  filterLawList(query) {
    const ql = query.toLowerCase();
    document.querySelectorAll('#law-list .law-item').forEach(item => {
      const text = item.querySelector('label').textContent.toLowerCase();
      item.style.display = text.includes(ql) ? '' : 'none';
    });
  },

  // ── 法規 modal context（寫入目標 id + 關閉後返回哪個 modal）──
  _lawTagsId    : 'law-tags',
  _lawReturnTo  : 'modal-adv',

  /** X 關閉法規 modal（依 context 決定是否返回上層 modal） */
  closeLaw() {
    this.close('modal-law');
    if (this._lawReturnTo) this.open(this._lawReturnTo);
  },

  /** 開啟法規選擇 modal，呼叫端可指定寫入目標與返回目標 */
  openLaw(tagsId, returnTo) {
    this._lawTagsId   = tagsId   || 'law-tags';
    this._lawReturnTo = returnTo !== undefined ? returnTo : 'modal-adv';
    // 清除勾選狀態，避免上次殘留
    document.querySelectorAll('#law-list .law-item').forEach(item => {
      item.classList.remove('is-checked');
      const cb = item.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = false;
    });
    this._updateLawCount();
    this.open('modal-law');
  },

  confirmLaws() {
    const tagArea = $(this._lawTagsId);
    if (tagArea) {
      tagArea.innerHTML = '';
      document.querySelectorAll('#law-list .law-item.is-checked').forEach((item, i) => {
        const text = item.querySelector('label')?.textContent.trim() || '';
        const tagId = `law-tag-${this._lawTagsId}-${i}`;
        const tag = document.createElement('span');
        tag.className = 'filter-tag';
        tag.id = tagId;
        tag.dataset.law = text;
        tag.innerHTML =
          esc(text) +
          `<button class="filter-tag-remove" onclick="event.stopPropagation();KM.removeFilterTag('${tagId}')"><span class="mi">close</span></button>`;
        tagArea.appendChild(tag);
      });
      this._syncLawPlaceholder(tagArea);
    }
    this.close('modal-law');
    if (this._lawReturnTo) this.open(this._lawReturnTo);
  },

  _updateLawCount() {
    const count = document.querySelectorAll('#law-list .law-item.is-checked').length;
    const el = $('law-count');
    if (el) el.textContent = count;
  },

  // ② 日期區間選擇器切換
  handleDateRange(sel) {
    const isCustom = sel.value === '自訂區間';
    const input = $('date-picker-input');
    if (!input) return;
    input.disabled = !isCustom;
    input.style.opacity = isCustom ? '1' : '0.4';
    if (isCustom && window._datePicker) window._datePicker.open();
    else if (!isCustom && window._datePicker) window._datePicker.clear();
  },

  // ③ 法規 Placeholder 同步（area 可為 element 或不傳（預設 law-tags））
  _syncLawPlaceholder(area) {
    const el = area instanceof Element ? area : $('law-tags');
    if (!el) return;
    const hasTags = el.querySelector('.filter-tag');
    let ph = el.querySelector('.law-ph');
    if (!ph) {
      ph = document.createElement('span');
      ph.className = 'law-ph';
      ph.textContent = '點擊選擇涉及法規...';
      el.appendChild(ph);
    }
    ph.style.display = hasTags ? 'none' : '';
  },

  // ── 裁罰金額「全部」聯動 ─────────────────────────────
  handlePenaltyAll(checked) {
    ['penalty-1', 'penalty-2', 'penalty-3'].forEach(id => {
      const el = $(id);
      if (el) el.checked = checked;
    });
  },
};

// ─────────────────────────────────────────────────────────
//  FileModal — 附件下載彈窗（顯示同一卡片所有附件）
// ─────────────────────────────────────────────────────────
const FileModal = {
  open(el) {
    const container = el.closest('.attach-row, .detail-attach-bar, .doc-card')
      ?? el.parentElement;
    const pills = Array.from(container.querySelectorAll('.attach-pill'));

    $('file-dl-list').innerHTML = pills.map((pill, i) => {
      const icon = pill.querySelector('.mi')?.textContent ?? '';
      const name = esc(pill.textContent.replace(icon, '').trim());
      const border = i < pills.length - 1 ? 'border-bottom:1px solid #EEF0F4;' : '';
      return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;${border}">
        <span class="mi" style="color:#2C8086;font-size:22px;flex-shrink:0">picture_as_pdf</span>
        <span style="flex:1;font-size:14px;color:#1E293B;word-break:break-all">${name}</span>
        <button class="btn btn--gray-outline" style="padding:4px 14px;font-size:12px;white-space:nowrap" onclick="KM.toast()">↓ 下載</button>
      </div>`;
    }).join('');

    Modal.open('modal-file-dl');
  },
};

// ─────────────────────────────────────────────────────────
//  Toast — 輕提示
// ─────────────────────────────────────────────────────────
const Toast = {
  show(msg = '功能開發中...') {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position     : 'fixed',
      bottom       : '28px',
      left         : '50%',
      transform    : 'translateX(-50%)',
      background   : 'rgba(44, 63, 90, 0.90)',
      color        : 'white',
      padding      : '8px 20px',
      borderRadius : '20px',
      fontSize     : '13px',
      zIndex       : '9999',
      pointerEvents: 'none',
      animation    : 'fadeIn 0.18s ease',
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1500);
  },
};

// ─────────────────────────────────────────────────────────
//  Render — 共用內容動態渲染（資料來源：js/data.js）
// ─────────────────────────────────────────────────────────
const Render = {
  /** Sidebar 選單（依 [data-sidebar] 容器產生對應 active 項目） */
  sidebars() {
    document.querySelectorAll('[data-sidebar]').forEach(scr => {
      const aside = scr.querySelector('.sidebar');
      const logo  = aside?.querySelector('.sidebar-logo');
      if (!logo) return;

      const activeKey = scr.dataset.sidebar;
      const html = SIDEBAR_ITEMS.map(item => {
        const isActive = item.key === activeKey;
        const cls = 'sidebar-item' + (isActive ? ' is-active' : '');
        const onclick = isActive ? '' : ` onclick="KM.${item.action}()"`;
        return `<div class="${cls}"${onclick}>
      <svg width="16" height="16" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${item.icon}" fill="currentColor"/>
      </svg>
      ${esc(item.label)}
    </div>`;
      }).join('');

      logo.insertAdjacentHTML('afterend', html);
    });
  },

  /** 首頁功能卡片 */
  homeCards() {
    const el = $('home-grid');
    if (!el) return;
    el.innerHTML = HOME_CARDS.map(c => `<div class="card" onclick="KM.${c.action}()">
        <div class="card-ico">
          <img src="img/${c.icon}" alt="${esc(c.alt)}">
        </div>
        ${c.featured ? '<div class="card-arrow">→</div>' : ''}
        <div class="card-title">${esc(c.title)}</div>
        ${c.sub ? `<div class="card-sub">${esc(c.sub)}</div>` : ''}
      </div>`).join('');
  },

  /** 首頁最新異動 */
  news() {
    const el = $('news-list');
    if (!el) return;
    el.innerHTML = NEWS_ITEMS.map(n => `<div class="news-card">
        <div class="news-row">
          <span class="news-tag">${esc(n.tag)}</span>
          <span class="news-date">${esc(n.date)}</span>
        </div>
        <div class="news-title">${esc(n.title)}</div>
        <div class="news-body">${esc(n.body)}</div>
      </div>`).join('');
  },

  /** 首頁常用連結 */
  quickLinks() {
    const el = $('quick-links');
    if (!el) return;
    el.innerHTML = QUICK_LINKS.map(q => `<div class="quick-item">
          <img src="img/${q.icon}" alt="">
          ${esc(q.label)}
        </div>`).join('');
  },

  /** 處分案樣態樹狀清單（出口 / 進口） */
  tree() {
    const treeItem = (item) => {
      const cls = 'tree-item' + (item.active ? ' is-active' : '');
      const arg = (item.arg ?? item.label).replace(/'/g, "\\'");
      return `<div class="${cls}" data-cat="${item.cat}" onclick="KM.selectTree(this,'${arg}')">
              <span class="tree-folder"></span>
              <span>${esc(item.label)}</span>
              <span class="tree-count">0</span>
            </div>`;
    };

    const exEl = $('tree-export');
    const imEl = $('tree-import');
    if (exEl) exEl.innerHTML = TREE_EXPORT_ITEMS.map(treeItem).join('');
    if (imEl) imEl.innerHTML = TREE_IMPORT_ITEMS.map(treeItem).join('');
  },

  /** 於 init() 開頭呼叫，產生所有共用內容 */
  all() {
    this.sidebars();
    this.homeCards();
    this.news();
    this.quickLinks();
    this.tree();
  },
};

// ─────────────────────────────────────────────────────────
//  Init — DOM 事件綁定
// ─────────────────────────────────────────────────────────
function init() {
  // ── 動態內容渲染（Sidebar、首頁卡片、樹狀清單…）─────
  Render.all();

  // ── 鍵盤 Esc ────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('modal-law')?.classList.contains('is-open')) {
      Modal.closeLaw();  // 依 context 決定是否返回上層
      return;
    }
    if ($('modal-adv')?.classList.contains('is-open')) {
      Modal.close('modal-adv');
      return;
    }
    SidePanel.close();
  });

  // ── 裁罰金額「全部」checkbox ───────────────────────
  const penaltyAll = $('penalty-all');
  if (penaltyAll) {
    penaltyAll.addEventListener('change', function () {
      Modal.handlePenaltyAll(this.checked);
    });
  }
}

// ─────────────────────────────────────────────────────────
//  Download Modal
// ─────────────────────────────────────────────────────────
const Download = {
  updateCount() {
    const all   = document.querySelectorAll('#modal-download .dl-item-cb');
    const checked = document.querySelectorAll('#modal-download .dl-item-cb:checked');
    $('dl-selected-count').textContent = checked.length;
    // 全選 checkbox 狀態
    const cb = $('dl-check-all');
    if (cb) {
      cb.indeterminate = checked.length > 0 && checked.length < all.length;
      cb.checked = checked.length === all.length;
    }
  },

  toggleAll(checked) {
    document.querySelectorAll('#modal-download .dl-item-cb, #modal-download .dl-grp-cb')
      .forEach(cb => { cb.checked = checked; });
    this.updateCount();
  },

  /** 展開 / 縮合群組（不影響勾選狀態） */
  toggleGroup(hd) {
    const group = hd.closest('.dl-group');
    const isCollapsed = group.classList.toggle('is-collapsed');
    const chevron = hd.querySelector('.dl-chevron');
    if (chevron) chevron.textContent = isCollapsed ? 'chevron_right' : 'expand_more';
    this._syncGroupBadge(group);
  },

  /** 群組 checkbox：全選 / 取消該群組所有項目 */
  groupCb(cb) {
    const group = cb.closest('.dl-group');
    group.querySelectorAll('.dl-item-cb').forEach(item => { item.checked = cb.checked; });
    this._syncGroupBadge(group);
    this.updateCount();
  },

  /** 更新群組縮合時的已選數量提示 */
  _syncGroupBadge(group) {
    const checkedN = group.querySelectorAll('.dl-item-cb:checked').length;
    const totalN   = group.querySelectorAll('.dl-item-cb').length;
    const badge    = group.querySelector('.dl-checked-badge');
    const dlCount  = group.querySelector('.dl-group-hd .dl-count');
    const isCollapsed = group.classList.contains('is-collapsed');
    // 群組 checkbox indeterminate 狀態
    const grpCb = group.querySelector('.dl-grp-cb');
    if (grpCb) {
      grpCb.indeterminate = checkedN > 0 && checkedN < totalN;
      grpCb.checked = checkedN === totalN;
    }
    if (badge) {
      badge.textContent = `已選 ${checkedN} / ${totalN}`;
      badge.style.display = isCollapsed ? '' : 'none';
    }
    if (dlCount) dlCount.style.display = isCollapsed ? 'none' : '';
  },

  download() {
    const n = document.querySelectorAll('#modal-download .dl-item-cb:checked').length;
    if (n === 0) { Toast.show('請至少選擇一個項目'); return; }
    Modal.close('modal-download');
    Toast.show(`打包下載中… 共 ${n} 個項目`);
  },
};

// ─────────────────────────────────────────────────────────
//  NewCase — 新增範本案例
// ─────────────────────────────────────────────────────────
const NewCase = {
  _files: [],

  init() {
    this._files = [];
    this._renderFileList();
  },

  /** 出口/進口 切換 */
  switchType(type) {
    ['nc-tab-ex', 'nc-tab-im'].forEach(id => {
      const el = $(id);
      if (el) el.classList.toggle('is-active',   id === `nc-tab-${type}`);
      if (el) el.classList.toggle('is-inactive', id !== `nc-tab-${type}`);
    });
    // 更新樣態清單
    const cats = type === 'ex' ? [
      '未依規定標示產地：未見標示',
      '產地標示不實(1)：他國產製或國貨標成他國',
      '產地標示不實(2)：他國產製標成臺灣（加強管理）',
      '產地標示不實(3)：他國產製標成臺灣（其他）',
      '足以使人誤認產地',
      'CITES',
      '商標/仿冒(侵權)',
      '管制貨品(111)',
      '其他',
    ] : [
      '未依規定標示產地',
      '產地標示不實',
    ];
    const sel = $('nc-category');
    if (!sel) return;
    sel.innerHTML = '<option value="">請選擇樣態</option>' +
      cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  },

  /** 附件上傳 */
  handleFiles(input) {
    [...(input.files || [])].forEach(f => {
      this._files.push(f);
    });
    input.value = '';
    this._renderFileList();
  },

  removeFile(idx) {
    this._files.splice(idx, 1);
    this._renderFileList();
  },

  _renderFileList() {
    const list = $('nc-file-list');
    if (!list) return;
    if (this._files.length === 0) {
      list.innerHTML = '<span style="color:#8898AA;font-size:12px">尚未選擇任何附件</span>';
      return;
    }
    list.innerHTML = this._files.map((f, i) => `
      <div class="nc-file-item">
        <span class="mi" style="color:#2457A7;font-size:18px">attach_file</span>
        <span class="nc-file-name">${esc(f.name)}</span>
        <span class="nc-file-size">${(f.size / 1024).toFixed(0)} KB</span>
        <button class="nc-file-remove" onclick="KM.ncRemoveFile(${i})"><span class="mi">close</span></button>
      </div>`).join('');
  },

  /** 關聯案例 Modal */
  openRelated() {
    Modal.open('modal-related');
  },

  confirmRelated() {
    const checked = document.querySelectorAll('#nc-related-list .nc-related-item.is-checked');
    const area = $('nc-related-tags');
    if (!area) return;
    area.innerHTML = '';
    checked.forEach(item => {
      const label = item.querySelector('.nc-related-label')?.textContent || '';
      const tag = document.createElement('span');
      tag.className = 'filter-tag';
      tag.textContent = label;
      area.appendChild(tag);
    });
    if (area.children.length === 0) {
      area.innerHTML = '<span style="color:#8898AA;font-size:12px">點擊選擇關聯案例</span>';
    }
    Modal.close('modal-related');
  },

  toggleRelatedItem(item) {
    item.classList.toggle('is-checked');
  },

  /** 儲存 / 送出 */
  save(publish) {
    const title = $('nc-category')?.value;
    if (!title) { Toast.show('請先選擇樣態'); return; }
    Toast.show(publish ? '案例已發布！' : '草稿已儲存');
    Nav.goApp();
  },
};

// ─────────────────────────────────────────────────────────
//  Public API — 供 HTML inline event handlers 呼叫
// ─────────────────────────────────────────────────────────
const CustomsSearch = {
  onInput(v) {
    const val      = v.trim();
    const hasValue = !!val;
    const kw       = val.toLowerCase();

    $('customs-clear')?.classList.toggle('is-visible', hasValue);

    // 過濾卡片（與處分案範例相同邏輯）
    const cards = document.querySelectorAll('#app-customs .customs-card');
    let visible = 0;
    cards.forEach(card => {
      const text  = (card.dataset.text || '').toLowerCase();
      const match = !hasValue || kw.split(/[,，;；]+/).some(k => k.trim() && text.includes(k.trim()));
      card.classList.toggle('is-filtered-out', !match);
      if (match) visible++;
      card.querySelectorAll('.ocr-block').forEach(el => el.classList.toggle('is-visible', hasValue && match));
    });

    // kw-mark 更新
    const firstKw = (val.split(/[,，;；]/)[0] || '').trim();
    document.querySelectorAll('#app-customs .kw-mark').forEach(el => { if (firstKw) el.textContent = firstKw; });

    // 空狀態
    const empty = $('customs-no-result');
    if (empty) empty.classList.toggle('cases-empty--hidden', !hasValue || visible > 0);

    // 結果摘要
    $('customs-result-info')?.classList.toggle('is-visible', hasValue);
    if (hasValue) {
      $('customs-result-info').innerHTML =
        `與「<mark>${esc(val)}</mark>」相符的所有搜尋結果，查詢結果共計 <strong>${visible}</strong> 筆`;
    }
  },
  clear() {
    const inp = $('customs-search');
    if (inp) inp.value = '';
    this.onInput('');
  },
};

// ── 步驟切換（海關答聯單詳細頁）────────────────────────────
const StepView = {
  switch(n) {
    [1, 2, 3].forEach(i => {
      $(`step-btn-${i}`)?.classList.toggle('is-active', i === n);
      const c = $(`step-c-${i}`);
      if (c) c.style.display = i === n ? '' : 'none';
    });
  },
};

window.KM = {
  // Nav
  goApp         : () => Nav.goApp(),
  goHome        : () => Nav.goHome(),
  goCustoms      : () => Nav.goCustoms(),
  goCustomsDetail: () => Nav.goCustomsDetail(),
  goCaseDetail   : () => Nav.goCaseDetail(),
  goNewCase      : () => Nav.goNewCase(),
  ncSwitchType   : t  => NewCase.switchType(t),
  ncHandleFiles  : el => NewCase.handleFiles(el),
  ncRemoveFile   : i  => NewCase.removeFile(i),
  ncOpenRelated  : () => NewCase.openRelated(),
  ncConfirmRelated:() => NewCase.confirmRelated(),
  ncToggleRelated: el => NewCase.toggleRelatedItem(el),
  ncSave         : p  => NewCase.save(p),
  goFlowList     : () => Nav.goFlowList(),
  goFlowEdit     : () => Nav.goFlowEdit(),
  goFlowView     : () => Nav.goFlowView(),

  // Search
  onSearch   : v  => Search.onInput(v),
  clearSearch: () => Search.clear(),

  // Customs Search
  customsSearch: v  => CustomsSearch.onInput(v),
  customsClear : () => CustomsSearch.clear(),

  // Step switching
  switchStep: n => StepView.switch(n),

  // Flow edit
  flowAddStep   : ()     => FlowEdit.addStep(),
  flowSelectStep: card   => FlowEdit.selectStep(card),
  flowUpdateTitle: val   => FlowEdit.updateTitle(val),
  flowSave      : ()     => FlowList.save(),
  flowPublish   : ()     => FlowList.publish(),
  flowSetDefault: id     => FlowList.setDefault(id),
  flowCopy      : ()     => FlowList.copy(),
  flowView      : ()     => FlowList.view(),
  flowSelectRow : el     => FlowList.selectRow(el),

  // Tree
  switchTab: t        => Tree.switchTab(t),
  selectTree: (el, t) => Tree.select(el, t),
  selectCustomsTree: (el, t) => {
    document.querySelectorAll('#app-customs .tree-item').forEach(i => i.classList.remove('is-active'));
    el.classList.add('is-active');
    $('customs-section-title').textContent = t;
  },

  // Sidebar
  toggleSidebar: () => Sidebar.toggle(),

  // Side panel
  openPanel : () => SidePanel.open(),
  closePanel: () => SidePanel.close(),

  // Modal
  openModal         : id  => Modal.open(id),
  closeModal        : id  => Modal.close(id),
  openFileModal     : el  => FileModal.open(el),
  openLawModal      : (tagsId, returnTo) => Modal.openLaw(tagsId, returnTo),
  closeLawModal     : () => Modal.closeLaw(),
  handleDateRange   : sel => Modal.handleDateRange(sel),
  overlayClick      : (e, id) => Modal.overlayClick(e, id),
  setSearchMode     : btn => Modal.setSearchMode(btn),
  removeFilterTag   : id  => Modal.removeFilterTag(id),
  clearAdvanced     : () => Modal.clearAdvanced(),
  submitSearch      : () => Modal.submitSearch(),
  toggleLawItem     : el  => Modal.toggleLawItem(el),
  filterLawList     : q   => Modal.filterLawList(q),
  confirmLaws       : () => Modal.confirmLaws(),

  // Download modal
  dlToggleAll : checked => Download.toggleAll(checked),
  dlToggleGroup: hd     => Download.toggleGroup(hd),
  dlGroupCb   : cb      => Download.groupCb(cb),
  dlItemChange:  ()     => Download.updateCount(),
  dlDownload  : ()      => Download.download(),

  // Toast
  toast: msg => Toast.show(msg),
};

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); TreeCount.refresh(); });
} else {
  init();
  TreeCount.refresh();
}
