/**
 * data.js
 * 國貿署 KM 系統 — 共用內容資料
 *
 * 將原本散落在 index.html 各畫面中的重複內容（尤其是 7 處重複的
 * Sidebar 選單）抽成資料陣列，由 main.js 的 Render 模組統一產生。
 * 新增/修改選單、首頁卡片、最新異動、常用連結、處分案樣態清單時，
 * 只需修改本檔案的資料，不需再逐一修改 HTML。
 */

'use strict';

// ─────────────────────────────────────────────────────────
//  Sidebar 選單（8 項，比照首頁卡片順序，於 7 個畫面重複使用；phase1 對應
//  首頁卡片同一批第一期上線項目，Render.sidebars() 只會顯示 phase1:true 的 4 項）
// ─────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  {
    key   : 'apply',
    label : '申請專案輸入',
    action: 'toast',
    mi    : 'post_add',
    phase1: false,
  },
  {
    key   : 'cases',
    label : '處分案例',
    action: 'goApp',
    icon  : 'M20 15.625C16.55 15.625 13.75 18.425 13.75 21.875C13.75 25.325 16.55 28.125 20 28.125C23.45 28.125 26.25 25.325 26.25 21.875C26.25 18.425 23.45 15.625 20 15.625ZM22.0625 24.8125L19.375 22.125V18.125H20.625V21.6125L22.9375 23.925L22.0625 24.8125ZM21.25 4.375H17.275C16.75 2.925 15.375 1.875 13.75 1.875C12.125 1.875 10.75 2.925 10.225 4.375H6.25C4.875 4.375 3.75 5.5 3.75 6.875V25.625C3.75 27 4.875 28.125 6.25 28.125H13.8875C13.15 27.4125 12.55 26.5625 12.1125 25.625H6.25V6.875H8.75V10.625H18.75V6.875H21.25V13.225C22.1375 13.35 22.975 13.6125 23.75 13.975V6.875C23.75 5.5 22.625 4.375 21.25 4.375ZM13.75 6.875C13.0625 6.875 12.5 6.3125 12.5 5.625C12.5 4.9375 13.0625 4.375 13.75 4.375C14.4375 4.375 15 4.9375 15 5.625C15 6.3125 14.4375 6.875 13.75 6.875Z',
    phase1: true,
  },
  {
    key   : 'customs',
    label : '海關答聯單處理',
    action: 'goCustoms',
    icon  : 'M21.25 18.75L23.1875 20.6875C21.9875 22.8 19.025 24.4875 16.25 24.9V13.75H20V11.25H16.25V9.775C17.7 9.25 18.75 7.875 18.75 6.25C18.75 4.1875 17.0625 2.5 15 2.5C12.9375 2.5 11.25 4.1875 11.25 6.25C11.25 7.875 12.3 9.25 13.75 9.775V11.25H10V13.75H13.75V24.9C10.975 24.4875 8.0125 22.8 6.8125 20.6875L8.75 18.75L3.75 15V18.75C3.75 23.6 9.9 27.5 15 27.5C20.1 27.5 26.25 23.6 26.25 18.75V15L21.25 18.75ZM15 5C15.6875 5 16.25 5.5625 16.25 6.25C16.25 6.9375 15.6875 7.5 15 7.5C14.3125 7.5 13.75 6.9375 13.75 6.25C13.75 5.5625 14.3125 5 15 5Z',
    phase1: true,
  },
  {
    key   : 'regulation',
    label : '貿易法規重要函文／函釋',
    action: 'toast',
    mi    : 'balance',
    phase1: false,
  },
  {
    key   : 'appeal',
    label : '聲明異議、訴願、行政訴訟案例查詢',
    action: 'toast',
    icon  : 'M11.2508 16.875C14.0133 16.875 16.2508 14.6375 16.2508 11.875C16.2508 9.1125 14.0133 6.875 11.2508 6.875C8.48828 6.875 6.25078 9.1125 6.25078 11.875C6.25078 14.6375 8.48828 16.875 11.2508 16.875ZM11.2508 9.375C12.6258 9.375 13.7508 10.5 13.7508 11.875C13.7508 13.25 12.6258 14.375 11.2508 14.375C9.87578 14.375 8.75078 13.25 8.75078 11.875C8.75078 10.5 9.87578 9.375 11.2508 9.375ZM11.2508 19.375C7.91328 19.375 1.25078 21.05 1.25078 24.375V26.875H21.2508V24.375C21.2508 21.05 14.5883 19.375 11.2508 19.375ZM3.75078 24.375C4.02578 23.475 7.88828 21.875 11.2508 21.875C14.6258 21.875 18.5008 23.4875 18.7508 24.375H3.75078ZM18.8508 9.4375C19.9008 10.9125 19.9008 12.825 18.8508 14.3L20.9508 16.4125C23.4758 13.8875 23.4758 10.075 20.9508 7.325L18.8508 9.4375ZM25.0883 3.125L23.0508 5.1625C26.5133 8.9375 26.5133 14.6125 23.0508 18.5875L25.0883 20.625C29.9633 15.7625 29.9758 8.1875 25.0883 3.125Z',
    phase1: true,
  },
  {
    key   : 'mailbox',
    label : '民眾意見信箱處理',
    action: 'toast',
    mi    : 'mail',
    phase1: false,
  },
  {
    key   : 'legal',
    label : '立法/監察院相關',
    action: 'toast',
    icon  : 'M16.25 10.4125C17.3125 10.0375 18.1625 9.1875 18.5375 8.125H22.5L18.75 16.875C18.75 18.95 20.7125 20.625 23.125 20.625C25.5375 20.625 27.5 18.95 27.5 16.875L23.75 8.125H26.25V5.625H18.5375C18.025 4.1625 16.6375 3.125 15 3.125C13.3625 3.125 11.975 4.1625 11.4625 5.625H3.75V8.125H6.25L2.5 16.875C2.5 18.95 4.4625 20.625 6.875 20.625C9.2875 20.625 11.25 18.95 11.25 16.875L7.5 8.125H11.4625C11.8375 9.1875 12.6875 10.0375 13.75 10.4125V24.375H2.5V26.875H27.5V24.375H16.25V10.4125ZM25.4625 16.875H20.7875L23.125 11.425L25.4625 16.875ZM9.2125 16.875H4.5375L6.875 11.425L9.2125 16.875ZM15 8.125C14.3125 8.125 13.75 7.5625 13.75 6.875C13.75 6.1875 14.3125 5.625 15 5.625C15.6875 5.625 16.25 6.1875 16.25 6.875C16.25 7.5625 15.6875 8.125 15 8.125Z',
    phase1: true,
  },
  {
    key   : 'history',
    label : '重要大事記',
    action: 'toast',
    mi    : 'star',
    phase1: false,
  },
];

