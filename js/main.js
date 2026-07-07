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

/** 案例標籤配色：輸美＝淺紅／加重＝淺橘／減輕＝淺綠／初次違規＝淺藍，從輕維持預設灰底 */
const caseTagClass = tag => {
  if (tag === '輸美') return 'case-tag-pill--us';
  if (tag === '加重') return 'case-tag-pill--heavy';
  if (tag === '減輕') return 'case-tag-pill--reduced';
  if (tag === '初次違規') return 'case-tag-pill--first';
  return '';
};

// ─────────────────────────────────────────────────────────
//  CardFocus — 記住點擊的卡片，返回列表時回到該卡片位置
// ─────────────────────────────────────────────────────────
const CardFocus = {
  _el: null,

  remember(el) {
    this._el = el ?? null;
  },

  restore() {
    const el = this._el;
    if (!el || !document.body.contains(el)) return;
    el.scrollIntoView({ block: 'center' });
    el.classList.add('is-focus-flash');
    setTimeout(() => el.classList.remove('is-focus-flash'), 1800);
  },
};

// ─────────────────────────────────────────────────────────
//  Theme — 配色主題切換（CSS 變數 data-theme，見 scss/_themes.scss）
// ─────────────────────────────────────────────────────────
const THEME_LIST = [
  { id: 'ocean',  label: '海洋藍（預設）', swatch: ['#0F3F85', '#2C8086'] },
  { id: 'violet', label: '靛紫',          swatch: ['#40268C', '#6B4FA8'] },
  { id: 'slate',  label: '石墨藍',        swatch: ['#24344F', '#4A7A75'] },
];
const THEME_STORAGE_KEY = 'km-theme';

const Theme = {
  current: 'ocean',

  init() {
    this._renderSwitchers();
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    this.set(saved || 'ocean', /*silent*/ true);
  },

  _renderSwitchers() {
    document.querySelectorAll('.theme-switcher').forEach(el => {
      el.innerHTML = `
        <button type="button" class="theme-switcher-btn" onclick="KM.themeToggleMenu(this)" aria-label="切換配色主題">
          <span class="mi">palette</span>
        </button>
        <div class="theme-menu">
          ${THEME_LIST.map(t => `
            <button type="button" class="theme-swatch-btn" data-theme="${t.id}" onclick="KM.setTheme('${t.id}')">
              <span class="theme-swatch-dots">
                <span class="theme-swatch-dot" style="background:${t.swatch[0]}"></span>
                <span class="theme-swatch-dot" style="background:${t.swatch[1]}"></span>
              </span>
              <span class="theme-swatch-label">${t.label}</span>
              <span class="mi theme-swatch-check">check</span>
            </button>
          `).join('')}
        </div>`;
    });
  },

  set(id, silent) {
    if (!THEME_LIST.some(t => t.id === id)) id = 'ocean';
    this.current = id;
    if (id === 'ocean') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', id);
    }
    localStorage.setItem(THEME_STORAGE_KEY, id);
    document.querySelectorAll('.theme-swatch-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.theme === id);
    });
    if (!silent) Toast.show(`配色已切換：${THEME_LIST.find(t => t.id === id).label}`);
  },

  toggleMenu(btn) {
    const menu = btn.parentElement.querySelector('.theme-menu');
    if (!menu) return;
    const willOpen = !menu.classList.contains('is-open');
    document.querySelectorAll('.theme-menu.is-open').forEach(m => m.classList.remove('is-open'));
    if (willOpen) menu.classList.add('is-open');
  },
};

document.addEventListener('click', e => {
  if (e.target.closest('.theme-switcher')) return;
  document.querySelectorAll('.theme-menu.is-open').forEach(m => m.classList.remove('is-open'));
});

// ─────────────────────────────────────────────────────────
//  Home — 首頁全文檢索（樣式與行為比照 #app 頁搜尋列）+ 卡片顯示階段（4／8 張）切換
// ─────────────────────────────────────────────────────────
const Home = {
  /** 首頁功能卡片顯示模式：'4'＝第一期上線、'8'＝完整卡片（含未上線項目供比對） */
  cardMode: '4',

  /** 切換卡片顯示模式並重新渲染卡片格線 */
  setCardMode(mode) {
    this.cardMode = mode;
    document.querySelectorAll('#home-card-toggle .home-card-toggle-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });
    Render.homeCards();
  },

  /** 全文檢索輸入變化：只切換清除按鈕顯示，實際篩選在導向 #app 後才觸發 */
  onSearchInput(v) {
    $('home-search-clear-btn')?.classList.toggle('is-visible', !!v.trim());
  },

  clearSearch() {
    const input = $('home-search-input');
    if (input) input.value = '';
    this.onSearchInput('');
  },

  /** 送出搜尋：導向處分案例列表，帶入關鍵字並套用既有的 Search 篩選邏輯；
   *  openAdvanced 為 true 時（點擊放大鏡旁的進階搜尋鈕）額外開啟進階搜尋 modal */
  submitSearch(openAdvanced) {
    const kw = ($('home-search-input')?.value || '').trim();
    Nav.goApp();
    const appInput = $('search-input');
    if (appInput) appInput.value = kw;
    Search.onInput(kw);
    if (openAdvanced) Modal.open('modal-adv');
  },

  /** 通知鈴鐺：切換「最新異動」下拉面板顯示，並依開合切換鈴鐺圖示（一般／按下態） */
  toggleNotif() {
    const dropdown = $('home-notif-dropdown');
    const icon = $('home-notif-icon');
    if (!dropdown) return;
    const willOpen = dropdown.style.display === 'none';
    dropdown.style.display = willOpen ? 'block' : 'none';
    if (icon) icon.src = `img/home/${willOpen ? 'news_hover' : 'news_1'}.png`;
  },
};

document.addEventListener('click', e => {
  if (e.target.closest('.home-notif')) return;
  const dropdown = $('home-notif-dropdown');
  const icon = $('home-notif-icon');
  if (dropdown) dropdown.style.display = 'none';
  if (icon) icon.src = 'img/home/news_1.png';
});

// ─────────────────────────────────────────────────────────
//  Nav — 頁面切換
// ─────────────────────────────────────────────────────────
const SCREENS = ['home', 'app', 'app-flow-list', 'app-flow-edit', 'app-case-detail', 'app-customs', 'app-customs-detail', 'app-new-case', 'app-customs-new-case', 'app-pending-review'];

const Nav = {
  _show(id) {
    SCREENS.forEach(s => $(s)?.classList.remove('on'));
    $(id)?.classList.add('on');
  },

  goApp() {
    this._show('app');
    CaseNav.init();  // 每次進入主功能都重置為預設導覽狀態
  },

  goHome() {
    this._show('home');
    SidePanel.close();
    Search.clear();
  },

  goPendingReview() {
    this._show('app-pending-review');
    PendingReview.init();
  },

  goCustoms() {
    this._show('app-customs');
    this._selectFirstCustomsTree();  // 每次進入主功能都預設顯示第一個樣態為選中狀態
  },

  /** 重置答聯單態樣樹，選中第一個項目 */
  _selectFirstCustomsTree() {
    const first = document.querySelector('#app-customs .tree-item');
    if (!first) return;
    const title = first.querySelector('span:not(.tree-count):not(.tree-folder)')?.textContent.trim() || '';
    this.selectCustomsTree(first, title);
  },

  /** 選取答聯單態樣項目，更新右側標題 */
  selectCustomsTree(el, title) {
    document.querySelectorAll('#app-customs .tree-item').forEach(i => i.classList.remove('is-active'));
    el.classList.add('is-active');
    $('customs-section-title').textContent = title;
  },

  /** 麵包屑路徑追蹤：array of {label, fn, isList}，最後一項＝返回時的目標 */
  _crumbTrail: [],
  _customsTitle: '專案(擋關)',
  _customsDocNo: '專案(擋關)',
  _caseTitle   : '未依規定標示產地：未見標示',

  _setCrumbRoot(label, fn) {
    this._crumbTrail = [{ label, fn, isList: true }];
  },

  _pushCrumb(label, fn) {
    this._crumbTrail.push({ label, fn, isList: true });
  },

  /** 渲染麵包屑（首頁 › ...trail... › 標題）與返回按鈕文字／行為 */
  _renderDetailCrumb(breadcrumbId, backBtnId, title) {
    const el = $(breadcrumbId);
    if (el) {
      el.innerHTML = '';
      const home = document.createElement('a');
      home.textContent = '首頁';
      home.onclick = () => { this._crumbTrail = []; this.goHome(); };
      el.append(home, this._crumbSep());
      this._crumbTrail.forEach((c, idx) => {
        const a = document.createElement('a');
        a.textContent = c.label;
        // 點擊任一中間麵包屑時，先把路徑截斷到該層，避免殘留下層（如已跨類別疊加）的舊路徑
        a.onclick = () => {
          this._crumbTrail = this._crumbTrail.slice(0, idx);
          CardFocus.restore();
          c.fn();
        };
        el.append(a, this._crumbSep());
      });
      const cur = document.createElement('span');
      cur.textContent = title;
      el.append(cur);
    }

    const btn = $(backBtnId);
    if (btn) {
      btn.textContent = '＜ 返回';
      btn.onclick = () => this._backInTrail();
    }
  },

  _crumbSep() {
    const s = document.createElement('span');
    s.textContent = '›';
    return s;
  },

  _backInTrail() {
    const popped = this._crumbTrail.pop();
    CardFocus.restore();
    if (popped) popped.fn(); else this.goApp();
  },

  /**
   * 渲染「跨類別導航」用的麵包屑：與一般列表式麵包屑（_crumbTrail / _backInTrail）邏輯完全獨立。
   * trail 由呼叫端明確列出每一層（每層皆可點擊回到該層），返回按鈕則直接執行 backFn——
   * 即「從哪裡進來就返回哪裡」的原地返回上一頁，而非退回該類別的列表。
   */
  _renderCrossCrumb(breadcrumbId, backBtnId, trail, title, backFn, backLabel) {
    const el = $(breadcrumbId);
    if (el) {
      el.innerHTML = '';
      const home = document.createElement('a');
      home.textContent = '首頁';
      home.onclick = () => this.goHome();
      el.append(home, this._crumbSep());
      trail.forEach(c => {
        const a = document.createElement('a');
        a.textContent = c.label;
        a.onclick = c.fn;
        el.append(a, this._crumbSep());
      });
      const cur = document.createElement('span');
      cur.textContent = title;
      el.append(cur);
    }
    const btn = $(backBtnId);
    if (btn) {
      btn.textContent = backLabel;
      btn.onclick = backFn;
    }
  },

  /**
   * 通用跨主要功能導航：任何卡片的「關聯檔案」都比照同一套規則——
   * 麵包屑＝首頁 › 主要功能 › 樣態 › 該卡片標題 › 本次關聯檔案標題。
   * 返回按鈕預設回到該卡片本身（origin.cardFn）；若這個連結是直接長在「列表頁」的卡片上
   * （使用者根本沒進過該卡片的詳情頁），可傳入 origin.backFn / backLabel 改成回到列表，
   * 才會符合「從哪裡進來就返回哪裡」。
   * 8 個主要功能彼此互連時，都呼叫這個函式即可保持麵包屑與返回邏輯一致。
   *
   * @param {{mainLabel:string, mainFn:Function, catLabel:string, catFn:Function, cardLabel:string, cardFn:Function, backFn?:Function, backLabel?:string}} origin
   * @param {{screenId:string, breadcrumbId:string, backBtnId:string, title:string, syncContent?:Function}} target
   */
  crossNavigate(origin, target) {
    const trail = [
      { label: origin.mainLabel, fn: origin.mainFn },
      { label: origin.catLabel, fn: origin.catFn },
      { label: origin.cardLabel, fn: origin.cardFn },
    ];
    this._show(target.screenId);
    if (target.syncContent) target.syncContent();
    this._renderCrossCrumb(
      target.breadcrumbId, target.backBtnId,
      trail, target.title,
      origin.backFn ?? origin.cardFn,
      origin.backLabel ?? '＜ 返回',
    );
  },

  goCustomsDetail() {
    this._renderDetailCrumb('customs-detail-breadcrumb', 'customs-detail-back-btn', this._customsTitle);
    this._show('app-customs-detail');
  },

  _customsCatLabel: '專案(擋關)',

  openCustomsDetail(el) {
    CardFocus.remember(el);
    this._loadCustomsMeta(el);
    this._setCrumbRoot('海關答聯單', () => this.goCustoms());
    this._pushCrumb(this._customsCatLabel, () => this.goCustoms());
    this.goCustomsDetail();
  },

  /** 從海關答聯單卡片（列表頁或詳情頁皆可）讀出該卡片的中繼資料，供麵包屑/標題綁定使用 */
  _loadCustomsMeta(el) {
    this._customsDocNo = this._readCustomsCardMeta(el, '發文文號') || this._customsDocNo;
    // 海關答聯單目前以左側樹狀分類（而非每卡各自的 data-category）來區分樣態，故取目前選中的分類名稱
    this._customsCatLabel = $('customs-section-title')?.textContent || this._customsCatLabel;
    this._customsTitle = this._customsDocNo;
  },

  /** 從海關答聯單卡片的 cmeta 區塊（cm-key／cm-val 為同層相鄰元素，非 case 卡的 row 結構）取出指定欄位 */
  _readCustomsCardMeta(el, key) {
    const keys = el?.querySelectorAll('.cm-key') ?? [];
    for (const k of keys) {
      if (k.textContent.replace('：', '') === key) return k.nextElementSibling?.textContent ?? '';
    }
    return '';
  },

  /** 由跨類別流程返回案例詳情：用已記錄的案例狀態重建麵包屑路徑，不依賴（也不會被）一般流程的 _crumbTrail 影響 */
  _returnToCaseFromCustoms() {
    this._setCrumbRoot('處分案例', () => this.goApp());
    this._pushCrumb(this._caseCatLabel, () => this.goApp());
    this.goCaseDetail();
  },

  /** 由跨類別流程返回海關答聯單詳情：與上面同理，獨立於一般流程的 _crumbTrail */
  _returnToCustomsFromCase() {
    this._setCrumbRoot('海關答聯單', () => this.goCustoms());
    this._pushCrumb(this._customsCatLabel, () => this.goCustoms());
    this.goCustomsDetail();
  },

  /**
   * 從處分案例卡片的「關聯案例」連結，跨主要功能導向海關答聯單詳情。
   * 這個連結直接長在列表頁的卡片上（並未先進入該案例的詳情頁），
   * 所以必須由傳入的卡片元素直接讀取中繼資料，不能依賴前一次 openCaseDetail() 留下的狀態。
   */
  openRelatedCustomsFromCase(cardEl) {
    if (cardEl) {
      this._loadCaseMeta(cardEl);
      CardFocus.remember(cardEl);
    }
    this.crossNavigate(
      {
        mainLabel: '處分案例', mainFn: () => this.goApp(),
        catLabel : this._caseCatLabel, catFn: () => this.goApp(),
        cardLabel: this._caseTitle, cardFn: () => this._returnToCaseFromCustoms(),
        // 連結是直接點在列表卡片上（沒有先開過該案例的詳情頁），所以返回鈕回到列表並聚焦該卡片，而非該案例的詳情頁
        backFn: () => this.backToCaseList(), backLabel: '＜ 返回',
      },
      {
        screenId: 'app-customs-detail',
        breadcrumbId: 'customs-detail-breadcrumb', backBtnId: 'customs-detail-back-btn',
        title: this._customsTitle,
      },
    );
  },

  /**
   * 從海關答聯單卡片的「關聯案例」連結，跨主要功能導向處分案例詳情——與上面的方向相反，但邏輯完全一致：
   * 同樣直接從列表卡片讀取中繼資料，返回鈕回到海關答聯單列表並聚焦原卡片。
   */
  openRelatedCaseFromCustoms(cardEl) {
    if (cardEl) {
      this._loadCustomsMeta(cardEl);
      CardFocus.remember(cardEl);
    }
    // mock 資料只有一筆完整案例可連結，固定指向該案例作為示範，避免沿用上一次瀏覽過的其他案例殘留狀態
    this._loadCaseMeta('case-1');
    this.crossNavigate(
      {
        mainLabel: '海關答聯單', mainFn: () => this.goCustoms(),
        catLabel : this._customsCatLabel, catFn: () => this.goCustoms(),
        cardLabel: this._customsTitle, cardFn: () => this._returnToCustomsFromCase(),
        backFn: () => this.backToCustomsList(), backLabel: '＜ 返回',
      },
      {
        screenId: 'app-case-detail',
        breadcrumbId: 'case-detail-breadcrumb', backBtnId: 'case-detail-back-btn',
        title: this._caseTitle,
        syncContent: () => this._syncCaseDetailContent(),
      },
    );
  },

  backToCustomsList() {
    // 比照「從哪裡進來就返回哪裡」：直接顯示畫面，不重置樣態選取，保留原本瀏覽的分類
    this._show('app-customs');
    CardFocus.restore();
  },

  _caseId: 'case-1',
  _caseDocNo: '貿管理字第114704321號',
  _caseDate : '中華民國114年11月25日',
  _caseTarget: 'OOO食品公司',
  _caseCatLabel: '未依規定標示產地：未見標示',

  /** 把目前的案例資料寫進案例詳情頁的內容欄位（一般進入與跨主要功能進入都共用） */
  _syncCaseDetailContent() {
    const titleEl = $('case-detail-title-text');
    if (titleEl) titleEl.textContent = `${this._caseDocNo} — 案例完整詳情`;
    const docNoEl = $('case-detail-docno');
    if (docNoEl) docNoEl.textContent = this._caseDocNo;
    const dateEl = $('case-detail-date');
    if (dateEl) dateEl.textContent = this._caseDate;
    const targetEl = $('case-detail-target');
    if (targetEl) targetEl.textContent = this._caseTarget;
    if (typeof CaseDetail !== 'undefined') CaseDetail.render(this._caseId);
  },

  goCaseDetail() {
    SidePanel.close();
    this._renderDetailCrumb('case-detail-breadcrumb', 'case-detail-back-btn', this._caseTitle);
    this._syncCaseDetailContent();
    this._show('app-case-detail');
  },

  /** 從案例清單列（tr[data-case-id]）讀出該案例的資料（CASES_DATA），供麵包屑/標題/詳情頁綁定使用；
   *  el 為 null 時（例如從詳情頁本身觸發的跨頁連結）沿用目前已載入的狀態，不重新讀取 */
  _loadCaseMeta(el) {
    const id = el?.dataset?.caseId || (typeof el === 'string' ? el : null);
    const c = id ? caseById(id) : null;
    if (!c) return;
    this._caseId = c.id;
    this._caseDocNo = c.docNo;
    this._caseDate = c.date;
    this._caseTarget = c.target;
    this._caseCatLabel = caseTreePath(c.categoryId) || '案例完整詳情';
    // 麵包屑最後一層與頁面標題綁定，顯示發文字號；樣態（分類）仍保留為上一層
    this._caseTitle = this._caseDocNo;
  },

  openCaseDetail(el) {
    this._caseReviewMode = false;
    CardFocus.remember(el);
    this._loadCaseMeta(el);
    this._setCrumbRoot('處分案例', () => this.goApp());
    this._pushCrumb(this._caseCatLabel, () => this.goApp());
    this.goCaseDetail();
    this._toggleCaseReviewUI(false);
  },

  /** 是否正在審核待審核案例（由「待審」頁面點擊檢視進入） */
  _caseReviewMode: false,

  /** 從待審清單點擊「檢視」進入案例審核：麵包屑固定回「待審表單詳情」，不走一般的樣態分類路徑 */
  goCaseReview(caseId) {
    this._caseReviewMode = true;
    this._loadCaseMeta(caseId);
    SidePanel.close();

    const trailEl = $('case-detail-breadcrumb');
    if (trailEl) {
      trailEl.innerHTML = '';
      const home = document.createElement('a'); home.textContent = '首頁'; home.onclick = () => this.goHome();
      const mid = document.createElement('a'); mid.textContent = '待審表單詳情'; mid.onclick = () => this.goPendingReview();
      const cur = document.createElement('span'); cur.textContent = this._caseTitle;
      trailEl.append(home, this._crumbSep(), mid, this._crumbSep(), cur);
    }
    const backBtn = $('case-detail-back-btn');
    if (backBtn) { backBtn.textContent = '＜ 返回'; backBtn.onclick = () => this.goPendingReview(); }

    // 先做基本的顯示/隱藏，再讓 _syncCaseDetailContent()（內部呼叫 CaseDetail.render()）依
    // 該案例是否「先前已被退回過」做更精確的覆寫，避免這裡的無條件顯示蓋掉那邊的判斷
    this._toggleCaseReviewUI(true);
    this._syncCaseDetailContent();
    this._show('app-case-detail');
  },

  /** 切換案例審核模式的 UI：審核卡片（意見輸入＋簽核紀錄）與麵包屑列的退回／同意按鈕 */
  _toggleCaseReviewUI(isReview) {
    const card = $('case-review-card');
    if (card) card.style.display = isReview ? '' : 'none';
    const actions = $('case-review-actions');
    if (actions) actions.style.display = isReview ? 'flex' : 'none';
    const commentInput = $('case-review-comment');
    if (commentInput) commentInput.value = '';
    if (typeof CaseReview !== 'undefined') CaseReview.comment = '';
  },

  backToCaseList() {
    // 比照「從哪裡進來就返回哪裡」：直接顯示畫面，不重置樣態選取，保留原本瀏覽的分類
    this._show('app');
    CardFocus.restore();
  },

  /** 處理流程清單的來源（'cases' | 'customs'），決定麵包屑與返回目標 */
  _flowSource: 'cases',
  /** 是否由「待審表單詳情」的檢視進入：是的話麵包屑與返回都要回待審清單，而非該分類的流程列表 */
  _reviewFromPending: false,
  /** 目前正在編輯／檢視的流程 id 與版本字串（僅處分案例；海關答聯單不適用，維持 null） */
  _currentFlowId: null,
  _currentVersion: null,

  _syncFlowBreadcrumb() {
    const isCustoms = this._flowSource === 'customs';
    const fromPending = this._reviewFromPending;
    const midLabel  = fromPending ? '待審表單詳情' : (isCustoms ? '海關答聯單處理' : '處分案件');
    const goMid     = fromPending ? () => this.goPendingReview() : (() => isCustoms ? this.goCustoms() : this.goApp());
    // 處分案例的流程列表已改為總覽頁（不再對應特定分類），標題固定顯示「處理流程列表」；
    // 海關答聯單維持原本跟著所選分類走的動態標題。
    const titleText = isCustoms
      ? ($('customs-section-title')?.textContent ?? '')
      : '處理流程列表';

    const mid = $('flow-breadcrumb-mid');
    if (mid) { mid.textContent = midLabel; mid.onclick = goMid; }
    const title = $('flow-breadcrumb-title');
    if (title) title.textContent = titleText;
    const pageTitle = $('flow-page-title-text');
    if (pageTitle) pageTitle.textContent = titleText;
    const backBtn = $('flow-back-btn');
    if (backBtn) backBtn.onclick = goMid;

    const midEdit = $('flow-edit-breadcrumb-mid');
    if (midEdit) { midEdit.textContent = midLabel; midEdit.onclick = goMid; }
    const titleEdit = $('flow-edit-breadcrumb-title');
    if (titleEdit) { titleEdit.textContent = titleText; titleEdit.onclick = fromPending ? goMid : () => this.goFlowList(); }
    const pageTitleEdit = $('flow-edit-page-title-text');
    if (pageTitleEdit) pageTitleEdit.textContent = titleText;

    const viewBackBtn = $('flow-view-back-btn');
    if (viewBackBtn) viewBackBtn.onclick = fromPending ? goMid : () => this.goFlowList();
    const viewBackBtnText = $('flow-view-back-btn-text');
    if (viewBackBtnText) viewBackBtnText.textContent = '返回';

    // 側欄 active 項目要跟著「從哪個主要功能進來」走，而非固定指向處分案例
    const sidebarKey = isCustoms ? 'customs' : 'cases';
    Render.setSidebarActive('app-flow-list', sidebarKey);
    Render.setSidebarActive('app-flow-edit', sidebarKey);

    // 流程清單容器：cases 走資料驅動（總覽：左側樹狀導覽＋FlowList 表格），customs 維持原本固定 3 組流程、無導覽
    const listCases = $('flow-group-list-cases');
    const listCustoms = $('flow-group-list-customs');
    if (listCases) listCases.style.display = isCustoms ? 'none' : '';
    if (listCustoms) listCustoms.style.display = isCustoms ? '' : 'none';
    const navPanel = $('flow-nav-panel');
    if (navPanel) navPanel.style.display = isCustoms ? 'none' : '';
    const copyBtn = $('flow-copy-btn');
    if (copyBtn) copyBtn.style.display = isCustoms ? '' : 'none'; // cases 改在「新增流程」內提供複製，列表按鈕僅 customs 使用
    // 只重繪，不重置左側導覽選取狀態（重置僅在 goFlowList() 真正進入總覽頁時才做，
    // 避免從編輯／檢視頁返回列表時，使用者原本選的出口/進口與流程被清空）
    if (!isCustoms && typeof FlowNav !== 'undefined') FlowNav.render();
  },

  goFlowList(source) {
    if (source) this._flowSource = source;
    this._reviewFromPending = false;
    this._currentFlowId = null;
    this._currentVersion = null;
    if (this._flowSource !== 'customs' && typeof FlowNav !== 'undefined') FlowNav.init();
    this._syncFlowBreadcrumb();
    this._show('app-flow-list');
  },

  goNewCase(source) {
    if (source === 'customs') {
      this._show('app-customs-new-case');
      CustomsNewCase.init();
      return;
    }
    this._show('app-new-case');
    NewCase.init();
  },

  /** 新增流程（flowId 省略）或編輯既有流程／版本（cases 專用；customs 呼叫時 flowId 一律為 undefined，行為不變） */
  goFlowEdit(flowId, version) {
    // 進入編輯模式 → 確保清除 view mode
    this._reviewFromPending = false;
    this._currentFlowId = flowId || null;
    this._currentVersion = version || null;
    const screen = $('app-flow-edit');
    if (screen) screen.classList.remove('is-view-mode', 'is-review-mode');
    const banner = $('flow-view-banner');
    if (banner) banner.style.display = 'none';
    const addBtn = document.querySelector('.flow-add-btn');
    if (addBtn) addBtn.style.display = '';
    const editActions = $('flow-edit-actions');
    if (editActions) editActions.style.display = 'flex';
    const reviewActions = $('flow-review-actions');
    if (reviewActions) reviewActions.style.display = 'none';
    this._syncFlowBreadcrumb();
    this._show('app-flow-edit');
    FlowEdit.init();
  },

  /** 一般檢視（唯讀，無審核按鈕）*/
  goFlowView(flowId, version) {
    this._reviewFromPending = false;
    if (flowId) { this._currentFlowId = flowId; this._currentVersion = version || null; }
    this._enterFlowViewMode(false);
  },

  /**
   * 審核人員檢視待審核流程（唯讀＋上方顯示同意／退回）。
   * fromPending：是否由「待審表單詳情」進入；el：被點擊的按鈕，用來判斷所屬的 .pending-group（cases／customs），
   * 確保檢視到的是對應分類的流程內容，而非沿用上一次的 _flowSource。
   */
  goFlowReviewView(fromPending, el, flowId, version) {
    this._reviewFromPending = !!fromPending;
    const group = el?.closest('.pending-group')?.dataset.group;
    if (group) this._flowSource = group;
    if (flowId) { this._currentFlowId = flowId; this._currentVersion = version || null; }
    this._enterFlowViewMode(true);
  },

  _enterFlowViewMode(isReview) {
    const screen = $('app-flow-edit');
    if (screen) {
      screen.classList.add('is-view-mode');
      screen.classList.toggle('is-review-mode', isReview);
    }
    const banner = $('flow-view-banner');
    if (banner) banner.style.display = 'flex';
    const addBtn = document.querySelector('.flow-add-btn');
    if (addBtn) addBtn.style.display = 'none';
    const editActions = $('flow-edit-actions');
    if (editActions) editActions.style.display = 'none';
    const reviewActions = $('flow-review-actions');
    if (reviewActions) reviewActions.style.display = isReview ? 'flex' : 'none';
    this._syncFlowBreadcrumb();
    this._show('app-flow-edit');
    FlowEdit.init();
  },
};

// ─────────────────────────────────────────────────────────
//  Search — 搜尋列
// ─────────────────────────────────────────────────────────
const Search = {
  /** 輸入事件：實際篩選交由 CaseList 處理（資料驅動），這裡只負責搜尋列本身的 UI 狀態 */
  onInput(rawValue) {
    const v = rawValue.trim();
    const hasValue = !!v;
    $('search-clear-btn')?.classList.toggle('is-visible', hasValue);
    $('filter-btn')?.classList.toggle('is-active', hasValue);
    $('preset-chip')?.classList.toggle('is-hidden', hasValue);
    if (typeof CaseList !== 'undefined') CaseList.setKeyword(v);
  },

  /** 清除搜尋 */
  clear() {
    const input = $('search-input');
    if (input) input.value = '';
    this.onInput('');
  },
};

// ─────────────────────────────────────────────────────────
//  CaseList — 處分案例清單（表格化：分類篩選＋關鍵字搜尋＋欄位排序＋分頁）
//  資料來源：js/data.js 的 CASES_DATA，取代原本寫死在 HTML 的 12 張 .case-card
// ─────────────────────────────────────────────────────────
// 案例標籤篩選下拉：僅提供這 4 個選項（依需求文件範例：從輕／輸美／減輕／初次違規）
const CASE_TAG_FILTER_OPTIONS = ['從輕', '輸美', '減輕', '初次違規'];

const CaseList = {
  _keyword: '',
  _tagFilter: '',
  _sortKey: 'date',
  _sortDir: 'desc',
  _page: 1,
  _pageSize: 10,
  _tagOptionsReady: false,

  setKeyword(kw) {
    this._keyword = (kw || '').trim();
    this._page = 1;
    // 關鍵字會影響 CaseNav 各節點旁的計數，透過它重繪（內部會再呼叫 CaseList.render）
    if (typeof CaseNav !== 'undefined') CaseNav.render();
    else this.render();
  },

  /** 標題列右側「案例標籤」下拉：篩選只顯示包含該標籤的案例 */
  setTagFilter(tag) {
    this._tagFilter = tag || '';
    this._page = 1;
    if (typeof CaseNav !== 'undefined') CaseNav.render();
    else this.render();
  },

  /** 標題列右側「排序依據」下拉：更新時間／處分日期，預設新到舊 */
  setSortField(key) {
    this._sortKey = key;
    this._sortDir = 'desc';
    this.render();
  },

  changePageSize(size) {
    this._pageSize = Number(size) || 10;
    this._page = 1;
    this.render();
  },

  sortBy(key) {
    if (this._sortKey === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortKey = key;
      this._sortDir = 'asc';
    }
    this.render();
  },

  /** 案例清單只顯示已發布案例；待審核（pending）與草稿（draft）在核准前不會出現在這裡，只會出現在「待審」頁面 */
  _publishedRows() {
    return CASES_DATA.filter(c => c.status !== 'pending' && c.status !== 'draft');
  },

  /** 依 CaseNav 目前選中的節點篩選，不含關鍵字／標籤 */
  _byCategory() {
    const rows = this._publishedRows();
    if (typeof CaseNav === 'undefined') return rows;
    return rows.filter(c => CaseNav.matches(c));
  },

  _filterByKeyword(rows) {
    if (!this._keyword) return rows;
    const kws = this._keyword.toLowerCase().split(/[,，;；]+/).map(k => k.trim()).filter(Boolean);
    if (!kws.length) return rows;
    return rows.filter(c => {
      const text = [c.docNo, c.target, c.law, c.goods, (c.tags || []).join(' '), c.summary || ''].join(' ').toLowerCase();
      return kws.some(k => text.includes(k));
    });
  },

  /** 套用關鍵字＋案例標籤篩選（不含分類），供清單與 CaseNav 計數共用 */
  _applyNonCategoryFilters(rows) {
    let out = this._filterByKeyword(rows);
    if (this._tagFilter) out = out.filter(c => (c.tags || []).includes(this._tagFilter));
    return out;
  },

  /** 供 CaseNav 計數使用：只套用關鍵字／標籤篩選（不套用目前選中節點），才能同時算出每個節點各自的數量 */
  countableRows() {
    return this._applyNonCategoryFilters(this._publishedRows());
  },

  _sorted(rows) {
    const key = this._sortKey;
    const dir = this._sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[key] || '', bv = b[key] || '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  },

  /** 標題列的「案例標籤」下拉只需產生一次選項 */
  _ensureTagOptions() {
    if (this._tagOptionsReady) return;
    const sel = $('case-tag-filter');
    if (sel) {
      sel.innerHTML = '<option value="">全部標籤</option>' +
        CASE_TAG_FILTER_OPTIONS.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
      this._tagOptionsReady = true;
    }
  },

  _visibleRows() {
    return this._sorted(this._applyNonCategoryFilters(this._byCategory()));
  },

  render() {
    this._ensureTagOptions();
    const all = this._visibleRows();
    const totalPages = Math.max(1, Math.ceil(all.length / this._pageSize));
    if (this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._pageSize;
    const rows = all.slice(start, start + this._pageSize);

    const tbody = $('case-table-body');
    if (tbody) tbody.innerHTML = rows.map(c => this._rowHtml(c)).join('');

    const empty = $('case-table-empty');
    if (empty) empty.style.display = all.length ? 'none' : 'block';

    const resultInfo = $('result-info');
    if (resultInfo) {
      resultInfo.classList.toggle('is-visible', !!this._keyword);
      if (this._keyword) {
        resultInfo.innerHTML = `與「<mark>${esc(this._keyword)}</mark>」相符的所有搜尋結果，查詢結果共計 <strong>${all.length}</strong> 筆`;
      }
    }

    this._renderPagination(all.length, totalPages);
    this._renderSortIcons();
  },

  /** 每筆案例產生兩列：主要列（點擊任一處展開/收合主旨；只有右側按鈕會開啟明細頁）＋ 展開列（法規／主旨，預設收合） */
  _rowHtml(c) {
    return `<tr class="case-row" data-case-id="${c.id}" onclick="KM.caseToggleRow(this)">
        <td class="case-td-expand"><span class="mi case-row-chevron">chevron_right</span></td>
        <td class="case-td-docno">${esc(c.docNo)}</td>
        <td class="case-td-nowrap">${esc((c.date || '').replace('中華民國', ''))}</td>
        <td>${esc(c.target)}</td>
        <td><div class="case-td-tags">${(c.tags || []).map(t => `<span class="case-tag-pill ${caseTagClass(t)}">${esc(t)}</span>`).join('')}</div></td>
        <td>${esc(c.goods)}</td>
        <td class="case-td-nowrap">${esc(c.updateDate)}</td>
        <td class="case-td-actions">
          <button class="case-view-btn" onclick="event.stopPropagation();KM.openCaseDetail(this.closest('tr'))" aria-label="查看明細" title="查看明細">
            <span class="mi">open_in_new</span>
          </button>
        </td>
      </tr>
      <tr class="case-row-detail" id="case-row-detail-${c.id}">
        <td colspan="8">
          <div class="case-row-detail-inner">
            <div class="case-row-detail-item">
              <div class="case-row-detail-icon case-row-detail-icon--law"><span class="mi">gavel</span></div>
              <div class="case-row-detail-body">
                <div class="case-row-detail-label">法規<span class="case-row-detail-label-en">STATUTE</span></div>
                <div class="case-row-detail-val">${esc(c.law || '—')}</div>
              </div>
            </div>
            <div class="case-row-detail-item">
              <div class="case-row-detail-icon case-row-detail-icon--summary"><span class="mi">description</span></div>
              <div class="case-row-detail-body">
                <div class="case-row-detail-label">主旨<span class="case-row-detail-label-en">SUMMARY</span></div>
                <div class="case-row-detail-val">${esc(c.subject || c.summary || '—')}</div>
              </div>
            </div>
          </div>
        </td>
      </tr>`;
  },

  /** 展開／收合單一案例列的法規／主旨明細（點擊發文字號另外導向詳情頁，不受此影響） */
  toggleRow(rowEl) {
    const id = rowEl.dataset.caseId;
    const detailRow = document.getElementById(`case-row-detail-${id}`);
    if (!detailRow) return;
    const isOpen = detailRow.classList.toggle('is-open');
    rowEl.classList.toggle('is-expanded', isOpen);
  },

  _renderSortIcons() {
    document.querySelectorAll('[data-sort-ico]').forEach(el => {
      const key = el.dataset.sortIco;
      el.textContent = key !== this._sortKey ? '' : (this._sortDir === 'asc' ? '▲' : '▼');
    });
    // 若目前排序欄位是「排序依據」下拉支援的欄位，同步下拉顯示值（點欄位標題排序時也會跟著對上）
    const sortFieldSel = $('case-sort-field');
    if (sortFieldSel && (this._sortKey === 'updateDate' || this._sortKey === 'date')) {
      sortFieldSel.value = this._sortKey;
    }
  },

  /** 頁碼固定顯示（即使只有一頁也顯示「1」，只是前後頁按鈕會停用），不因結果筆數少而整排消失 */
  _renderPagination(total, totalPages) {
    const wrap = $('case-pagination');
    if (wrap) wrap.style.display = total > 0 ? 'flex' : 'none';
    const pager = $('case-pager-btns');
    if (!pager) return;
    pager.innerHTML = '';
    const mk = (label, page, disabled, active) => {
      const b = document.createElement('button');
      b.className = 'pg-btn' + (active ? ' is-active' : '');
      b.textContent = label;
      b.disabled = !!disabled;
      b.onclick = () => { this._page = page; this.render(); };
      return b;
    };
    pager.append(mk('‹', this._page - 1, this._page === 1));
    for (let p = 1; p <= totalPages; p++) pager.append(mk(String(p), p, false, p === this._page));
    pager.append(mk('›', this._page + 1, this._page === totalPages));
  },
};

// ─────────────────────────────────────────────────────────
//  CaseDetail — 案例完整詳情頁右側資訊（案件資訊/標籤/處理流程/關聯案例/附件）
// ─────────────────────────────────────────────────────────
const CaseDetail = {
  render(caseId) {
    const c = caseById(caseId);
    if (!c) return;

    const targetEl = $('case-detail-target2'); if (targetEl) targetEl.textContent = c.target || '';
    const lawEl = $('case-detail-law'); if (lawEl) lawEl.textContent = c.law || '';
    const goodsEl = $('case-detail-goods'); if (goodsEl) goodsEl.textContent = c.goods || '';
    const ioEl = $('case-detail-io'); if (ioEl) ioEl.textContent = c.categoryId?.startsWith('im-') ? '進口' : '出口';
    const catPathEl = $('case-detail-cat-path'); if (catPathEl) catPathEl.textContent = caseTreePath(c.categoryId) || '—';
    const updateDateEl = $('case-detail-updatedate'); if (updateDateEl) updateDateEl.textContent = c.updateDate || '—';
    const penaltyEl = $('case-detail-penalty'); if (penaltyEl) penaltyEl.textContent = c.penalty || '—';

    // 簽核紀錄（審核同意／退回時寫入，見 CaseReview）：有紀錄才顯示表格
    const signoffs = c.signoffs || [];
    const signoffWrap = $('case-signoff-table-wrap');
    if (signoffWrap) signoffWrap.style.display = signoffs.length ? 'block' : 'none';
    const signoffTbody = $('case-signoff-tbody');
    if (signoffTbody) {
      signoffTbody.innerHTML = signoffs.map(s => `<tr>
          <td>${s.seq}</td><td>${esc(s.signer)}</td><td>${esc(s.comment)}</td><td>${esc(s.time)}</td>
        </tr>`).join('');
    }

    // 已有簽核紀錄＝先前被退回過：這次進入審核頁只能看，不能再同意／退回——
    // 意見輸入框整區跟麵包屑列的同意／退回按鈕都隱藏，只留「返回」，簽核紀錄表格維持顯示做為退回原因說明
    if (Nav._caseReviewMode) {
      const alreadyRejected = signoffs.length > 0;
      const commentWrap = $('case-review-comment-wrap');
      if (commentWrap) commentWrap.style.display = alreadyRejected ? 'none' : '';
      const reviewActions = $('case-review-actions');
      if (reviewActions) reviewActions.style.display = alreadyRejected ? 'none' : 'flex';
    }

    const tagsEl = $('case-detail-tags');
    if (tagsEl) {
      const pills = [];
      if (c.updateDate) pills.push(`<span class="tag tag--new">更新日期 ${esc(c.updateDate)}</span>`);
      (c.tags || []).forEach(t => pills.push(`<span class="tag ${t === '從重' ? 'tag--hv' : 'tag--lt'}">${esc(t)}</span>`));
      if (c.penalty) pills.push(`<span class="tag tag--pe">${esc(c.penalty)}</span>`);
      tagsEl.innerHTML = pills.join('');
    }

    const flow = c.flowId ? flowById(c.flowId) : null;
    const flowRow = $('case-detail-flow-row');
    if (flowRow) {
      flowRow.style.display = flow ? 'flex' : 'none';
      if (flow) {
        const v = flowActiveVersion(flow);
        const textEl = $('case-detail-flow-text');
        if (textEl) textEl.textContent = `${flow.name} ${v?.version || ''}`;
      }
    }

    // 相關附件／關聯案例：比照海關答聯單詳情頁的樣式（.detail-attach-bar + .attach-pill / .link-pill），
    // 放在標題下方一整列，不再是右側卡片
    const relatedEl = $('case-detail-related');
    if (relatedEl) {
      relatedEl.innerHTML = c.relatedLabel
        ? `<span class="link-pill" style="cursor:pointer" onclick="KM.openRelatedCustomsFromCase(null)"><span class="mi">link</span> ${esc(c.relatedLabel)}</span>`
        : '<span style="color:var(--tx-light)">無關聯案例</span>';
    }

    const attachList = $('case-detail-attach-list');
    if (attachList) {
      attachList.innerHTML = (c.attachments || []).map(a => `
        <span class="attach-pill" onclick="event.stopPropagation();KM.openFileModal(this)">
          <span class="mi">attach_file</span>
          <span class="attach-pill-text">
            <span class="attach-pill-no">${esc(a.no)}</span>
            <span class="attach-pill-desc">${esc(a.desc)}</span>
          </span>
        </span>`).join('') || '<span style="color:var(--tx-light);font-size:12.5px">尚無附件</span>';
    }
  },

  /** 點擊「處理流程」列，帶目前現行版本進入流程唯讀檢視 */
  goFlow() {
    const c = caseById(Nav._caseId);
    if (!c?.flowId) return;
    const flow = flowById(c.flowId);
    const v = flowActiveVersion(flow);
    Nav.goFlowView(c.flowId, v?.version);
  },

  /** 點擊「案件資訊」整列收合／展開下方內容（處分對象／涉及法規／關鍵貨品／進出口別／對應樣態／標籤） */
  toggleCaseInfo() {
    const body = $('case-info-body');
    const chevron = $('case-info-chevron');
    if (!body) return;
    const collapsed = body.classList.toggle('is-collapsed');
    chevron?.classList.toggle('is-collapsed', collapsed);
  },
};

// ─────────────────────────────────────────────────────────
//  CaseReview — 處分案例審核（案例詳情頁的審核模式：意見輸入＋簽核紀錄）
//  待審清單只提供「檢視」，同意／退回都只能在這裡操作，寫入的 signoffs 供待審
//  清單下方的淺橘色簽核資訊色塊（PendingReview._renderCasesRows）共用同一份資料。
// ─────────────────────────────────────────────────────────
const CaseReview = {
  comment: '',
  setComment(val) { this.comment = val; },

  approve() {
    const c = caseById(Nav._caseId);
    if (!c) return;
    recordCaseSignoff(c, this.comment.trim() || '同意發布。', 'approve');
    c.status = 'published';
    Toast.show('已同意，案例發布成功');
    Nav.goPendingReview();
  },

  reject() {
    const c = caseById(Nav._caseId);
    if (!c) return;
    const comment = this.comment.trim();
    // 若先前已被退回過，原因已經在簽核紀錄裡了，這次不用強制重填意見
    const alreadyRejectedBefore = (c.signoffs || []).length > 0;
    if (!comment && !alreadyRejectedBefore) { Toast.show('請填寫審核意見後再退回'); return; }
    recordCaseSignoff(c, comment || '退回原因請參考先前簽核紀錄。', 'reject');
    c.status = 'draft';
    Toast.show('已退回，請修改後重新送審');
    Nav.goPendingReview();
  },
};

/** 案例簽核紀錄共用寫入邏輯：案例詳情頁的審核模式（唯一能同意／退回的地方，待審清單只提供檢視）呼叫這裡 */
function recordCaseSignoff(c, comment, action) {
  c.signoffs = c.signoffs || [];
  c.signoffs.push({ seq: c.signoffs.length + 1, signer: CURRENT_USER, comment, time: nowTimeStr(), action });
}

// ─────────────────────────────────────────────────────────
//  FlowEdit — 流程編輯（步驟 DnD + 選取 + 標題同步）
//  處分案例的步驟資料改為從 js/data.js 的 FLOWS_DATA 依
//  Nav._currentFlowId / Nav._currentVersion 動態取用（見 _data()）。
// ─────────────────────────────────────────────────────────

// 海關答聯單的處理流程是機關間固定的公文往復順序（海關來文 → 產發署研議 → 本署回復），
// 步驟（階段）數量、順序固定，不可拖曳排序或新增；但同一階段實務上可能有多次往復
// 公文（如海關追加來文、本署分次回復），因此每個 step 底下改為一份可新增的文件清單，
// 每筆文件各自記錄類型（來文／回文）、文號、日期、內容、附件
const CUSTOMS_FLOW_STEPS_DATA = [
  {
    title: '海關來文',
    docs: [
      {
        type : '海關來文',
        no   : 'ATEG1140027',
        date : '114/10/14',
        org  : '基隆關桃園分關南崁業務課',
        contact1Name: '郭俊男', contact1Phone: '03-3558584', contact1Fax: '',
        contact2Name: '吳佩儒', contact2Phone: '03-3558220', contact2Fax: '',
        ext: '316',
        note : '電傳號碼：03-3255480',
        body : '＿＿＿＿股份有限公司（出口人）報運出口貨物1批（出口報單AT/BC/14/＿＿＿＿號）至美國，依出口人說明案貨為出口人設計並持有模具及核心技術之專業檢測儀器，部分組裝及焊接程序於中國大陸關係企業完成。\n\n本案出口貨品與原進口貨品之稅則號別前6位碼相異；惟其加工製程作業是否符合原產地證明書及加工證明書管理辦法第5條第3項規定，屬簡易加工，視為非實質轉型？請貴署惠示意見。',
      },
    ],
  },
  {
    title: '產發署研議',
    docs: [
      {
        type : '回文',
        no   : '1140681763',
        date : '114/10/25',
        org  : '經濟部產業發展署',
        contact1Name: '蔡忠平副組長', contact1Phone: '(02)2754-1255', contact1Fax: '',
        contact2Name: '', contact2Phone: '(02)2704-9128', contact2Fax: '',
        ext: '202',
        note : '',
        body : '查本案加工程序僅涉及部分組裝及焊接，依「原產地認定標準」，尚未達實質轉型門檻，加工後之稅則號別變更非屬實質性轉型行為。\n\n建議仍以原始產地（中國大陸）認定，惟請貴署參酌出口人所附技術文件後，併同法規意見回復海關。',
      },
    ],
  },
  {
    title: '本署回復',
    docs: [
      {
        type : '本署回復',
        no   : '貿管理字第1140912345號',
        date : '114/10/28',
        org  : '經濟部國際貿易署貿易管理組',
        contact1Name: '余副組長明芳', contact1Phone: '02-23977502', contact1Fax: '02-23970522',
        contact2Name: '彭瑜', contact2Phone: '02-23510271', contact2Fax: '',
        ext: '529',
        note : '',
        body : '復貴關114年10月14日ATEG1140027號函。\n\n經洽產業發展署研議，本案貨品加工程序未達實質轉型標準，產地應認定為中國大陸，請依此辦理後續通關事宜；如出口人標示與本認定不符，請依貿易法相關規定處理。',
      },
    ],
  },
];

const FlowEdit = {
  dragSrc: null,
  _isCustoms: false,
  /** 海關答聯單：記錄本次編輯session中新增的步驟 idx，渲染時加上 step-card--new 樣式 */
  _newStepIdxs: new Set(),
  /** 處分案例目前正在編輯／檢視的步驟資料（新增流程時為暫存草稿；編輯既有流程時為該版本 steps 的直接參照） */
  _workingSteps: null,
  _workingName: '',

  /** 取得當前資料來源：海關答聯單為固定 3 步驟，處分案例為 _workingSteps */
  _data() {
    return this._isCustoms ? CUSTOMS_FLOW_STEPS_DATA : (this._workingSteps || (this._workingSteps = [{ title: '新步驟', body: '<p></p>' }]));
  },

  /** 依 Nav._currentFlowId／_currentVersion 載入處分案例的工作用步驟資料（新增流程則給空白草稿） */
  _loadCasesWorkingData() {
    if (Nav._currentFlowId) {
      const flow = flowById(Nav._currentFlowId);
      const v = flowVersion(flow, Nav._currentVersion);
      Nav._currentVersion = v?.version || Nav._currentVersion;
      this._workingSteps = v?.steps || [{ title: '新步驟', body: '<p></p>' }];
      this._workingName = flow?.name || '';
    } else if (!this._workingSteps || !this._keepDraftOnNextInit) {
      this._workingSteps = [{ title: '新步驟', body: '<p></p>' }];
      this._workingName = '';
    }
    this._keepDraftOnNextInit = false;
  },

  init() {
    this._isCustoms = Nav._flowSource === 'customs';
    this._newStepIdxs = new Set();
    if (!this._isCustoms) this._loadCasesWorkingData();
    this._renderStepList();

    const genericEditor = $('flow-edit-generic');
    if (genericEditor) genericEditor.style.display = this._isCustoms ? 'none' : '';
    const docsEditor = $('flow-edit-docs');
    if (docsEditor) docsEditor.style.display = this._isCustoms ? '' : 'none';
    const titleEl = $('flow-right-title');
    if (titleEl) titleEl.readOnly = false;

    const isView = $('app-flow-edit')?.classList.contains('is-view-mode');
    if (!isView) this.bindDrag();  // 編輯模式下左側步驟皆可拖曳排序（含海關答聯單）；檢視模式不綁 drag
    const addDocBtn = document.querySelector('.flow-doc-add-btn');
    if (addDocBtn) addDocBtn.style.display = isView ? 'none' : '';
    // 檢視模式設 contenteditable="false"
    const body = $('flow-rich-body');
    if (body) body.contentEditable = isView ? 'false' : 'true';
    const first = document.querySelector('#flow-step-list .step-card');
    if (first) this.selectStep(first);

    // 附件區（獨立於步驟之外，整個流程共用）
    const uploadZone = document.querySelector('.flow-attach-section .nc-upload-zone');
    if (uploadZone) uploadZone.style.display = isView ? 'none' : '';
    this._renderFileList();

    this._renderCasesUI();
  },

  // ── 處分案例專用：分類欄位／複製來源／動作按鈕 ──
  _renderCasesUI() {
    const classifyRow = $('flow-classify-row');
    const metaRow = $('flow-meta-readonly');
    const titleField = $('flow-title-field');
    if (this._isCustoms) {
      if (classifyRow) classifyRow.style.display = 'none';
      if (metaRow) metaRow.style.display = 'none';
      this._renderActionButtons();
      return;
    }

    const isExisting = !!Nav._currentFlowId;
    if (classifyRow) classifyRow.style.display = isExisting ? 'none' : 'flex';
    if (metaRow) metaRow.style.display = isExisting ? 'flex' : 'none';
    // 編輯既有流程時，名稱已在下方 .flow-meta-readonly 的「流程」標籤唯讀顯示，不需要重複的可編輯標題欄位
    if (titleField) titleField.style.display = isExisting ? 'none' : '';

    const titleInput = $('flow-draft-title');
    if (!isExisting) {
      const l1Sel = $('flow-cat-l1');
      if (l1Sel && !l1Sel.value) l1Sel.value = 'ex';
      this._renderL2Options(l1Sel?.value || 'ex');
      this._syncL3();
      this._renderCopyFromOptions();
      if (titleInput) titleInput.value = this._workingName || '';
    } else {
      const flow = flowById(Nav._currentFlowId);
      const v = flowVersion(flow, Nav._currentVersion);
      const catEl = $('flow-meta-category');
      if (catEl) catEl.textContent = flow ? caseTreePath(flow.category.l2) : '';
      const nameEl = $('flow-meta-name');
      if (nameEl) nameEl.textContent = flow?.name || '';
      const verEl = $('flow-meta-version');
      if (verEl) verEl.textContent = v?.version || '';
      if (titleInput) titleInput.value = flow?.name || '';
      const l1Sel = $('flow-cat-l1'); if (l1Sel && flow) l1Sel.value = flow.category.l1;
      if (flow) this._renderL2Options(flow.category.l1);
      // 流程的 category.l2 目前存的是最深一層（產品類為第三層 id），這裡拆回「第二層值」＋「第三層值」
      // 分別回填隱藏中的 classify-row（分類列此時是隱藏的，僅供 commitCasesEdit() 讀值用，避免存檔時遺失分類）
      const { l2: l2Base, l3: l3Val } = flow ? this._resolveL2L3(flow.category.l1, flow.category.l2) : { l2: '', l3: '' };
      const l2Sel = $('flow-cat-l2'); if (l2Sel && flow) l2Sel.value = l2Base;
      this._syncL3();
      const l3Sel = $('flow-cat-l3'); if (l3Sel && l3Val) l3Sel.value = l3Val;
    }

    this._renderActionButtons();
  },

  _renderL2Options(l1) {
    const sel = $('flow-cat-l2');
    if (!sel) return;
    const opts = caseTreeL2Options(l1);
    sel.innerHTML = '<option value="">請選擇</option>' + opts.map(o => `<option value="${o.cat}">${esc(o.label)}</option>`).join('');
  },

  /** 找出某分類 id 的「所屬第二層」與「若本身即為第三層則帶出其值」，供回填 L2/L3 選單使用 */
  _resolveL2L3(l1, categoryId) {
    for (const node of CASE_TREE[l1]) {
      if (node.cat === categoryId) return { l2: node.cat, l3: '' };
      const child = node.children?.find(c => c.cat === categoryId);
      if (child) return { l2: node.cat, l3: child.cat };
    }
    return { l2: categoryId, l3: '' };
  },

  onCatL1Change() {
    this._renderL2Options($('flow-cat-l1')?.value || 'ex');
    this._syncL3();
    this._renderCopyFromOptions();
  },

  onCatL2Change() {
    this._syncL3();
    this._renderCopyFromOptions();
  },

  onCatL3Change() {
    this._renderCopyFromOptions();
  },

  /** 第二層選到「產品」時才顯示第三層選單（僅產品有第三層，比照 CASE_TREE／新增案例表單的邏輯） */
  _syncL3() {
    const l1 = $('flow-cat-l1')?.value || 'ex';
    const l2 = $('flow-cat-l2')?.value || '';
    const l3Field = $('flow-cat-l3-field');
    const l3Sel = $('flow-cat-l3');
    const isProduct = l2 === `${l1}-product`;
    if (l3Field) l3Field.style.display = isProduct ? 'flex' : 'none';
    if (!l3Sel) return;
    if (!isProduct) { l3Sel.innerHTML = ''; return; }
    const node = CASE_TREE[l1].find(n => n.cat === l2);
    l3Sel.innerHTML = (node?.children || []).map(c => `<option value="${c.cat}">${esc(c.label)}</option>`).join('');
  },

  /** 依目前分類（優先第三層，否則第二層）帶出可複製的既有流程 */
  _renderCopyFromOptions() {
    const sel = $('flow-copy-from');
    if (!sel) return;
    const l1 = $('flow-cat-l1')?.value || 'ex';
    const l2Base = $('flow-cat-l2')?.value || '';
    const l3 = ($('flow-cat-l3-field')?.style.display !== 'none') ? $('flow-cat-l3')?.value : '';
    const catId = l3 || l2Base;
    const candidates = FLOWS_DATA.filter(f => f.category.l1 === l1 && (!catId || f.category.l2 === catId));
    sel.innerHTML = '<option value="">不複製，從空白開始</option>' +
      candidates.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
  },

  onCopyFromChange(flowId) {
    if (!flowId) {
      this._workingSteps = [{ title: '新步驟', body: '<p></p>' }];
    } else {
      const src = flowById(flowId);
      const v = flowActiveVersion(src);
      this._workingSteps = v ? JSON.parse(JSON.stringify(v.steps)) : [{ title: '新步驟', body: '<p></p>' }];
      const titleInput = $('flow-draft-title');
      if (titleInput && !titleInput.value.trim() && src) titleInput.value = `${src.name}（複本）`;
      Toast.show(`已複製「${src?.name}」的步驟內容，可再自行調整`);
    }
    this._keepDraftOnNextInit = true;
    this._renderStepList();
    this.bindDrag();
    const first = document.querySelector('#flow-step-list .step-card');
    if (first) this.selectStep(first);
  },

  _renderActionButtons() {
    const wrap = $('flow-edit-actions');
    if (!wrap) return;
    if (this._isCustoms) {
      wrap.innerHTML = `
        <button class="back-btn-lg" onclick="KM.goFlowList()">＜ 返回</button>
        <button class="btn btn--clear" onclick="KM.toast('確認刪除此流程？')">刪除</button>
        <button class="btn btn--search" onclick="KM.flowSave()">儲存</button>`;
      return;
    }
    const isExisting = !!Nav._currentFlowId;
    wrap.innerHTML = `
      <button class="back-btn-lg" onclick="KM.goFlowList('cases')">＜ 返回</button>
      ${isExisting ? `<button class="btn btn--clear" onclick="KM.flowVoid()">作廢</button>` : ''}
      <button class="btn btn--outline" onclick="KM.flowCasesCommit('draft')">儲存</button>
      <button class="btn btn--search" onclick="KM.flowCasesCommit('active')">發布</button>`;
  },

  /** 依資料來源重建左側步驟清單（編輯模式皆可拖曳排序，含海關答聯單） */
  _renderStepList() {
    const list = $('flow-step-list');
    if (!list) return;
    const data = this._data();
    list.innerHTML = data.map((d, i) => {
      const sep = i < data.length - 1 ? '<div class="step-sep">↓</div>' : '';
      const isNew = this._isCustoms && this._newStepIdxs.has(i);
      return `<div class="step-card${i === 0 ? ' is-active' : ''}${isNew ? ' step-card--new' : ''}" draggable="true" data-idx="${i}">
        <div class="step-drag">⠿</div>
        <div class="step-info" onclick="KM.flowSelectStep(this.closest('.step-card'))">
          <div class="step-num">Step${i + 1}</div>
          <div class="step-title-sm">${esc(d.title)}</div>
        </div>
      </div>${sep}`;
    }).join('');
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

  /** 目前選中的步驟索引（供海關答聯單的多筆文件清單操作用） */
  _currentStepIdx: 0,

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

    // 載入對應步驟的假資料內容（以 data-idx 對應，新增的自訂步驟無對應資料則維持手動內容）
    const idx  = parseInt(card.dataset.idx ?? '', 10);
    this._currentStepIdx = idx;
    const data = Number.isInteger(idx) ? this._data()[idx] : null;
    if (data && !this._isCustoms) {
      if (bodyEl)  bodyEl.innerHTML = data.body;
      if (titleEl) titleEl.value    = data.title;
      card.querySelector('.step-title-sm').textContent = data.title;
    }

    if (this._isCustoms) this._renderDocList();
  },

  updateTitle(val) {
    const active = document.querySelector('#flow-step-list .step-card.is-active');
    if (active) active.querySelector('.step-title-sm').textContent = val;
    const idx = parseInt(active?.dataset.idx ?? '', 10);
    if (this._isCustoms) {
      if (Number.isInteger(idx) && CUSTOMS_FLOW_STEPS_DATA[idx]) CUSTOMS_FLOW_STEPS_DATA[idx].title = val;
    } else if (Number.isInteger(idx) && this._workingSteps[idx]) {
      this._workingSteps[idx].title = val;
    }
  },

  /** 處分案例：步驟內文編輯即時寫回 _workingSteps（海關答聯單不適用，其內文在各筆來文/回文的 textarea 內） */
  updateBody(html) {
    if (this._isCustoms) return;
    const active = document.querySelector('#flow-step-list .step-card.is-active');
    const idx = parseInt(active?.dataset.idx ?? '', 10);
    if (Number.isInteger(idx) && this._workingSteps[idx]) this._workingSteps[idx].body = html;
  },

  /** 取得目前步驟的文件清單（海關答聯單專用） */
  _currentDocs() {
    return CUSTOMS_FLOW_STEPS_DATA[this._currentStepIdx]?.docs ?? [];
  },

  /** 重繪目前步驟的來文／回文清單（附件已獨立於流程之外，見 _files / _renderFileList） */
  /** 公文屬性 → 全文欄位的可變動小字標籤 */
  _bodyLabel(type) {
    return (type === '發文' || type === '海關來文') ? '案情摘要及疑問' : '權責機關答復';
  },

  /** 答聯單狀態下拉變更時，需重繪以同步全文欄位的小字標籤 */
  changeDocType(idx, val) {
    this.updateDocField(idx, 'type', val);
    this._renderDocList();
  },

  _renderDocList() {
    const list = $('flow-doc-list');
    if (!list) return;
    const docs = this._currentDocs();
    list.innerHTML = docs.map((d, i) => `
      <div class="flow-doc-card">
        <div class="flow-doc-hd">
          <div class="nc-fields-grid nc-fields-grid--3" style="flex:1;margin-bottom:0">
            <div class="nc-field">
              <label class="nc-label nc-label--muted">答聯單狀態</label>
              <select class="filter-select flow-doc-type" onchange="KM.flowDocTypeChange(${i},this.value)">
                <option value="海關來文" ${d.type === '海關來文' ? 'selected' : ''}>海關來文</option>
                <option value="本署回復" ${d.type === '本署回復' ? 'selected' : ''}>本署回復</option>
                <option value="發文" ${d.type === '發文' ? 'selected' : ''}>發文</option>
                <option value="回文" ${d.type === '回文' ? 'selected' : ''}>回文</option>
              </select>
            </div>
            <div class="nc-field">
              <label class="nc-label">發文文號</label>
              <input type="text" class="nc-input" value="${esc(d.no)}" oninput="KM.flowDocUpdate(${i},'no',this.value)">
            </div>
            <div class="nc-field">
              <label class="nc-label">發文日期</label>
              <input type="text" class="nc-input" value="${esc(d.date)}" oninput="KM.flowDocUpdate(${i},'date',this.value)">
            </div>
          </div>
          ${docs.length > 1 ? `<button class="flow-doc-remove" onclick="KM.flowRemoveDoc(${i})" title="刪除"><span class="mi">close</span></button>` : ''}
        </div>
        <div class="nc-field" style="margin-bottom:10px">
          <label class="nc-label">機關名稱</label>
          <input type="text" class="nc-input" placeholder="請輸入發文／受文機關" value="${esc(d.org ?? '')}" oninput="KM.flowDocUpdate(${i},'org',this.value)">
        </div>
        <div class="nc-fields-grid nc-fields-grid--3">
          <div class="nc-field">
            <label class="nc-label">聯絡人</label>
            <input type="text" class="nc-input" placeholder="選填" value="${esc(d.contact1Name ?? '')}" oninput="KM.flowDocUpdate(${i},'contact1Name',this.value)">
          </div>
          <div class="nc-field">
            <label class="nc-label">電話號碼</label>
            <input type="text" class="nc-input" placeholder="選填" value="${esc(d.contact1Phone ?? '')}" oninput="KM.flowDocUpdate(${i},'contact1Phone',this.value)">
          </div>
          <div class="nc-field">
            <label class="nc-label">電傳號碼</label>
            <input type="text" class="nc-input" placeholder="選填" value="${esc(d.contact1Fax ?? '')}" oninput="KM.flowDocUpdate(${i},'contact1Fax',this.value)">
          </div>
        </div>
        <div class="nc-fields-grid nc-fields-grid--3">
          <div class="nc-field">
            <label class="nc-label">承辦人</label>
            <input type="text" class="nc-input" placeholder="選填" value="${esc(d.contact2Name ?? '')}" oninput="KM.flowDocUpdate(${i},'contact2Name',this.value)">
          </div>
          <div class="nc-field">
            <label class="nc-label">電話號碼</label>
            <input type="text" class="nc-input" placeholder="選填" value="${esc(d.contact2Phone ?? '')}" oninput="KM.flowDocUpdate(${i},'contact2Phone',this.value)">
          </div>
          <div class="nc-field">
            <label class="nc-label">電傳號碼</label>
            <input type="text" class="nc-input" placeholder="選填" value="${esc(d.contact2Fax ?? '')}" oninput="KM.flowDocUpdate(${i},'contact2Fax',this.value)">
          </div>
        </div>
        <div class="nc-fields-grid nc-fields-grid--3">
          <div class="nc-field">
            <label class="nc-label">市話／分機</label>
            <div class="nc-ext-row">
              <input type="text" class="nc-input" placeholder="市話" value="${esc(d.extPhone ?? '')}" oninput="KM.flowDocUpdate(${i},'extPhone',this.value)">
              <input type="text" class="nc-input nc-ext-input" placeholder="分機" value="${esc(d.ext ?? '')}" oninput="KM.flowDocUpdate(${i},'ext',this.value)">
            </div>
          </div>
          <div class="nc-field nc-field--span2">
            <label class="nc-label">備註</label>
            <input type="text" class="nc-input" placeholder="選填" value="${esc(d.note ?? '')}" oninput="KM.flowDocUpdate(${i},'note',this.value)">
          </div>
        </div>
        <div class="nc-field">
          <label class="nc-label nc-label--body-hint">${this._bodyLabel(d.type)}</label>
          <textarea class="nc-textarea" rows="4" placeholder="請輸入公文內容…" oninput="KM.flowDocUpdate(${i},'body',this.value)">${esc(d.body)}</textarea>
        </div>
      </div>`).join('');
  },

  /** 新增一筆來文／回文（保留可新增性：同一階段可能多次往復公文） */
  addDoc() {
    const docs = this._currentDocs();
    docs.push({
      type: '海關來文', no: '', date: '', org: '',
      contact1Name: '', contact1Phone: '', contact1Fax: '',
      contact2Name: '', contact2Phone: '', contact2Fax: '',
      extPhone: '', ext: '', note: '', body: '',
    });
    this._renderDocList();
  },

  removeDoc(idx) {
    const docs = this._currentDocs();
    docs.splice(idx, 1);
    this._renderDocList();
  },

  updateDocField(idx, field, val) {
    const doc = this._currentDocs()[idx];
    if (doc) doc[field] = val;
  },

  /** 附件：獨立於流程步驟之外，整個流程（無論幾個步驟）共用一份清單 */
  _files: [],

  handleFiles(input) {
    [...(input.files || [])].forEach(f => {
      f.note = '';
      this._files.push(f);
    });
    input.value = '';
    this._renderFileList();
  },

  removeFile(idx) {
    this._files.splice(idx, 1);
    this._renderFileList();
  },

  updateFileNote(idx, val) {
    if (this._files[idx]) this._files[idx].note = val;
  },

  _renderFileList() {
    const list = $('flow-file-list');
    if (!list) return;
    if (this._files.length === 0) {
      list.innerHTML = '<span class="nc-empty-hint">尚未選擇任何附件</span>';
      return;
    }
    list.innerHTML = this._files.map((f, i) => `
      <div class="nc-file-item">
        <span class="mi" style="color:#2457A7;font-size:18px">attach_file</span>
        <div class="nc-file-main">
          <span class="nc-file-name">${esc(f.name)}</span>
          <input type="text" class="nc-file-note" placeholder="輸入備註（選填）" value="${esc(f.note || '')}" oninput="KM.flowUpdateFileNote(${i},this.value)">
        </div>
        <span class="nc-file-size">${(f.size / 1024).toFixed(0)} KB</span>
        <button class="nc-file-remove" onclick="KM.flowRemoveFile(${i})"><span class="mi">close</span></button>
      </div>`).join('');
  },

  addStep() {
    if (this._isCustoms) {
      // 海關答聯單往來次數不固定，新步驟依時間序加在最後，並建立對應的文件清單資料
      CUSTOMS_FLOW_STEPS_DATA.push({ title: '新步驟', docs: [] });
      const idx = CUSTOMS_FLOW_STEPS_DATA.length - 1;
      this._newStepIdxs.add(idx);
      this._renderStepList();
      this.bindDrag();
      const newCard = document.querySelector(`#flow-step-list .step-card[data-idx="${idx}"]`);
      if (newCard) this.selectStep(newCard);
      Toast.show(`已新增 Step${idx + 1}，請填寫內容`);
      return;
    }
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
//  FlowList — 流程清單
//  cases（處分案例）：資料驅動，來源為 js/data.js 的 FLOWS_DATA。
//  customs（海關答聯單）：沿用原本固定 3 組流程的 DOM 操作邏輯，未變更。
// ─────────────────────────────────────────────────────────
// 目前選中的 flow-row（供 customs 複製用）
let _selectedFlowRow = null;
const CURRENT_USER = '王大明';
const nowDateStr = () => new Date().toLocaleDateString('zh-TW').replace(/\//g, '/');
const nowTimeStr = () => {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const FlowList = {
  /** 點擊 flow-row 選中效果 */
  selectRow(el) {
    el.closest('.scr')?.querySelectorAll('.flow-row, .pending-row').forEach(r => r.classList.remove('is-selected'));
    el.classList.add('is-selected');
    _selectedFlowRow = el;
  },

  // ── customs：舊有邏輯，完全未變更 ──────────────────────────
  save() {
    Nav.goFlowList();
    const draftRow = $('flow-draft-row');
    if (draftRow) draftRow.style.display = '';
    const reviewRow = $('flow-review-row');
    if (reviewRow) reviewRow.style.display = '';
    const editBtn = $('flow-1-edit-btn');
    if (editBtn) editBtn.style.display = 'none';
    Toast.show('草稿已儲存，已送出審核');
  },

  /** 審核人員：同意 / 退回（僅海關答聯單使用；處分案例流程不需審核，無此路徑） */
  approve() {
    this.publish();
    const reviewRow = $('flow-review-row');
    if (reviewRow) reviewRow.style.display = 'none';
    Nav._reviewFromPending ? Nav.goPendingReview() : Nav.goFlowList();
    Toast.show('已同意，流程發佈成功');
  },

  reject() {
    const reviewRow = $('flow-review-row');
    if (reviewRow) reviewRow.style.display = 'none';
    const editBtn = $('flow-1-edit-btn');
    if (editBtn) editBtn.style.display = '';
    Nav._reviewFromPending ? Nav.goPendingReview() : Nav.goFlowList();
    Toast.show('已退回，請修改後重新送審');
  },

  /** 發布（僅海關答聯單使用） */
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

  /** 啟用／停用。cases：id 為 flow.id 字串；customs：id 為數字，沿用舊邏輯 */
  toggleEnabled(id) {
    if (Nav._flowSource === 'cases') {
      const flow = flowById(id);
      if (!flow) return;
      flow.enabled = !flow.enabled;
      this.render();
      return;
    }
    const t = $(`toggle-${id}`);
    if (!t) return;
    const isOn = t.classList.toggle('is-on');
    const label = $(`toggle-${id}-label`);
    if (label) label.textContent = isOn ? '啟用' : '停用';
  },

  /** 複製選中（或第一個）的流程，附加到清單最下方（僅 customs；cases 改在「新增流程」內提供複製來源選單） */
  copy() {
    const list   = $('flow-group-list-customs');
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

  /** 進入檢視模式（唯讀，僅 customs 使用；cases 改由列表按鈕直接帶 flowId/version 呼叫 KM.goFlowView） */
  view() {
    Nav.goFlowView();
  },

  /** 目前開啟中的版本作廢（cases 專用，於流程編輯頁的「作廢」按鈕呼叫） */
  voidCurrent() {
    const flow = flowById(Nav._currentFlowId);
    const v = flowVersion(flow, Nav._currentVersion);
    if (!flow || !v) return;
    v.status = 'void';
    Toast.show(`已作廢版本 ${v.version}`);
    Nav.goFlowList('cases');
  },

  /** cases 專用：新增流程或編輯既有流程的「儲存」／「發布」，流程不需他人審核，皆為自行操作：
   *  儲存＝存成草稿版本（不影響現行 active 版本，可繼續編輯）；發布＝直接成為新的現行版本（前一現行版本轉舊版本）。 */
  commitCasesEdit(targetStatus) {
    const name = ($('flow-draft-title')?.value || '').trim();
    if (!name) { Toast.show('請輸入流程名稱'); return; }
    const l1 = $('flow-cat-l1')?.value;
    const l2Base = $('flow-cat-l2')?.value;
    if (!l1 || !l2Base) { Toast.show('請選擇對應第二層樣態'); return; }
    const isProduct = l2Base === `${l1}-product`;
    const l3 = ($('flow-cat-l3-field')?.style.display !== 'none') ? $('flow-cat-l3')?.value : '';
    if (isProduct && !l3) { Toast.show('請選擇對應第三層樣態'); return; }
    const l2 = l3 || l2Base; // 實際寫入 flow.category.l2 的分類 id：產品類為第三層，其餘維持第二層
    const steps = FlowEdit._workingSteps || [{ title: '新步驟', body: '<p></p>' }];

    if (Nav._currentFlowId) {
      const flow = flowById(Nav._currentFlowId);
      if (!flow) return;
      flow.name = name;
      flow.category = { l1, l2 };
      if (targetStatus === 'active') {
        // 發布：現行版本轉舊版本，若先前存過草稿則一併移除（已併入這次發布）
        flow.versions = flow.versions.filter(v => v.status !== 'draft');
        flow.versions.forEach(v => { if (v.status === 'active') v.status = 'archived'; });
        const newVersion = flowNextVersionFor(flow);
        flow.versions.unshift({ version: newVersion, status: 'active', date: nowDateStr(), submitter: CURRENT_USER, steps, signoffs: [] });
        Nav._currentVersion = newVersion;
      } else {
        // 儲存草稿：更新既有草稿內容，沒有的話新增一筆；現行 active 版本維持不動
        let draft = flow.versions.find(v => v.status === 'draft');
        if (draft) {
          draft.steps = steps;
          draft.date = nowDateStr();
        } else {
          draft = { version: flowNextVersionFor(flow), status: 'draft', date: nowDateStr(), submitter: CURRENT_USER, steps, signoffs: [] };
          flow.versions.unshift(draft);
        }
        Nav._currentVersion = draft.version;
      }
    } else {
      const id = 'flow-' + Date.now();
      FLOWS_DATA.push({
        id, name, enabled: true,
        category: { l1, l2 },
        versions: [{ version: 'v1.0', status: targetStatus, date: nowDateStr(), submitter: CURRENT_USER, steps, signoffs: [] }],
      });
      Nav._currentFlowId = id;
    }
    Toast.show(targetStatus === 'active' ? '發布成功！流程已上線' : '草稿已儲存');
    Nav.goFlowList('cases');
  },

  /** 流程總覽表格：目前展開「舊版本」區塊的流程 id 集合（流程不需審核，僅 active／archived 兩種版本狀態） */
  _expanded: new Set(),
  /** 標題右側「排序依據」：異動日期新到舊／舊到新 */
  _sortDir: 'desc',

  toggleExpand(flowId) {
    if (this._expanded.has(flowId)) this._expanded.delete(flowId); else this._expanded.add(flowId);
    this.render();
  },

  setSortDir(dir) {
    this._sortDir = dir === 'asc' ? 'asc' : 'desc';
    this.render();
  },

  /** 每列僅顯示現行（active）版本；舊版本點擊左側箭頭展開，欄位比照現行版本列、整列灰色顯示，僅提供「檢視」 */
  _rowHtml(flow) {
    const active = flowActiveVersion(flow);
    const archived = flow.versions.filter(v => v !== active);
    const catLabel = caseTreePath(flow.category.l2);
    const expanded = this._expanded.has(flow.id);

    const chevron = archived.length
      ? `<span class="mi flow-row-chevron" onclick="event.stopPropagation();KM.flowToggleExpand('${flow.id}')">chevron_right</span>`
      : '';

    const mainRow = `<tr class="flow-row-main${expanded ? ' is-expanded' : ''}" data-flow-id="${flow.id}">
        <td class="flow-td-expand">${chevron}</td>
        <td class="flow-td-name">${esc(flow.name)}</td>
        <td>${esc(catLabel)}</td>
        <td class="flow-td-nowrap">${esc(active.version)}</td>
        <td class="flow-td-nowrap">${esc(active.date)}</td>
        <td class="flow-td-actions">
          <button class="btn-edit-flow btn-edit-flow--primary" onclick="event.stopPropagation();KM.goFlowEdit('${flow.id}','${active.version}')"><span class="mi">edit</span>編輯</button>
          <button class="btn-edit-flow" onclick="event.stopPropagation();KM.goFlowView('${flow.id}','${active.version}')"><span class="mi">search</span>檢視</button>
          <div class="flow-toggle-wrap" onclick="event.stopPropagation()">
            <div class="toggle-track${flow.enabled ? ' is-on' : ''}" onclick="KM.flowToggleEnabled('${flow.id}')"></div>
            <span class="flow-toggle-label">${flow.enabled ? '啟用' : '停用'}</span>
          </div>
        </td>
      </tr>`;

    const archiveRows = archived.map(v => `<tr class="flow-row-archive${expanded ? ' is-open' : ''}">
        <td class="flow-td-expand"></td>
        <td class="flow-td-name">${esc(flow.name)}</td>
        <td>${esc(catLabel)}</td>
        <td class="flow-td-nowrap">${esc(v.version)}</td>
        <td class="flow-td-nowrap">${esc(v.date)}</td>
        <td class="flow-td-actions">
          <button class="btn-edit-flow" onclick="event.stopPropagation();KM.goFlowView('${flow.id}','${v.version}')"><span class="mi">search</span>檢視</button>
        </td>
      </tr>`).join('');

    return mainRow + archiveRows;
  },

  /** cases 專用：依左側 FlowNav 目前選中的出口/進口＋流程，再套用標題列的排序，重繪表格 */
  render() {
    const tbody = $('flow-table-body');
    if (!tbody) return;

    let flows = FLOWS_DATA.filter(f => (typeof FlowNav === 'undefined') || FlowNav.matches(f));
    flows = [...flows].sort((a, b) => {
      const da = flowActiveVersion(a)?.date || '';
      const db = flowActiveVersion(b)?.date || '';
      return this._sortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });

    tbody.innerHTML = flows.map(f => this._rowHtml(f)).join('');
    const empty = $('flow-table-empty');
    if (empty) empty.style.display = flows.length ? 'none' : 'block';
  },
};

// ─────────────────────────────────────────────────────────
//  FlowNav — 處理流程總覽左側樹狀導覽：出口/進口 pill 切換 → 四大類別（灰字，
//  僅作視覺分組，不可點選）→ 該類別下的個別流程（可點選，篩選右側表格只顯示該流程）。
//  結構比照 CaseNav，但第二層固定為 CASE_TREE 的四大類別，不會有第三層。
// ─────────────────────────────────────────────────────────
const FlowNav = {
  direction: 'ex',
  selected: null, // null＝顯示該方向全部流程；否則為選中的分類 id（第二層或第三層皆可）
  expanded: new Set(['product']),

  init() {
    this.direction = 'ex';
    this.expanded = new Set(['product']);
    this.selected = null;
    if (typeof FlowList !== 'undefined') FlowList._sortDir = 'desc';
    this._syncTabs();
    this._syncTitle();
    this.render();
  },

  switchDirection(dir) {
    this.direction = dir;
    this.selected = null;
    this.expanded = new Set(['product']);
    this._syncTabs();
    this._syncTitle();
    this.render();
  },

  _syncTabs() {
    $('flow-nav-tab-ex')?.classList.toggle('is-active', this.direction === 'ex');
    $('flow-nav-tab-im')?.classList.toggle('is-active', this.direction === 'im');
  },

  /** 右側「流程清單」標題跟著目前選中的節點走，未選取時顯示預設文字（比照 CaseNav 的 _syncTitle） */
  _syncTitle() {
    const titleEl = $('flow-list-hd-title');
    if (!titleEl) return;
    titleEl.textContent = this.selected ? (this._labelFor(this.selected) || '流程清單') : '流程清單';
  },

  _labelFor(catId) {
    for (const node of CASE_TREE[this.direction]) {
      if (node.cat === catId) return node.label;
      const child = node.children?.find(c => c.cat === catId);
      if (child) return child.label;
    }
    return '';
  },

  /** 點擊第二層或第三層節點：與 CaseNav 一致，選中群組本身會涵蓋其下所有子項的流程 */
  select(catId) {
    this.selected = catId;
    this._syncTitle();
    this.render();
  },

  toggleExpand(bareKey, ev) {
    ev?.stopPropagation();
    if (this.expanded.has(bareKey)) this.expanded.delete(bareKey); else this.expanded.add(bareKey);
    this.render();
  },

  /** 供 FlowList 使用：是否顯示此流程（方向需相符；未選取時顯示全部，選中第二層則涵蓋其下第三層，選中第三層則只顯示該子項） */
  matches(flow) {
    if (flow.category.l1 !== this.direction) return false;
    const sel = this.selected;
    if (!sel) return true;
    return flow.category.l2 === sel || flow.category.l2.startsWith(sel + '-');
  },

  _countFor(catId) {
    return FLOWS_DATA.filter(f => f.category.l1 === this.direction && (f.category.l2 === catId || f.category.l2.startsWith(catId + '-'))).length;
  },

  render() {
    this._syncTabs();
    const body = $('flow-nav-body');
    if (body) body.innerHTML = CASE_TREE[this.direction].map(n => this._nodeHtml(n)).join('');
    if (typeof FlowList !== 'undefined') FlowList.render();
  },

  /** 節點渲染邏輯與 CaseNav._nodeHtml 完全一致（「產品」有第三層子項，其餘三類沒有），
   *  差別只在計數與篩選對象改為 FLOWS_DATA 的流程，而非案例。 */
  _nodeHtml(n) {
    const bareKey = n.cat.split('-')[1];
    const icon = CASE_NAV_ICONS[bareKey] || 'folder';
    const count = this._countFor(n.cat);

    if (!n.children) {
      const isActive = this.selected === n.cat;
      return `<div class="case-nav-item${isActive ? ' is-active' : ''}" onclick="KM.flowNavSelect('${n.cat}')">
          <span class="mi case-nav-item-ico">${icon}</span>
          <span class="case-nav-item-label">${esc(n.label)}</span>
          <span class="case-nav-item-count">${count}</span>
        </div>`;
    }

    const expanded = this.expanded.has(bareKey);
    const isGroupActive = this.selected === n.cat || n.children.some(c => c.cat === this.selected);
    return `<div class="case-nav-group${expanded ? ' is-expanded' : ''}">
        <div class="case-nav-item case-nav-item--parent${isGroupActive ? ' is-active' : ''}" onclick="KM.flowNavSelect('${n.cat}')">
          <span class="mi case-nav-item-ico">${icon}</span>
          <span class="case-nav-item-label">${esc(n.label)}</span>
          <span class="case-nav-item-count">${count}</span>
          <span class="mi case-nav-item-chevron" onclick="KM.flowNavToggleExpand('${bareKey}',event)">chevron_right</span>
        </div>
        <div class="case-nav-children">
          ${n.children.map(c => {
            const active = this.selected === c.cat;
            const childCount = this._countFor(c.cat);
            return `<div class="case-nav-child${active ? ' is-active' : ''}" onclick="KM.flowNavSelect('${c.cat}')">
                <span class="case-nav-child-label">${esc(c.label)}</span>
                <span class="case-nav-item-count">${childCount}</span>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  },
};

// ─────────────────────────────────────────────────────────
//  PendingReview — 待審表單詳情頁（首頁「待審」按鈕進入）
// ─────────────────────────────────────────────────────────
const PendingReview = {
  _pageSize: 10,
  _currentPage: {},
  /** 少於這個數量時，不顯示該分類的分頁列（含每頁筆數選擇器） */
  _minForPagination: 10,

  init() {
    this._renderCasesRows();
    this._currentPage = {};
    document.querySelectorAll('.pending-group').forEach(g => {
      this._currentPage[g.dataset.group] = 1;
      this._renderGroup(g.dataset.group);
    });
    this._syncOverall();
  },

  /** 「處分案例」分類：資料驅動，列出 CASES_DATA 中所有 status 為 pending 的案例（審核案例，非流程） */
  /** 待審清單只提供「檢視」，同意／退回只能在案例審核詳情頁（KM.goCaseReview）操作。
   *  仍在 pending 狀態卻已有簽核紀錄的案例，代表曾被退回過，功能欄多一顆「簽核紀錄」按鈕，
   *  點擊後向下展開淺橘色色塊，滿版顯示完整簽核資訊（序號／簽核者／意見／簽核時間）。 */
  _renderCasesRows() {
    const list = document.querySelector('.pending-group[data-group="cases"] .pending-review-list');
    const emptyHint = list?.querySelector('.pending-group-empty');
    if (!list || !emptyHint) return;
    list.querySelectorAll('.pending-row, .pending-signoff-block').forEach(r => r.remove());

    CASES_DATA.filter(c => c.status === 'pending').forEach(c => {
      const flow = c.flowId ? flowById(c.flowId) : null;
      const catPath = caseTreePath(c.categoryId);
      const flowText = flow ? `／${esc(flow.name)}` : '';
      const signoffs = c.signoffs || [];
      const wasRejected = signoffs.length > 0;
      const signoffBtn = wasRejected
        ? `<button class="btn-edit-flow" onclick="event.stopPropagation();KM.pendingToggleSignoff('${c.id}')"><span class="mi">history</span>簽核紀錄</button>`
        : '';
      const row = document.createElement('div');
      row.className = 'pending-row';
      row.dataset.caseId = c.id;
      row.setAttribute('onclick', 'KM.flowSelectRow(this)');
      row.innerHTML = `
        <span class="pending-date">${esc(c.submitDate || '')}</span>
        <span class="pending-name">${esc(c.docNo)}</span>
        <span class="pending-submitter">${esc(c.submitter || '')}</span>
        <span class="pending-flow">${esc(catPath)}${flowText}</span>
        <span class="pending-status-pill${wasRejected ? ' pending-status-pill--reject' : ''}">${wasRejected ? '退回' : '待審'}</span>
        <div class="pending-actions">
          <button class="btn-edit-flow" onclick="event.stopPropagation();KM.goCaseReview(this)"><span class="mi">search</span>檢視</button>
          ${signoffBtn}
        </div>`;
      list.insertBefore(row, emptyHint);

      if (signoffs.length) {
        const block = document.createElement('div');
        block.className = 'pending-signoff-block';
        block.id = `pending-signoff-${c.id}`;
        block.innerHTML = `
          <table class="review-signoff-table">
            <thead><tr><th>序號</th><th>簽核者</th><th>意見</th><th>簽核時間</th></tr></thead>
            <tbody>
              ${signoffs.map(s => `<tr>
                  <td>${s.seq}</td><td>${esc(s.signer)}</td><td>${esc(s.comment)}</td><td>${esc(s.time)}</td>
                </tr>`).join('')}
            </tbody>
          </table>`;
        list.insertBefore(block, emptyHint);
      }
    });
  },

  /** 展開／收合某一筆的簽核紀錄色塊；id 為案例 id 或海關答聯單示範用的固定字串 */
  toggleSignoff(id) {
    document.getElementById(`pending-signoff-${id}`)?.classList.toggle('is-open');
  },

  changePageSize(group, size) {
    this._pageSize = Number(size) || 10;
    this._currentPage[group] = 1;
    this._renderGroup(group);
  },

  /** 更新整體待審徽章數量、各分類件數標示，及全部清空時的提示 */
  _syncOverall() {
    const total = document.querySelectorAll('.pending-row').length;
    document.querySelectorAll('.pending-count-badge').forEach(b => b.textContent = total);
    const pageBadge = $('pending-review-count');
    if (pageBadge) pageBadge.textContent = total;

    document.querySelectorAll('.pending-group').forEach(g => {
      const count = g.querySelectorAll('.pending-row').length;
      const countEl = g.querySelector('.pending-group-count');
      if (countEl) countEl.textContent = count;
      g.style.display = total === 0 ? 'none' : '';
    });

    const empty = $('pending-review-empty');
    if (empty) empty.style.display = total === 0 ? 'block' : 'none';
  },

  /** 依目前頁碼只顯示該分類該頁的列；該分類總數低於門檻時隱藏其分頁列 */
  _renderGroup(group) {
    if (!group) return;
    const groupEl = document.querySelector(`.pending-group[data-group="${group}"]`);
    if (!groupEl) return;

    const rows = [...groupEl.querySelectorAll('.pending-row')];
    const groupEmpty = groupEl.querySelector('.pending-group-empty');
    if (groupEmpty) groupEmpty.style.display = rows.length === 0 ? 'block' : 'none';

    const pagination = groupEl.querySelector('.pending-pagination');
    if (pagination) pagination.style.display = rows.length < this._minForPagination ? 'none' : 'flex';

    const totalPages = Math.max(1, Math.ceil(rows.length / this._pageSize));
    if (!this._currentPage[group] || this._currentPage[group] > totalPages) this._currentPage[group] = totalPages;
    const cur = this._currentPage[group];

    rows.forEach((row, i) => {
      const page = Math.floor(i / this._pageSize) + 1;
      row.style.display = page === cur ? '' : 'none';
    });

    const pager = groupEl.querySelector('.pending-pager-btns');
    if (!pager) return;
    pager.innerHTML = '';
    if (totalPages <= 1) return;

    const mkBtn = (label, page, disabled, active) => {
      const b = document.createElement('button');
      b.className = 'pg-btn' + (active ? ' is-active' : '');
      b.textContent = label;
      b.disabled = !!disabled;
      b.onclick = () => { this._currentPage[group] = page; this._renderGroup(group); };
      return b;
    };
    pager.append(mkBtn('‹', cur - 1, cur === 1));
    for (let p = 1; p <= totalPages; p++) {
      pager.append(mkBtn(String(p), p, false, p === cur));
    }
    pager.append(mkBtn('›', cur + 1, cur === totalPages));
  },
};

// ─────────────────────────────────────────────────────────
//  CaseNav — 處分案例左側樹狀導覽（單選）：出口/進口 pill 切換 → 分類（附 icon，
//  可展開）→ 產品子項。取代先前的 checkbox 多選篩選面板（CaseFilter）。
//  每個選項旁的數字為「該節點（含其子項）目前有多少筆案例符合」，會隨搜尋
//  關鍵字即時更新，比照原本樹狀導覽的計數方式。
// ─────────────────────────────────────────────────────────
const CASE_NAV_ICONS = { product: 'inventory_2', trademark: 'verified', cites: 'description', violation: 'gavel' };

const CaseNav = {
  direction: 'ex',
  selected: 'ex-product-1',
  expanded: new Set(['product']),

  /** 每次進入處分案例頁時重置為預設導覽狀態（比照原本樹狀導覽的預設選中項目） */
  init() {
    this.direction = 'ex';
    this.expanded = new Set(['product']);
    this.selected = 'ex-product-1';
    this._syncTabs();
    this._syncTitle();
    this.render();
  },

  switchDirection(dir) {
    this.direction = dir;
    // 切換方向時，預設選中該方向第一個節點（若有子項則選其第一個子項）
    const first = CASE_TREE[dir][0];
    this.selected = first.children ? first.children[0].cat : first.cat;
    this.expanded = new Set([first.cat.split('-')[1]]);
    this._syncTabs();
    this._syncTitle();
    this.render();
  },

  _syncTabs() {
    $('case-nav-tab-ex')?.classList.toggle('is-active', this.direction === 'ex');
    $('case-nav-tab-im')?.classList.toggle('is-active', this.direction === 'im');
    const exCount = $('case-nav-tab-ex-count');
    if (exCount) exCount.textContent = this._countFor('ex');
    const imCount = $('case-nav-tab-im-count');
    if (imCount) imCount.textContent = this._countFor('im');
  },

  /** 目前選中節點的顯示名稱（群組本身或第三層子項皆可） */
  _labelFor(catId) {
    for (const node of CASE_TREE[this.direction]) {
      if (node.cat === catId) return node.label;
      const child = node.children?.find(c => c.cat === catId);
      if (child) return child.label;
    }
    return '';
  },

  /** 右側案例清單標題跟著目前選中的節點走，比照原本樹狀導覽的行為 */
  _syncTitle() {
    const titleEl = $('section-title');
    const label = this._labelFor(this.selected);
    if (titleEl && label) titleEl.textContent = label;
  },

  select(catId) {
    this.selected = catId;
    this._syncTitle();
    SidePanel.close();
    this.render();
  },

  toggleExpand(bareKey, ev) {
    ev?.stopPropagation();
    if (this.expanded.has(bareKey)) this.expanded.delete(bareKey); else this.expanded.add(bareKey);
    this.render();
  },

  /** 供 CaseList 使用：目前選中的節點若為群組（如「產品」）比對前綴，否則精準比對 */
  matches(c) {
    const sel = this.selected;
    return c.categoryId === sel || c.categoryId.startsWith(sel + '-');
  },

  _countFor(catId) {
    const rows = (typeof CaseList !== 'undefined') ? CaseList.countableRows() : CASES_DATA;
    return rows.filter(c => c.categoryId === catId || c.categoryId.startsWith(catId + '-')).length;
  },

  render() {
    this._syncTabs(); // 搜尋關鍵字改變時，Tab 上的總數也要跟著更新
    const body = $('case-nav-body');
    if (body) body.innerHTML = CASE_TREE[this.direction].map(n => this._nodeHtml(n)).join('');
    if (typeof CaseList !== 'undefined') CaseList.render();
  },

  _nodeHtml(n) {
    const bareKey = n.cat.split('-')[1];
    const icon = CASE_NAV_ICONS[bareKey] || 'folder';
    const count = this._countFor(n.cat);

    if (!n.children) {
      const isActive = this.selected === n.cat;
      return `<div class="case-nav-item${isActive ? ' is-active' : ''}" onclick="KM.caseNavSelect('${n.cat}')">
          <span class="mi case-nav-item-ico">${icon}</span>
          <span class="case-nav-item-label">${esc(n.label)}</span>
          <span class="case-nav-item-count">${count}</span>
          <span class="mi case-nav-item-chevron">chevron_right</span>
        </div>`;
    }

    const expanded = this.expanded.has(bareKey);
    // 選到第三層子項時，第二層父節點（如「產品」）的樣式要保留 active，不能因為選取焦點移到子項就消失
    const isGroupActive = this.selected === n.cat || n.children.some(c => c.cat === this.selected);
    return `<div class="case-nav-group${expanded ? ' is-expanded' : ''}">
        <div class="case-nav-item case-nav-item--parent${isGroupActive ? ' is-active' : ''}" onclick="KM.caseNavSelect('${n.cat}')">
          <span class="mi case-nav-item-ico">${icon}</span>
          <span class="case-nav-item-label">${esc(n.label)}</span>
          <span class="case-nav-item-count">${count}</span>
          <span class="mi case-nav-item-chevron" onclick="KM.caseNavToggleExpand('${bareKey}',event)">chevron_right</span>
        </div>
        <div class="case-nav-children">
          ${n.children.map(c => {
            const active = this.selected === c.cat;
            const childCount = this._countFor(c.cat);
            return `<div class="case-nav-child${active ? ' is-active' : ''}" onclick="KM.caseNavSelect('${c.cat}')">
                <span class="case-nav-child-label">${esc(c.label)}</span>
                <span class="case-nav-item-count">${childCount}</span>
              </div>`;
          }).join('')}
        </div>
      </div>`;
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
      Search.onInput(kw); // 內部會呼叫 CaseNav.render() 重新計算各節點旁的計數
    }
    // 自動切換到結果較多的「案件方向」Tab
    const counts = {};
    (typeof CaseList !== 'undefined' ? CaseList.countableRows() : []).forEach(c => {
      const dir = c.categoryId.startsWith('im-') ? 'im' : 'ex';
      counts[dir] = (counts[dir] || 0) + 1;
    });
    CaseNav.switchDirection((counts.im || 0) > (counts.ex || 0) ? 'im' : 'ex');
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

  // ── 案例標籤選擇 Modal（新增案例：多選，來源 TAG_OPTIONS）──
  _tagTagsId: 'nc-tag-area',

  openTags(tagsId) {
    this._tagTagsId = tagsId || 'nc-tag-area';
    const existing = new Set([...document.querySelectorAll(`#${this._tagTagsId} .filter-tag`)].map(t => t.dataset.value));
    const list = $('tag-list');
    if (list) {
      list.innerHTML = TAG_OPTIONS.map(t => `
        <div class="law-item${existing.has(t) ? ' is-checked' : ''}" onclick="KM.toggleTagItem(this)">
          <input type="checkbox" ${existing.has(t) ? 'checked' : ''}>
          <label>${esc(t)}</label>
        </div>`).join('');
    }
    this._updateTagCount();
    this.open('modal-tags');
  },

  toggleTagItem(item) {
    const cb = item.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    item.classList.toggle('is-checked', cb.checked);
    this._updateTagCount();
  },

  _updateTagCount() {
    const count = document.querySelectorAll('#tag-list .law-item.is-checked').length;
    const el = $('tag-count');
    if (el) el.textContent = count;
  },

  closeTags() {
    this.close('modal-tags');
  },

  confirmTags() {
    const tagArea = $(this._tagTagsId);
    if (tagArea) {
      const selected = [...document.querySelectorAll('#tag-list .law-item.is-checked')].map(item => item.querySelector('label')?.textContent.trim() || '');
      if (selected.length) {
        tagArea.innerHTML = selected.map((text, i) => {
          const tagId = `case-tag-${this._tagTagsId}-${i}`;
          return `<span class="filter-tag" id="${tagId}" data-value="${esc(text)}">${esc(text)}<button class="filter-tag-remove" onclick="event.stopPropagation();KM.removeFilterTag('${tagId}')"><span class="mi">close</span></button></span>`;
        }).join('');
      } else {
        tagArea.innerHTML = '<span style="color:var(--placeholder);font-size:12.5px;pointer-events:none">點擊選擇案例標籤（可多選）...</span>';
      }
    }
    this.close('modal-tags');
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
      const no   = esc(pill.querySelector('.attach-pill-no')?.textContent.trim() ?? '');
      const desc = esc(pill.querySelector('.attach-pill-desc')?.textContent.trim() ?? '');
      const border = i < pills.length - 1 ? 'border-bottom:1px solid #EEF0F4;' : '';
      return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;${border}">
        <span class="mi" style="color:#2C8086;font-size:22px;flex-shrink:0">picture_as_pdf</span>
        <span style="flex:1;min-width:0">
          <div style="font-size:14px;color:#1E293B;font-weight:600;word-break:break-all">${no}</div>
          <div style="font-size:11.5px;color:#8898AA;margin-top:2px">${desc}</div>
        </span>
        <button class="btn btn--gray-outline" style="padding:8px 14px;font-size:12px;white-space:nowrap" onclick="KM.toast()">↓ 下載</button>
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
      const html = SIDEBAR_ITEMS.filter(item => item.phase1).map(item => {
        const isActive = item.key === activeKey;
        const cls = 'sidebar-item' + (isActive ? ' is-active' : '');
        const iconHtml = item.icon
          ? `<svg width="16" height="16" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="${item.icon}" fill="currentColor"/>
      </svg>`
          : `<span class="mi" style="font-size:16px;color:currentColor;-webkit-text-fill-color:currentColor">${item.mi}</span>`;
        // 一律綁定 onclick（即使目前是 active）：某些畫面（如流程清單／編輯）的 active 項目
        // 會隨著進入來源（處分案例 vs 海關答聯單）動態改變，需要靠 setSidebarActive() 之後仍能正確點擊切換
        return `<div class="${cls}" data-key="${item.key}" onclick="KM.${item.action}()">
      ${iconHtml}
      ${esc(item.label)}
    </div>`;
      }).join('');

      logo.insertAdjacentHTML('afterend', html);
    });
  },

  /** 動態切換某畫面側欄目前 active 的項目（用於同一畫面依進入來源不同而高亮不同主要功能，如流程清單／編輯頁） */
  setSidebarActive(screenId, key) {
    document.querySelectorAll(`#${screenId} .sidebar-item`).forEach(item => {
      item.classList.toggle('is-active', item.dataset.key === key);
    });
  },

  /** 首頁功能卡片：依 Home.cardMode 顯示第一期上線的 4 張或完整 8 張；外框線＋實心箭頭鈕僅為 hover 效果（非固定樣態） */
  homeCards() {
    const el = $('home-grid');
    if (!el) return;
    const cards = Home.cardMode === '8' ? HOME_CARDS : HOME_CARDS.filter(c => c.phase1);
    el.innerHTML = cards.map(c => `<div class="card" onclick="KM.${c.action}()">
        <div class="card-title">${esc(c.title)}</div>
        ${c.sub ? `<div class="card-sub">${esc(c.sub)}</div>` : ''}
        <div class="card-bottom">
          <div class="card-ico">
            ${c.icon ? `<img src="img/${c.icon}" alt="${esc(c.alt)}">` : `<span class="mi">${c.mi}</span>`}
          </div>
          <div class="card-arrow">
            <img class="card-arrow-default" src="img/home/arrow.png" alt="">
            <img class="card-arrow-hover" src="img/home/arrow_h.png" alt="">
          </div>
        </div>
      </div>`).join('');
  },

  /** 首頁通知鈴鐺下拉面板：顯示最新異動（NEWS_ITEMS），標籤顯示所屬模組名稱 */
  news() {
    const el = $('home-notif-list');
    if (!el) return;
    el.innerHTML = NEWS_ITEMS.map(n => `<div class="home-notif-item">
        <div class="home-notif-row">
          <span class="home-notif-tag">${esc(n.tag)}</span>
          <span class="home-notif-date">${esc(n.date)}</span>
        </div>
        <div class="home-notif-title">${esc(n.title)}</div>
        <div class="home-notif-body">${esc(n.body)}</div>
      </div>`).join('');
  },

  /** 首頁公布欄（三欄並排於卡片下方） */
  bulletin() {
    const el = $('bulletin-list');
    if (!el) return;
    el.innerHTML = BULLETIN_ITEMS.map(b => `<div class="news-card">
        <div class="news-row">
          <span class="news-tag${b.tag === '宣導' ? ' news-tag--info' : ''}">${esc(b.tag)}</span>
          <span class="news-date">${esc(b.date)}</span>
        </div>
        <div class="news-title">${esc(b.title)}</div>
        <div class="news-body">${esc(b.body)}</div>
      </div>`).join('');
  },

  /** 處分案例左側樹狀導覽，資料來源 CASE_TREE，實際渲染交給 CaseNav */
  tree() {
    if (typeof CaseNav !== 'undefined') CaseNav.init();
  },

  /** 於 init() 開頭呼叫，產生所有共用內容 */
  all() {
    this.sidebars();
    this.homeCards();
    this.news();
    this.bulletin();
    this.tree();
  },
};

// ─────────────────────────────────────────────────────────
//  Init — DOM 事件綁定
// ─────────────────────────────────────────────────────────
function init() {
  // ── 動態內容渲染（Sidebar、首頁卡片、樹狀清單…）─────
  Render.all();
  Theme.init();

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
//  RelatedPicker — 關聯案例／關聯答聯單 共用選擇彈窗
// ─────────────────────────────────────────────────────────
const RelatedPicker = {
  _targetId: 'nc-related-tags',
  _emptyHint: '點擊選擇關聯案例',

  openFor(targetId, items, opts = {}) {
    this._targetId  = targetId;
    this._emptyHint = opts.emptyHint || '點擊選擇關聯案例';
    const list = $('nc-related-list');
    if (list && items) {
      list.innerHTML = items.map(label => `
        <div class="law-item nc-related-item" onclick="KM.ncToggleRelated(this)">
          <input type="checkbox"><label class="nc-related-label">${esc(label)}</label>
        </div>`).join('');
    }
    const title = $('modal-related-title');
    if (title) title.textContent = opts.title || '選擇關聯案例';
    Modal.open('modal-related');
  },

  toggleItem(item) {
    item.classList.toggle('is-checked');
  },

  confirm() {
    const checked = document.querySelectorAll('#nc-related-list .nc-related-item.is-checked');
    const area = $(this._targetId);
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
      area.innerHTML = `<span style="color:#8898AA;font-size:12px">${esc(this._emptyHint)}</span>`;
    }
    Modal.close('modal-related');
  },
};

// ─────────────────────────────────────────────────────────
//  NewCase — 新增範本案例
// ─────────────────────────────────────────────────────────
const NewCase = {
  _files: [],
  _type: 'ex',

  init() {
    this._files = [];
    this._renderFileList();
    this.switchType('ex');
    const lawArea = $('nc-law-area');
    if (lawArea) lawArea.innerHTML = '<span class="law-ph" style="color:var(--placeholder);font-size:12.5px;pointer-events:none">點擊選擇涉及法規...</span>';
    const tagArea = $('nc-tag-area');
    if (tagArea) tagArea.innerHTML = '<span style="color:var(--placeholder);font-size:12.5px;pointer-events:none">點擊選擇案例標籤（可多選）...</span>';
    const subject = $('nc-subject'); if (subject) subject.value = '';
    const docNo = $('nc-docno'); if (docNo) docNo.value = '';
  },

  /** 出口/進口 切換：重建第二層（產品/商標/CITES/違規）選單 */
  switchType(type) {
    this._type = type;
    ['nc-tab-ex', 'nc-tab-im'].forEach(id => {
      const el = $(id);
      if (el) el.classList.toggle('is-active',   id === `nc-tab-${type}`);
      if (el) el.classList.toggle('is-inactive', id !== `nc-tab-${type}`);
    });
    const l2Sel = $('nc-cat-l2');
    if (!l2Sel) return;
    const opts = caseTreeL2Options(type);
    l2Sel.innerHTML = '<option value="">請選擇第二層樣態</option>' +
      opts.map(o => `<option value="${o.cat}">${esc(o.label)}</option>`).join('');
    this._syncL3();
    this._syncFlowOptions();
  },

  /** 第二層變更時：若為「產品」顯示第三層選單，否則隱藏；同步流程選單 */
  onCatL2Change() {
    this._syncL3();
    this._syncFlowOptions();
  },

  onCatL3Change() {
    this._syncFlowOptions();
  },

  _syncL3() {
    const l2 = $('nc-cat-l2')?.value || '';
    const l3Field = $('nc-cat-l3-field');
    const l3Sel = $('nc-cat-l3');
    const isProduct = l2 === `${this._type}-product`;
    if (l3Field) l3Field.style.display = isProduct ? 'flex' : 'none';
    if (!l3Sel) return;
    if (!isProduct) { l3Sel.innerHTML = ''; return; }
    const node = CASE_TREE[this._type].find(n => n.cat === l2);
    l3Sel.innerHTML = (node?.children || []).map(c => `<option value="${c.cat}">${esc(c.label)}</option>`).join('');
  },

  /** 依目前選定的分類（優先第三層，否則第二層）帶出對應的可選處理流程 */
  _syncFlowOptions() {
    const flowSel = $('nc-flow');
    if (!flowSel) return;
    const l2 = $('nc-cat-l2')?.value || '';
    const l3 = ($('nc-cat-l3-field')?.style.display !== 'none') ? $('nc-cat-l3')?.value : '';
    const catId = l3 || l2;
    const flows = catId ? flowsForCategory(this._type, catId) : [];
    flowSel.innerHTML = flows.length
      ? '<option value="">請選擇處理流程（選填）</option>' + flows.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('')
      : '<option value="">此分類尚無對應處理流程</option>';
  },

  /** 附件上傳 */
  handleFiles(input) {
    [...(input.files || [])].forEach(f => {
      f.note = '';
      this._files.push(f);
    });
    input.value = '';
    this._renderFileList();
  },

  removeFile(idx) {
    this._files.splice(idx, 1);
    this._renderFileList();
  },

  updateNote(idx, val) {
    if (this._files[idx]) this._files[idx].note = val;
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
        <div class="nc-file-main">
          <span class="nc-file-name">${esc(f.name)}</span>
          <input type="text" class="nc-file-note" placeholder="輸入備註（選填）" value="${esc(f.note || '')}" oninput="KM.ncUpdateNote(${i},this.value)">
        </div>
        <span class="nc-file-size">${(f.size / 1024).toFixed(0)} KB</span>
        <button class="nc-file-remove" onclick="KM.ncRemoveFile(${i})"><span class="mi">close</span></button>
      </div>`).join('');
  },

  /** 關聯案例 Modal */
  openRelated() {
    RelatedPicker.openFor('nc-related-tags', [
      '貿管理字第114704321號 · OOO食品公司（從輕）',
      '貿管理字第114703105號 · ABC科技（從輕）',
      '貿管理字第114706788號 · XYZ農業（從重）',
      '貿管理字第114705412號 · 全康醫療（從輕）',
      '貿管理字第114701834號 · 美洲服飾（從重）',
    ], { title: '選擇關聯案例', emptyHint: '點擊選擇關聯案例' });
  },

  /** 儲存 / 送出：必填發文字號、案件日期；分類（第二層，產品需再選第三層）亦為必填 */
  save(publish) {
    const docNo = $('nc-docno')?.value.trim();
    const caseDate = $('nc-case-date')?.value.trim();
    const l2 = $('nc-cat-l2')?.value;
    const isProduct = l2 === `${this._type}-product`;
    const l3 = isProduct ? $('nc-cat-l3')?.value : '';

    if (!docNo) { Toast.show('請輸入發文字號'); return; }
    if (!caseDate) { Toast.show('請選擇案件日期'); return; }
    if (!l2) { Toast.show('請選擇第二層樣態'); return; }
    if (isProduct && !l3) { Toast.show('請選擇第三層樣態'); return; }

    const tags = [...document.querySelectorAll('#nc-tag-area .filter-tag')].map(t => t.dataset.value || t.textContent.replace('×', '').trim());
    const flowId = $('nc-flow')?.value || null;

    // 送出＝進入待審核（status:'pending'），核准前不會出現在案例清單，只出現在「待審」頁面；
    // 儲存草稿＝status:'draft'，兩者皆不計入 CaseList._publishedRows()
    CASES_DATA.unshift({
      id: 'case-' + Date.now(),
      docNo, date: caseDate, updateDate: nowDateStr().replace(/\//g, '.'),
      target: '', law: '', goods: '', tags,
      categoryId: l3 || l2, flowId,
      subject: $('nc-subject')?.value.trim() || '',
      summary: $('nc-subject')?.value.trim() || '',
      attachments: this._files.map(f => ({ no: docNo, desc: f.name })),
      status: publish ? 'pending' : 'draft',
      submitter: CURRENT_USER, submitDate: nowDateStr(), signoffs: [],
    });

    Toast.show(publish ? '案例已送出，等待審核' : '草稿已儲存');
    Nav.goApp();
  },
};

// ─────────────────────────────────────────────────────────
//  CustomsNewCase — 新增答聯單範本/案例
// ─────────────────────────────────────────────────────────
const CustomsNewCase = {
  _files: [],

  init() {
    this._files = [];
    this._renderFileList();
  },

  /** 附件上傳 */
  handleFiles(input) {
    [...(input.files || [])].forEach(f => {
      f.note = '';
      this._files.push(f);
    });
    input.value = '';
    this._renderFileList();
  },

  removeFile(idx) {
    this._files.splice(idx, 1);
    this._renderFileList();
  },

  updateNote(idx, val) {
    if (this._files[idx]) this._files[idx].note = val;
  },

  _renderFileList() {
    const list = $('cnc-file-list');
    if (!list) return;
    if (this._files.length === 0) {
      list.innerHTML = '<span style="color:#8898AA;font-size:12px">尚未選擇任何附件</span>';
      return;
    }
    list.innerHTML = this._files.map((f, i) => `
      <div class="nc-file-item">
        <span class="mi" style="color:#2457A7;font-size:18px">attach_file</span>
        <div class="nc-file-main">
          <span class="nc-file-name">${esc(f.name)}</span>
          <input type="text" class="nc-file-note" placeholder="輸入備註（選填）" value="${esc(f.note || '')}" oninput="KM.cncUpdateNote(${i},this.value)">
        </div>
        <span class="nc-file-size">${(f.size / 1024).toFixed(0)} KB</span>
        <button class="nc-file-remove" onclick="KM.cncRemoveFile(${i})"><span class="mi">close</span></button>
      </div>`).join('');
  },

  /** 關聯答聯單 Modal */
  openRelated() {
    RelatedPicker.openFor('cnc-related-tags', [
      'ATEG1140027 · 基隆關桃園分關南崁業務課（實質轉型）',
      'ATEG1140153 · 臺北關機場分關（產地標示）',
      'ATEG1140268 · 高雄關五堵分關（CITES）',
      'ATEG1140311 · 臺中關清水分關（其他）',
    ], { title: '選擇關聯答聯單', emptyHint: '點擊選擇關聯答聯單' });
  },

  /** 儲存 / 送出 */
  save(publish) {
    const title = $('cnc-category')?.value;
    if (!title) { Toast.show('請先選擇答聯單態樣'); return; }
    Toast.show(publish ? '案例已發布！' : '草稿已儲存');
    Nav.goCustoms();
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

    // 過濾卡片（與處分案例相同邏輯）
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

// ── 步驟切換（海關答聯單詳細頁，唯讀檢視）：依目前實際存在的 .step-item／.step-content 計算 ──
const StepView = {
  switch(n) {
    document.querySelectorAll('#app-customs-detail .step-item').forEach(item => {
      const i = Number(item.id.replace('step-btn-', ''));
      item.classList.toggle('is-active', i === n);
    });
    document.querySelectorAll('#app-customs-detail .step-content').forEach(c => {
      const i = Number(c.id.replace('step-c-', ''));
      c.style.display = i === n ? '' : 'none';
    });
  },
};


window.KM = {
  // Theme
  setTheme        : id => Theme.set(id),
  themeToggleMenu : btn => Theme.toggleMenu(btn),

  // Home（全文檢索）
  homeSearchInput : v  => Home.onSearchInput(v),
  homeSearchClear : () => Home.clearSearch(),
  homeSearchSubmit: adv => Home.submitSearch(adv),
  toggleHomeNotif : () => Home.toggleNotif(),
  setHomeCardMode : mode => Home.setCardMode(mode),

  // Nav
  goApp         : () => Nav.goApp(),
  goHome        : () => Nav.goHome(),
  goPendingReview: () => Nav.goPendingReview(),
  pendingChangePageSize: (group, size) => PendingReview.changePageSize(group, size),
  pendingToggleSignoff: id => PendingReview.toggleSignoff(id),
  logout        : () => Toast.show('已登出系統'),
  goCustoms      : () => Nav.goCustoms(),
  goCustomsDetail: () => Nav.goCustomsDetail(),
  openCustomsDetail : el => Nav.openCustomsDetail(el),
  backToCustomsList : () => Nav.backToCustomsList(),
  goCaseDetail   : () => Nav.goCaseDetail(),
  openCaseDetail : el => Nav.openCaseDetail(el),
  backToCaseList : () => Nav.backToCaseList(),
  goCaseReview  : el => Nav.goCaseReview(el.closest('.pending-row')?.dataset.caseId),
  toggleCaseInfo: () => CaseDetail.toggleCaseInfo(),
  caseReviewCommentInput: val => CaseReview.setComment(val),
  caseReviewApprove: () => CaseReview.approve(),
  caseReviewReject : () => CaseReview.reject(),
  openRelatedCustomsFromCase: cardEl => Nav.openRelatedCustomsFromCase(cardEl),
  openRelatedCaseFromCustoms: cardEl => Nav.openRelatedCaseFromCustoms(cardEl),
  goNewCase      : s  => Nav.goNewCase(s),
  ncSwitchType   : t  => NewCase.switchType(t),
  ncCatL2Change  : () => NewCase.onCatL2Change(),
  ncCatL3Change  : () => NewCase.onCatL3Change(),
  ncHandleFiles  : el => NewCase.handleFiles(el),
  ncRemoveFile   : i  => NewCase.removeFile(i),
  ncUpdateNote   : (i, v) => NewCase.updateNote(i, v),
  ncOpenRelated  : () => NewCase.openRelated(),
  ncConfirmRelated:() => RelatedPicker.confirm(),
  ncToggleRelated: el => RelatedPicker.toggleItem(el),
  ncSave         : p  => NewCase.save(p),
  cncHandleFiles : el => CustomsNewCase.handleFiles(el),
  cncRemoveFile  : i  => CustomsNewCase.removeFile(i),
  cncUpdateNote  : (i, v) => CustomsNewCase.updateNote(i, v),
  cncOpenRelated : () => CustomsNewCase.openRelated(),
  cncSave        : p  => CustomsNewCase.save(p),
  goFlowList     : s  => Nav.goFlowList(s),
  goFlowEdit     : (flowId, version) => Nav.goFlowEdit(flowId, version),
  goFlowView     : (flowId, version) => Nav.goFlowView(flowId, version),
  goFlowReviewView: (fromPending, el, flowId, version) => Nav.goFlowReviewView(fromPending, el, flowId, version),

  // Search
  onSearch   : v  => Search.onInput(v),
  clearSearch: () => Search.clear(),

  // Case list（表格：排序／分頁／展開列）
  caseSortBy        : key  => CaseList.sortBy(key),
  caseSortFieldChange: key => CaseList.setSortField(key),
  caseTagFilterChange: tag => CaseList.setTagFilter(tag),
  caseChangePageSize: size => CaseList.changePageSize(size),
  caseToggleRow     : rowEl => CaseList.toggleRow(rowEl),
  caseGoFlow        : () => CaseDetail.goFlow(),

  // Customs Search
  customsSearch: v  => CustomsSearch.onInput(v),
  customsClear : () => CustomsSearch.clear(),

  // Step switching
  switchStep: n => StepView.switch(n),

  // Flow edit
  flowAddStep   : ()     => FlowEdit.addStep(),
  flowSelectStep: card   => FlowEdit.selectStep(card),
  flowUpdateTitle: val   => FlowEdit.updateTitle(val),
  flowUpdateBody  : html => FlowEdit.updateBody(html),
  flowCasesCommit : status => FlowList.commitCasesEdit(status),
  flowToggleExpand: flowId => FlowList.toggleExpand(flowId),
  flowSortFieldChange: dir => FlowList.setSortDir(dir),
  flowAddDoc        : () => FlowEdit.addDoc(),
  flowRemoveDoc     : i  => FlowEdit.removeDoc(i),
  flowDocUpdate     : (i, field, val) => FlowEdit.updateDocField(i, field, val),
  flowDocTypeChange : (i, val) => FlowEdit.changeDocType(i, val),
  flowHandleFiles   : el => FlowEdit.handleFiles(el),
  flowRemoveFile    : i  => FlowEdit.removeFile(i),
  flowUpdateFileNote: (i, val) => FlowEdit.updateFileNote(i, val),
  flowSave      : ()     => FlowList.save(),
  flowPublish   : ()     => FlowList.publish(),
  flowToggleEnabled: id  => FlowList.toggleEnabled(id),
  flowApprove   : ()     => FlowList.approve(),
  flowReject    : ()     => FlowList.reject(),
  flowCopy      : ()     => FlowList.copy(),
  flowView      : ()     => FlowList.view(),
  flowSelectRow : el     => FlowList.selectRow(el),
  flowVoid      : ()     => FlowList.voidCurrent(),
  flowCatL1Change     : () => FlowEdit.onCatL1Change(),
  flowCatL2Change     : () => FlowEdit.onCatL2Change(),
  flowCatL3Change     : () => FlowEdit.onCatL3Change(),
  flowCopyFromChange  : val => FlowEdit.onCopyFromChange(val),

  // 處分案例左側樹狀導覽（單選：出口/進口 → 分類 → 產品子項）
  caseNavSwitchDirection: dir => CaseNav.switchDirection(dir),
  caseNavSelect         : catId => CaseNav.select(catId),
  caseNavToggleExpand   : (bareKey, ev) => CaseNav.toggleExpand(bareKey, ev),

  // 處理流程總覽左側導覽（出口/進口 → 四大類別 → 個別流程）
  flowNavSwitchDirection: dir => FlowNav.switchDirection(dir),
  flowNavSelect         : catId => FlowNav.select(catId),
  flowNavToggleExpand   : (bareKey, ev) => FlowNav.toggleExpand(bareKey, ev),
  selectCustomsTree: (el, t) => Nav.selectCustomsTree(el, t),

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
  openTagModal      : tagsId => Modal.openTags(tagsId),
  closeTagModal     : () => Modal.closeTags(),
  toggleTagItem     : el  => Modal.toggleTagItem(el),
  confirmTags       : () => Modal.confirmTags(),

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
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