// ─────────────────────────────────────────────────────────
//  首頁卡片（home-grid；目前只上線 phase1:true 這 4 張，2 欄併排顯示）
// ─────────────────────────────────────────────────────────
const HOME_CARDS = [
  { mi: 'post_add',               alt: '申請專案輸入',           title: '申請專案輸入',             sub: '新增／查詢專案輸入申請案件',     featured: false, action: 'toast',   phase1: false },
  { icon: 'pending_actions.svg',  alt: '處分案例',               title: '處分案例',                 sub: '違規產地標示不實',               featured: true,  action: 'goApp',    phase1: true  },
  { icon: 'anchor.svg',           alt: '海關答聯單',             title: '海關答聯單',               sub: '通關疑義公文與白聯單查詢',       featured: false, action: 'goCustoms',phase1: true  },
  { icon: 'balance.svg',          alt: '貿易法規重要函文/函釋',   title: '貿易法規重要函文／函釋',   sub: '重要法規函釋彙整查詢',           featured: false, action: 'toast',   phase1: false },
  { icon: 'record_voice_over.svg',alt: '聲明異議',               title: '聲明異議／訴願／行政訴訟', sub: '行政救濟案件查詢',               featured: false, action: 'toast',   phase1: true  },
  { mi: 'mail',                   alt: '民眾意見信箱處理',       title: '民眾意見信箱處理',         sub: '民眾陳情及意見回覆紀錄',         featured: false, action: 'toast',   phase1: false },
  { mi: 'question_answer',        alt: '立法院質詢書面及回應',   title: '立法院質詢書面及回應',     sub: '書面質詢與回應彙整',             featured: false, action: 'toast',   phase1: true  },
  { mi: 'star',                   alt: '重要大事記',             title: '重要大事記',               sub: '重大政策與事件時間軸',           featured: false, action: 'toast',   phase1: false },
];

// ─────────────────────────────────────────────────────────
//  最新異動（首頁右欄，3 筆）
//  tag 欄位顯示該則異動所屬的模組名稱（取代原本的「文件異動／系統通知」分類標籤）
// ─────────────────────────────────────────────────────────
const NEWS_ITEMS = [
  { tag: '處分案例', date: '2026/06/25', title: '「進出口作業流程」被標記為過時',                               body: '預計將於下週由管理員更新為 v3.2 版本。' },
  { tag: '海關答聯單', date: '2026/01/20', title: '修正「瀕臨絕種動植物之物種」附表三，並自即日生效。',           body: '請各單位依循新版指南進行預算申報作業。' },
  { tag: '系統', date: '2025/11/10', title: '修正「限制輸出貨品表」，我國產製之158項鋼鐵貨品輸往歐盟…',     body: '請各單位依循新版指南進行預算申報作業。' },
];

// ─────────────────────────────────────────────────────────
//  公布欄（首頁右欄，取代原本的常用連結；卡片樣式比照最新異動）
// ─────────────────────────────────────────────────────────
const BULLETIN_ITEMS = [
  { tag: '公告', date: '2026/06/20', title: '114年度貿易法規教育訓練開放報名',       body: '請各單位業務同仁踴躍參加，報名截止日為7月10日。' },
  { tag: '公告', date: '2026/05/15', title: '「原產地認定標準」修正草案預告',         body: '修正重點為簡易加工之實質轉型認定基準，歡迎提供意見。' },
  { tag: '宣導', date: '2026/04/02', title: '海關稅則查詢系統維護通知',               body: '系統將於本週六凌晨進行例行維護，屆時將暫停服務2小時。' },
];

// ─────────────────────────────────────────────────────────
//  處分案樣態三層分類樹（出口 / 進口）
//  第一層：出口／進口（ex / im，見 CASE_TREE 的 key）
//  第二層：產品／商標／CITES／違規
//  第三層：僅「產品」底下有子項
// ─────────────────────────────────────────────────────────
const CASE_TREE = {
  ex: [
    {
      cat: 'ex-product', label: '產品', active: true,
      children: [
        { cat: 'ex-product-1', label: '產地標示不實' },
        { cat: 'ex-product-2', label: '誤認產地' },
        { cat: 'ex-product-3', label: '國貨標示他國' },
        { cat: 'ex-product-4', label: '他國產地標示台灣' },
      ],
    },
    { cat: 'ex-trademark', label: '商標' },
    { cat: 'ex-cites',     label: 'CITES' },
    { cat: 'ex-violation', label: '違規' },
  ],
  im: [
    {
      cat: 'im-product', label: '產品', active: true,
      children: [
        { cat: 'im-product-1', label: '產地標示不實' },
        { cat: 'im-product-2', label: '誤認產地' },
        { cat: 'im-product-3', label: '國貨標示他國' },
        { cat: 'im-product-4', label: '他國產地標示台灣' },
      ],
    },
    { cat: 'im-trademark', label: '商標' },
    { cat: 'im-cites',     label: 'CITES' },
    { cat: 'im-violation', label: '違規' },
  ],
};

/** 依 categoryId（可能是第二層或第三層）找出可讀的完整分類路徑，如「出口 > 產品 > 產地標示不實」 */
function caseTreePath(categoryId) {
  if (!categoryId) return '';
  const l1 = categoryId.startsWith('ex-') ? 'ex' : 'im';
  const l1Label = l1 === 'ex' ? '出口' : '進口';
  for (const node of CASE_TREE[l1]) {
    if (node.cat === categoryId) return `${l1Label} > ${node.label}`;
    const child = node.children?.find(c => c.cat === categoryId);
    if (child) return `${l1Label} > ${node.label} > ${child.label}`;
  }
  return l1Label;
}

/** 依 L1（ex/im）取出第二層清單（{cat,label}，不含「產品」的第三層子項），供分類下拉選單使用 */
function caseTreeL2Options(l1) {
  return (CASE_TREE[l1] || []).map(n => ({ cat: n.cat, label: n.label }));
}

// ─────────────────────────────────────────────────────────
//  處分案例「處理流程」資料模型
//  每個流程可有多個版本（versions），僅一個版本狀態為 active（清單/新增案例
//  可選用的現行版本），其餘為 draft／pending／archived／void。
//  每個版本各自有一份 steps（步驟內容）與 signoffs（簽核紀錄）。
// ─────────────────────────────────────────────────────────
const FLOW_STEPS_GENERAL = [
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

const FLOW_STEPS_SPECIAL = [
  { title: '受理商標權人檢舉', body: `<p>受理商標權人或代理人檢舉，確認檢舉文件（商標權證明、侵權事證）齊備。</p>` },
  { title: '會商智慧局認定', body: `<p>就仿冒／侵權事實函請智慧財產局提供鑑定意見，作為裁處依據。</p>` },
  { title: '裁處與結案', body: `<p>依鑑定結果研擬裁處意見，送核後製發處分書並歸檔。</p>` },
];

const FLOW_STEPS_SHOES = [
  { title: '受理海關通報', body: `<p>受理海關就鞋類貨品產地標示疑義之通報，確認報單與檢附文件。</p>` },
  { title: '產地實質轉型審查', body: `<p>就鞋面裁剪、大底成型、組裝等製程比對實質轉型標準，判斷是否達門檻。</p>` },
  { title: '通知廠商說明', body: `<p>發函通知廠商於期限內提出說明及佐證文件。</p>` },
  { title: '裁處與結案', body: `<p>綜合審查結果研擬裁處意見，送核後製發處分書並歸檔。</p>` },
];

const FLOWS_DATA = [
  {
    id: 'flow-1', name: '一般處理流程', enabled: true,
    category: { l1: 'ex', l2: 'ex-product-1' },
    versions: [
      {
        version: 'v2.0', status: 'active', date: '2026/07/02', submitter: '王大明',
        steps: FLOW_STEPS_GENERAL,
        signoffs: [
          { seq: 1, signer: '王大明', comment: '流程內容完整，同意發布。', time: '2026/06/20 10:12' },
        ],
      },
      {
        version: 'v1.0', status: 'archived', date: '2025/03/10', submitter: '王大明',
        steps: FLOW_STEPS_GENERAL.slice(0, 5),
        signoffs: [
          { seq: 1, signer: '李組長', comment: '同意發布。', time: '2025/03/09 15:40' },
        ],
      },
    ],
  },
  {
    id: 'flow-2', name: '特殊處理流程', enabled: false,
    category: { l1: 'ex', l2: 'ex-trademark' },
    versions: [
      {
        version: 'v2.0', status: 'active', date: '2025/12/03', submitter: '陳小華',
        steps: FLOW_STEPS_SPECIAL,
        signoffs: [
          { seq: 1, signer: '李組長', comment: '同意發布。', time: '2025/12/02 09:30' },
        ],
      },
      {
        version: 'v1.0', status: 'archived', date: '2025/06/18', submitter: '陳小華',
        steps: FLOW_STEPS_SPECIAL.slice(0, 2),
        signoffs: [],
      },
    ],
  },
  {
    id: 'flow-3', name: '特殊處理流程', enabled: false,
    category: { l1: 'ex', l2: 'ex-product-1' },
    versions: [
      {
        version: 'v1.0', status: 'active', date: '2025/12/03', submitter: '陳小華',
        steps: FLOW_STEPS_SHOES,
        signoffs: [],
      },
    ],
  },
];

/** 補齊 CASE_TREE 每個節點都有「一般」與「特殊」兩個流程；節點結構跟樹狀導覽一致——
 *  「產品」底下有 4 個第三層子項（各自一般＋特殊，共 8 筆），「商標／CITES／違規」沒有
 *  第三層，直接在第二層掛一般＋特殊兩筆。上面已手刻的 3 筆（含多版本歷史，供展開舊版本
 *  示範用）保留不動，這裡只補上缺的組合，內容沿用共用的步驟範本（僅為原型示意）。 */
(function fillFlowMatrix() {
  let seq = FLOWS_DATA.length + 1;
  ['ex', 'im'].forEach(l1 => {
    CASE_TREE[l1].forEach(node => {
      const targets = node.children ? node.children.map(c => c.cat) : [node.cat];
      targets.forEach(l2 => {
        [
          { name: '一般處理流程', steps: FLOW_STEPS_GENERAL },
          { name: '特殊處理流程', steps: FLOW_STEPS_SPECIAL },
        ].forEach(({ name, steps }) => {
          const exists = FLOWS_DATA.some(f => f.category.l1 === l1 && f.category.l2 === l2 && f.name === name);
          if (exists) return;
          FLOWS_DATA.push({
            id: `flow-${seq++}`, name, enabled: true,
            category: { l1, l2 },
            versions: [
              { version: 'v1.0', status: 'active', date: '2026/01/15', submitter: '王大明', steps, signoffs: [] },
            ],
          });
        });
      });
    });
  });
})();

/** 依 id 取得流程 */
function flowById(id) {
  return FLOWS_DATA.find(f => f.id === id) || null;
}

/** 取得流程的現行（active）版本；若無則回傳第一個版本 */
function flowActiveVersion(flow) {
  if (!flow) return null;
  return flow.versions.find(v => v.status === 'active') || flow.versions[0] || null;
}

/** 依版本字串找出該流程的特定版本（找不到則回傳現行版本） */
function flowVersion(flow, versionStr) {
  if (!flow) return null;
  return flow.versions.find(v => v.version === versionStr) || flowActiveVersion(flow);
}

/** 取得某流程所有版本中最大版號的下一版（v2.0 → v2.1），供「複製目前版本為新版本」使用 */
function flowNextVersionFor(flow) {
  let maxMajor = 1, maxMinor = 0;
  (flow?.versions || []).forEach(v => {
    const m = /^v(\d+)\.(\d+)$/.exec(v.version || '');
    if (!m) return;
    const major = Number(m[1]), minor = Number(m[2]);
    if (major > maxMajor || (major === maxMajor && minor > maxMinor)) { maxMajor = major; maxMinor = minor; }
  });
  return `v${maxMajor}.${maxMinor + 1}`;
}

/** 依所選分類（categoryId，即案例分類樹最深一層——「產品」為 L3，其餘為 L2）找出可用的流程清單。
 *  流程資料現在也是掛在同一個最深層級上（如 ex-product-1），故直接比對 l1+l2 即可，不需再截斷。 */
function flowsForCategory(l1, categoryId) {
  if (!categoryId) return [];
  return FLOWS_DATA.filter(f => f.category.l1 === l1 && f.category.l2 === categoryId && f.enabled);
}

// ─────────────────────────────────────────────────────────
//  案例標籤（新增案例的多選標籤清單）
// ─────────────────────────────────────────────────────────
const TAG_OPTIONS = ['從輕', '輸美', '加重', '減輕', '初次違規'];

// ─────────────────────────────────────────────────────────
//  處分案例清單資料（取代原本寫死於 index.html 的 12 張 .case-card）
//  欄位：docNo/date/target/law/tags/goods/updateDate（清單顯示 7 欄）
//        + categoryId（三層分類）、flowId（對應處理流程，無對應流程時為 null）
//        + summary/body（案例完整詳情頁沿用的長文內容）、attachments、relatedLabel
// ─────────────────────────────────────────────────────────
const CASES_DATA = [
  {
    id: 'case-1', docNo: '貿管理字第114704321號', date: '中華民國114年11月25日', updateDate: '114.11.25',
    target: 'OOO食品公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '食品', tags: ['從輕', '初次違規'], penalty: '處以罰緩 12 萬',
    categoryId: 'ex-product-1', flowId: 'flow-1',
    summary: '貴公司（統一編號：__________，代表人：________）報運出口高頻治具線等貨品1批至泰國，產地標示不實，違反貿易法第17條第2款規定，依同法第28條第1項第6款規定處以新臺幣（下同）12萬元罰鍰，請查照。',
    attachments: [{ no: '貿管理字第114704321號-1', desc: 'OOO聲明書' }, { no: '貿管理字第114704321號-2', desc: 'OOOOO調查資料' }],
    relatedLabel: 'OOO關聯答聯單',
  },
  {
    id: 'case-2', docNo: '貿管理字第114704108號', date: '中華民國114年11月20日', updateDate: '114.11.20',
    target: 'OOO紡織公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '紡織品', tags: ['輸美'], penalty: '處以罰緩 8 萬',
    categoryId: 'ex-product-1', flowId: 'flow-1',
    summary: '貴公司（統一編號：__________，代表人：________）報運出口紡織品1批至越南，未依規定標示產地，違反貿易法第17條第2款規定，依同法第28條第1項第6款規定處以新臺幣（下同）8萬元罰鍰，請查照。',
    attachments: [{ no: '貿管理字第114704108號-1', desc: 'OOO聲明書' }],
  },
  {
    id: 'case-3', docNo: '貿管理字第114704095號', date: '中華民國114年11月18日', updateDate: '114.11.18',
    target: 'OOO五金公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '五金零件', tags: ['減輕'], penalty: '處以罰緩 6 萬',
    categoryId: 'ex-product-1', flowId: 'flow-1',
    summary: '貴公司（統一編號：__________，代表人：________）報運出口五金零件1批至印尼，未依規定標示產地，違反貿易法第17條第2款規定，依同法第28條第1項第6款規定處以新臺幣（下同）6萬元罰鍰，請查照。',
    attachments: [{ no: '貿管理字第114704095號-1', desc: 'OOO聲明書' }],
  },
  {
    id: 'case-4', docNo: '貿管理字第114704072號', date: '中華民國114年11月12日', updateDate: '114.11.12',
    target: 'OOO玩具公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '玩具', tags: [], penalty: '處以罰緩 15 萬',
    categoryId: 'ex-product-1', flowId: 'flow-1',
    summary: '貴公司（統一編號：__________，代表人：________）報運出口玩具1批至菲律賓，未依規定標示產地且經查獲有再犯情形，違反貿易法第17條第2款規定，依同法第28條第1項第6款規定處以新臺幣（下同）15萬元罰鍰，請查照。',
    attachments: [{ no: '貿管理字第114704072號-1', desc: 'OOO聲明書' }],
  },
  {
    id: 'case-5', docNo: '貿管理字第114704051號', date: '中華民國114年11月08日', updateDate: '114.11.08',
    target: 'OOO電器公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '家用電器', tags: ['從輕'], penalty: '處以罰緩 5 萬',
    categoryId: 'ex-product-1', flowId: 'flow-1',
    summary: '貴公司（統一編號：__________，代表人：________）報運出口家用電器1批至馬來西亞，未依規定標示產地，違反貿易法第17條第2款規定，依同法第28條第1項第6款規定處以新臺幣（下同）5萬元罰鍰，請查照。',
    attachments: [{ no: '貿管理字第114704051號-1', desc: 'OOO聲明書' }],
  },
  {
    id: 'case-6', docNo: '貿管理字第114704321號', date: '中華民國114年11月25日', updateDate: '114.11.25',
    target: 'OOO食品公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '食品', tags: ['輸美'], penalty: '依項次3，各裁處60萬',
    categoryId: 'ex-product-4', flowId: 'flow-1',
    summary: '輸美貨品2批第1批貨品本身均車縫 Made in Taiwan 標籤，內包裝及外箱亦有 Made in Taiwan 字樣，但未達實質轉型第2批貨品之外箱標示 MADE IN TAIWAN，惟比對進口資料，貴公司自承貨品實為 MADE IN CHINA貨品本身、內包裝、外箱標示不實，有檢附輸美國貨品原產地聲明書。',
    attachments: [{ no: '貿管理字第114704321號-1', desc: 'OOO聲明書' }, { no: '貿管理字第114704321號-2', desc: 'OOOOO調查資料' }],
    relatedLabel: 'OOO關聯答聯單',
  },
  {
    id: 'case-7', docNo: '貿管理字第114703105號', date: '中華民國114年09月12日', updateDate: '114.09.12',
    target: 'ABC科技股份有限公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '電子產品（印刷電路板）', tags: ['從輕'], penalty: '處以罰緩 3 萬',
    categoryId: 'im-product-1', flowId: null,
    summary: '貴公司報運進口印刷電路板1批，申報產地為越南，惟查驗結果產地標示不實，實際製造地為中國大陸，違反產地標示規定，依貿易法第28條第1項第6款規定處以新臺幣3萬元罰鍰。',
    attachments: [{ no: '貿管理字第114703105號-1', desc: '進口報單影本' }, { no: '貿管理字第114703105號-2', desc: '產地證明文件' }],
  },
  {
    id: 'case-8', docNo: '貿管理字第114706788號', date: '中華民國114年10月03日', updateDate: '114.10.03',
    target: 'XYZ農業出口有限公司', law: '違反出口貿易限制規定，貿易法第13條、第28條第1項第3款',
    goods: '農產品（高山茶葉）', tags: [], penalty: '處以罰緩 30 萬',
    categoryId: 'ex-violation', flowId: null,
    summary: '貴公司報運出口高山茶葉至日本，涉及出口貿易限制管制貨品，未依規定申請出口許可，違反貿易法第13條規定，依同法第28條第1項第3款從重裁處新臺幣30萬元罰鍰，並限制出口資格6個月。',
    attachments: [{ no: '貿管理字第114706788號-1', desc: '出口許可申請文件' }, { no: '貿管理字第114706788號-2', desc: '行政裁量基準表' }],
    relatedLabel: '相關管制貨品裁罰案',
  },
  {
    id: 'case-9', docNo: '貿管理字第114708234號', date: '中華民國114年12月01日', updateDate: '114.12.01',
    target: '全康醫療器材股份有限公司', law: '涉及出口貿易限制，貿易法第13條、第28條第1項第3款',
    goods: '醫療器材（手術設備零件）', tags: ['從輕'], penalty: '處以罰緩 9 萬',
    categoryId: 'im-violation', flowId: null,
    summary: '貴公司自德國進口手術設備零件，其中部分品項涉及出口貿易限制管制清單，未依規定申請進口許可，惟事後主動補辦相關手續，依從輕原則裁處新臺幣9萬元罰鍰。',
    attachments: [{ no: '貿管理字第114708234號-1', desc: '進口許可補辦資料' }],
  },
  {
    id: 'case-10', docNo: '貿管理字第114705512號', date: '中華民國114年10月28日', updateDate: '114.10.28',
    target: '美洲服飾貿易有限公司', law: '違反貿易法第17條第2款及實質轉型規定，第28條第1項第6款',
    goods: '紡織品（針織成衣）', tags: ['輸美'], penalty: '依項次2，各裁處45萬',
    categoryId: 'ex-product-4', flowId: 'flow-1',
    summary: '貴公司報運出口針織成衣2批至美國，外箱及標籤標示 MADE IN TAIWAN，惟實際未達實質轉型，產地標示不實，且屬加強管理貨品，依法從重裁處每批新臺幣45萬元罰鍰。',
    attachments: [{ no: '貿管理字第114705512號-1', desc: '實質轉型認定書' }, { no: '貿管理字第114705512號-2', desc: '產地查核報告' }],
  },
  {
    id: 'case-11', docNo: '貿管理字第114702987號', date: '中華民國114年08月15日', updateDate: '114.08.15',
    target: '永達化工原料股份有限公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '化學品（工業用溶劑）', tags: ['從輕'], penalty: '處以罰緩 6 萬',
    categoryId: 'im-product-1', flowId: null,
    summary: '貴公司報運進口工業用溶劑，申報產地為馬來西亞，惟經查核產地標示不實，係由他國轉口，違反貿易法第17條第2款，因屬首次違規，依從輕原則裁處新臺幣6萬元罰鍰。',
    attachments: [{ no: '貿管理字第114702987號-1', desc: '原產地聲明書' }, { no: '貿管理字第114702987號-2', desc: '轉口證明文件' }],
  },
  {
    id: 'case-12', docNo: '貿管理字第114701456號', date: '中華民國114年07月22日', updateDate: '114.07.22',
    target: '宏鋼鐵業股份有限公司', law: '違反貿易法第17條第2款及加強管理規定，第28條第1項第6款',
    goods: '鋼鐵製品（熱軋鋼捲）', tags: [], penalty: '處以罰緩 90 萬',
    categoryId: 'ex-product-4', flowId: 'flow-1',
    summary: '貴公司報運出口熱軋鋼捲至歐盟，涉及反規避調查，產品未達實質轉型標準，且屬158項加強管理鋼鐵貨品，違反貿易法第17條第2款規定，依加重條款裁處新臺幣90萬元罰鍰，情節重大。',
    attachments: [{ no: '貿管理字第114701456號-1', desc: '歐盟反規避調查文件' }, { no: '貿管理字第114701456號-2', desc: '鋼鐵加強管理清單' }],
    relatedLabel: '鋼鐵類加強管理歷史案例',
  },
  // 待審核案例：status='pending' 時不會出現在一般案例清單，只會出現在「待審」頁面，
  // 審核同意後才轉為 published（無 status 欄位視同 published，上面既有 12 筆皆屬此類）。
  {
    id: 'case-13', docNo: '貿管理字第114705890號', date: '中華民國114年12月02日', updateDate: '114.12.02',
    target: '誠信貿易股份有限公司', law: '違反貿易法第17條第2款規定，第28條第1項第6款規定',
    goods: '運動鞋類', tags: ['從輕'], penalty: '處以罰緩 7 萬',
    categoryId: 'ex-product-2', flowId: 'flow-1',
    summary: '貴公司報運出口運動鞋類1批至加拿大，貨品標示產地與實際產地不符，致生誤認產地情形，違反貿易法第17條第2款規定，依同法第28條第1項第6款規定處以新臺幣7萬元罰鍰，請查照。',
    attachments: [{ no: '貿管理字第114705890號-1', desc: 'OOO聲明書' }],
    // 曾被退回一次、修改後重新送審（示意「退回原因」欄位的顯示效果），目前狀態已回到 pending 等待再次審核
    status: 'pending', submitter: '陳小華', submitDate: '2026/07/01',
    signoffs: [
      { seq: 1, signer: '王大明', comment: '案情敘述不夠完整，請補充產地誤認之具體事證後重新送審。', time: '2026/06/28 14:20', action: 'reject' },
    ],
  },
  {
    id: 'case-14', docNo: '貿管理字第114705912號', date: '中華民國114年12月05日', updateDate: '114.12.05',
    target: '大同進口貿易有限公司', law: '涉及出口貿易限制，貿易法第13條、第28條第1項第3款',
    goods: '精密機械零件', tags: [], penalty: '處以罰緩 20 萬',
    categoryId: 'im-violation', flowId: null,
    summary: '貴公司自日本進口精密機械零件，其中部分品項涉及出口貿易限制管制清單，未依規定申請進口許可，依同法第28條第1項第3款裁處新臺幣20萬元罰鍰。',
    attachments: [{ no: '貿管理字第114705912號-1', desc: '進口報單影本' }],
    status: 'pending', submitter: '王大明', submitDate: '2026/07/02', signoffs: [],
  },
];

/** 依 id 取得案例 */
function caseById(id) {
  return CASES_DATA.find(c => c.id === id) || null;
}
