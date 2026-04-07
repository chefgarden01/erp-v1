/**
 * 그트플 통합관리시스템 - 메인 앱
 */

// ===== HTML 특수문자 이스케이프 =====
function escHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== 모듈별 사이드바 메뉴 구조 =====
const MODULE_MENUS = {
    system: [
        { title: '시스템관리', items: [
            { code: 'common_code', label: '공통코드' },
        ]},
        { title: '상품등록', items: [
            { code: 'master_product', label: '마스터상품' },
            { code: 'sku_product', label: 'SKU상품' },
            { code: 'product_mapping', label: '마스터-SKU 매핑' },
        ]},
        { title: '비상품등록', items: [
            { code: 'package_material', label: '포장자재' },
            { code: 'consumable', label: '소모품' },
            { code: 'logistics_material', label: '물류자재' },
            { code: 'facility', label: '시설/기구' },
        ]},
        { title: '조직관리', items: [
            { code: 'department', label: '부서/팀' },
            { code: 'employee', label: '직원' },
            { code: 'user_account', label: '사용자계정' },
        ]},
        { title: '판매처등록', items: [
            { code: 'sales_dept', label: '사업부서' },
            { code: 'sales_channel', label: '판매채널' },
            { code: 'seller', label: '판매처' },
            { code: 'receiving_center', label: '판매처 입고센터' },
        ]},
        { title: '매입처등록', items: [
            { code: 'supplier', label: '상품매입처' },
            { code: 'reverse_invoice', label: '비상품매입처' },
        ]},
    ],
    farm: [
        { title: '농장관리', items: [
            { code: 'farm_dashboard', label: '하우스 현황 대시보드' },
            { code: 'greenhouse', label: '하우스 통합관리' },
            { code: 'farm_facility', label: '설비' },
            { code: 'agri_machine', label: '농사장비' },
            { code: 'agri_tool', label: '농사기구' },
        ]},
    ],
    order: [
        { title: '주문관리', items: [
            { code: 'order_dashboard', label: '주문 대시보드' },
            { code: 'order', label: '주문내역' },
            { code: 'order_excel_upload', label: '판매처별 엑셀등록' },
            { code: 'order_manual', label: '수동 주문등록' },
        ]},
        { title: '주문설정', items: [
            { code: 'seller_excel_mapping', label: '판매처 엑셀매핑' },
            { code: 'seller_sku_mapping', label: '판매처 SKU매핑' },
        ]},
    ],
    outbound: [
        { title: '출고재고관리', items: [
            { code: 'outbound_plan', label: '출고계획', placeholder: true },
            { code: 'outbound_process', label: '출고처리', placeholder: true },
            { code: 'inventory_status', label: '재고현황', placeholder: true },
            { code: 'logistics', label: '물류관리' },
            { code: 'delivery_type', label: '배송타입' },
        ]},
    ],
    inbound: [
        { title: '입고관리', items: [
            { code: 'inbound_plan', label: '입고계획', placeholder: true },
            { code: 'inbound_process', label: '입고처리', placeholder: true },
            { code: 'inbound_history', label: '입고이력', placeholder: true },
        ]},
    ],
    sales: [
        { title: '판매관리', items: [
            { code: 'customer', label: '매출거래처' },
            { code: 'sales_status', label: '판매현황', placeholder: true },
            { code: 'sales_history', label: '판매이력', placeholder: true },
            { code: 'settlement', label: '정산관리', placeholder: true },
        ]},
    ],
    operation: [
        { title: '운영관리', items: [
            { code: 'cost_code', label: '비용관리' },
            { code: 'todo_item', label: '3정5S 관리항목' },
            { code: 'daily_report', label: '일일보고', placeholder: true },
            { code: 'work_schedule', label: '작업일정', placeholder: true },
        ]},
    ],
    analysis: [
        { title: '분석관리', items: [
            { code: 'kamis_price', label: 'KAMIS 시세조회', placeholder: true },
            { code: 'sales_analysis', label: '매출분석', placeholder: true },
            { code: 'cost_analysis', label: '비용분석', placeholder: true },
            { code: 'farm_analysis', label: '농장분석', placeholder: true },
        ]},
    ],
};

// ===== 상태 관리 =====
let currentModule = 'system';
let currentCode = 'common_code';
let currentPage = 1;
let editingId = null;
let excelData = [];
let PAGE_SIZE = 20;

// ===== 작업탭 관리 =====
let openWorktabs = []; // [{code, label, module}]

// ===== 데이터 저장/로드 (localStorage + Firestore) =====
function getData(codeKey) {
    const raw = localStorage.getItem('gtp_' + codeKey);
    return raw ? JSON.parse(raw) : [];
}
function setData(codeKey, data) {
    localStorage.setItem('gtp_' + codeKey, JSON.stringify(data));
    saveToFirestore(codeKey, data);
}

// ===== 코드 자동생성 =====
function generateId(codeKey, existingData) {
    const def = CODE_DEFINITIONS[codeKey];
    const data = existingData || getData(codeKey);
    const prefix = def.prefix;
    let maxNum = 0;
    data.forEach(item => {
        const idField = def.fields[0].key;
        const id = item[idField] || '';
        const match = id.match(new RegExp(prefix + '-(\\d+)'));
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });
    return prefix + '-' + String(maxNum + 1).padStart(4, '0');
}

// ===== 마스터상품코드 자동 생성 (GTP-0001, GTP-0002 순번) =====
function generateMasterProductId(existingData) {
    const data = existingData || getData('master_product');
    let maxNum = 0;
    data.forEach(item => {
        const id = item.master_product_id || '';
        const match = id.match(/^GTP-(\d+)$/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });
    return 'GTP-' + String(maxNum + 1).padStart(4, '0');
}

// 신규등록시 마스터상품코드 자동 부여
function bindMasterProductIdAuto() {
    const form = document.getElementById('modalBody');
    if (!form) return;
    const idInput = form.querySelector('[name="master_product_id"]');
    if (!idInput) return;

    // 신규등록시 다음 순번 코드 자동 부여
    if (!idInput.value) {
        idInput.value = generateMasterProductId();
    }
}

// ===== 모듈 전환 =====
function switchModule(moduleKey) {
    currentModule = moduleKey;
    currentPage = 1;
    editingId = null;

    // 탭 활성화
    document.querySelectorAll('.module-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.module === moduleKey);
    });

    // 사이드바 렌더링
    renderSidebar();

    // 첫 번째 메뉴 자동 선택
    const menus = MODULE_MENUS[moduleKey];
    if (menus && menus.length > 0 && menus[0].items.length > 0) {
        navigateTo(menus[0].items[0].code);
    }
}

// ===== 사이드바 렌더링 =====
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menus = MODULE_MENUS[currentModule] || [];
    let html = '';

    menus.forEach(section => {
        html += `<div class="sidebar-section">
            <div class="sidebar-title">${section.title}</div>`;
        section.items.forEach(item => {
            html += `<a class="sidebar-item${currentCode === item.code ? ' active' : ''}" data-code="${item.code}" onclick="navigateTo('${item.code}')">${item.label}</a>`;
        });
        html += '</div>';
    });

    sidebar.innerHTML = html;
}

// ===== 작업탭 렌더링 =====
function getMenuLabel(codeKey) {
    for (const mod of Object.keys(MODULE_MENUS)) {
        for (const section of MODULE_MENUS[mod]) {
            for (const item of section.items) {
                if (item.code === codeKey) return item.label;
            }
        }
    }
    const def = CODE_DEFINITIONS[codeKey];
    return def ? def.name : codeKey;
}

function addWorktab(codeKey) {
    if (!openWorktabs.find(t => t.code === codeKey)) {
        openWorktabs.push({
            code: codeKey,
            label: getMenuLabel(codeKey),
            module: currentModule,
        });
    }
    renderWorktabs();
}

function removeWorktab(codeKey, event) {
    if (event) event.stopPropagation();
    const idx = openWorktabs.findIndex(t => t.code === codeKey);
    if (idx < 0) return;
    openWorktabs.splice(idx, 1);
    renderWorktabs();

    // 닫은 탭이 현재 탭이면 다른 탭으로 이동
    if (currentCode === codeKey) {
        if (openWorktabs.length > 0) {
            // 같은 위치 또는 마지막 탭으로 이동
            const nextIdx = Math.min(idx, openWorktabs.length - 1);
            const next = openWorktabs[nextIdx];
            if (next.module !== currentModule) {
                switchModule(next.module);
            }
            navigateTo(next.code);
        } else {
            // 탭이 없으면 사이드바 첫 메뉴로
            const menus = MODULE_MENUS[currentModule];
            if (menus && menus[0]?.items[0]) {
                navigateTo(menus[0].items[0].code);
            }
        }
    }
}

function switchWorktab(codeKey) {
    const tab = openWorktabs.find(t => t.code === codeKey);
    if (!tab) return;
    // 다른 모듈의 탭이면 모듈 전환
    if (tab.module !== currentModule) {
        currentModule = tab.module;
        document.querySelectorAll('.module-tab').forEach(el => {
            el.classList.toggle('active', el.dataset.module === tab.module);
        });
        renderSidebar();
    }
    navigateTo(codeKey);
}

function renderWorktabs() {
    const bar = document.getElementById('worktabBar');
    if (!bar) return;
    if (openWorktabs.length === 0) {
        bar.innerHTML = '';
        return;
    }
    let html = '';
    openWorktabs.forEach(tab => {
        const isActive = tab.code === currentCode ? ' active' : '';
        html += `<div class="worktab${isActive}" onclick="switchWorktab('${tab.code}')" title="${tab.label}">
            <span class="worktab-label">${tab.label}</span>
            <button class="worktab-close" onclick="removeWorktab('${tab.code}', event)" title="닫기">&times;</button>
        </div>`;
    });
    bar.innerHTML = html;
}

// ===== 네비게이션 =====
function navigateTo(codeKey) {
    currentCode = codeKey;
    currentPage = 1;
    editingId = null;

    // 작업탭 추가
    addWorktab(codeKey);

    // 사이드바 활성화
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.code === codeKey);
    });

    // 공통코드 관리
    if (codeKey === 'common_code') {
        renderCommonCodePage();
        return;
    }

    // 하우스 대시보드
    if (codeKey === 'farm_dashboard') {
        renderFarmDashboard();
        return;
    }

    // 주문 대시보드
    if (codeKey === 'order_dashboard') { renderOrderDashboard(); return; }
    // 판매처별 엑셀등록
    if (codeKey === 'order_excel_upload') { renderOrderExcelUpload(); return; }
    // 수동 주문등록
    if (codeKey === 'order_manual') { renderOrderManualEntry(); return; }

    // 플레이스홀더 메뉴 체크
    if (isPlaceholderMenu(codeKey)) {
        renderPlaceholder(codeKey);
        return;
    }

    // 일반 코드 관리 페이지
    if (CODE_DEFINITIONS[codeKey]) {
        renderPage();
    } else {
        renderPlaceholder(codeKey);
    }
}

// 플레이스홀더 여부 체크
function isPlaceholderMenu(codeKey) {
    for (const mod of Object.values(MODULE_MENUS)) {
        for (const section of mod) {
            for (const item of section.items) {
                if (item.code === codeKey && item.placeholder) return true;
            }
        }
    }
    return false;
}

// 메뉴 라벨 찾기
function getMenuLabel(codeKey) {
    for (const mod of Object.values(MODULE_MENUS)) {
        for (const section of mod) {
            for (const item of section.items) {
                if (item.code === codeKey) return item.label;
            }
        }
    }
    return codeKey;
}

// 미개발 모듈 플레이스홀더
function renderPlaceholder(codeKey) {
    const label = getMenuLabel(codeKey);
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <div class="module-placeholder">
            <div class="placeholder-icon">🚧</div>
            <div class="placeholder-title">${label}</div>
            <div class="placeholder-desc">개발 예정 메뉴입니다. 코딩 요청 시 구현됩니다.</div>
        </div>`;
}

// ===== 하우스 현황 대시보드 =====
function renderFarmDashboard() {
    const main = document.getElementById('mainContent');
    const data = getData('greenhouse').filter(d => d.status === '사용');

    // 상태별 집계
    const statusCounts = { '휴경중': 0, '생육중': 0, '수확중': 0, '정비중': 0, '보수중': 0 };
    data.forEach(d => {
        if (statusCounts[d.house_status] !== undefined) statusCounts[d.house_status]++;
    });

    // 상태별 CSS 클래스
    const statusClass = {
        '휴경중': 'status-idle',
        '생육중': 'status-growing',
        '수확중': 'status-harvest',
        '육묘중': 'status-seedling',
        '정비중': 'status-maintain',
        '보수중': 'status-repair',
    };
    // 상태별 색상 (진한 순서: 휴경→생육→수확→준비)
    const statusColor = {
        '휴경중': '#86efac',
        '생육중': '#22c55e',
        '수확중': '#15803d',
        '육묘중': '#a7f3d0',
        '정비중': '#eab308',
        '보수중': '#ef4444',
    };

    let statsHtml = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">전체 하우스</div>
                <div class="stat-value">${data.length}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#22c55e">생육중</div>
                <div class="stat-value" style="color:#22c55e">${statusCounts['생육중']}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#15803d">수확중</div>
                <div class="stat-value" style="color:#15803d">${statusCounts['수확중']}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#86efac">휴경중</div>
                <div class="stat-value">${statusCounts['휴경중']}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:var(--warning)">정비/보수</div>
                <div class="stat-value" style="color:var(--warning)">${statusCounts['정비중'] + statusCounts['보수중']}<span class="stat-unit">동</span></div>
            </div>
        </div>`;

    // 하우스 아이콘 카드 그리드
    let cardsHtml = '';
    if (data.length === 0) {
        cardsHtml = '<div style="text-align:center;padding:60px;color:var(--gray-400);">등록된 하우스가 없습니다. 하우스 통합관리에서 먼저 등록하세요.</div>';
    } else {
        cardsHtml = '<div class="house-grid">';
        data.forEach(d => {
            const cls = statusClass[d.house_status] || 'status-idle';
            const color = statusColor[d.house_status] || '#86efac';
            const abbr = d.house_name || d.house_id || '?';
            const crop = d.crop_name || '-';
            const idField = CODE_DEFINITIONS.greenhouse.fields[0].key;
            const id = d[idField];
            cardsHtml += `
                <div class="house-icon-card ${cls}" onclick="goToHouse('${id}')" title="${abbr} - ${crop} (${d.house_status || ''})">
                    <div class="house-icon-emoji">🌿</div>
                    <div class="house-abbr">${abbr}</div>
                    <div class="house-crop">${crop}</div>
                    <div class="house-status-label">
                        <span class="house-status-dot" style="background:${color}"></span>
                        ${d.house_status || '-'}
                    </div>
                </div>`;
        });
        cardsHtml += '</div>';
    }

    main.innerHTML = `
        <div class="page-header">
            <div>
                <div class="page-title">🏡 하우스 현황 대시보드</div>
                <div class="page-desc">하우스 상태를 한눈에 파악합니다. 아이콘 클릭 시 해당 하우스 관리 화면으로 이동합니다.</div>
            </div>
            <div class="page-actions">
                <button class="btn" onclick="navigateTo('greenhouse')">하우스 통합관리</button>
            </div>
        </div>
        ${statsHtml}
        <div class="house-dashboard">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3 style="font-size:14px;font-weight:600;color:var(--gray-700);">하우스 현황</h3>
                <div style="font-size:11px;color:var(--gray-400);">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#86efac;margin-right:3px;vertical-align:middle;"></span>휴경
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;margin:0 3px 0 10px;vertical-align:middle;"></span>생육
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#15803d;margin:0 3px 0 10px;vertical-align:middle;"></span>수확
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#eab308;margin:0 3px 0 10px;vertical-align:middle;"></span>정비
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;margin:0 3px 0 10px;vertical-align:middle;"></span>보수
                </div>
            </div>
            ${cardsHtml}
        </div>`;
}

// ===== 주문 대시보드 =====
function renderOrderDashboard() {
    const main = document.getElementById('mainContent');
    const orders = getData('order');
    const sellers = getData('seller').filter(s => s.status === '사용');
    const masterProducts = getData('master_product').filter(m => m.status === '사용');

    // 상태별 집계
    const statusCounts = { '접수': 0, '확인': 0, '출고': 0, '완료': 0, '취소': 0 };
    orders.forEach(o => { if (statusCounts[o.order_status] !== undefined) statusCounts[o.order_status]++; });

    const statsHtml = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">총 주문건수</div>
                <div class="stat-value">${orders.length}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#3b82f6">접수</div>
                <div class="stat-value" style="color:#3b82f6">${statusCounts['접수']}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#f59e0b">확인</div>
                <div class="stat-value" style="color:#f59e0b">${statusCounts['확인']}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#22c55e">출고</div>
                <div class="stat-value" style="color:#22c55e">${statusCounts['출고']}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#6366f1">완료</div>
                <div class="stat-value" style="color:#6366f1">${statusCounts['완료']}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:#ef4444">취소</div>
                <div class="stat-value" style="color:#ef4444">${statusCounts['취소']}<span class="stat-unit">건</span></div>
            </div>
        </div>`;

    // 판매처 옵션
    let sellerOpts = '<option value="">전체 판매처</option>';
    sellers.forEach(s => { sellerOpts += `<option value="${escHtml(s.seller_id)}">${escHtml(s.seller_name)}</option>`; });

    // 마스터상품 옵션
    let masterOpts = '<option value="">전체 마스터상품</option>';
    masterProducts.forEach(m => { masterOpts += `<option value="${escHtml(m.master_product_id)}">${escHtml(m.product_name_kr)} (${escHtml(m.master_product_id)})</option>`; });

    main.innerHTML = `
        <div class="page-header">
            <div>
                <div class="page-title">📋 주문 대시보드</div>
                <div class="page-desc">조건별 주문 조회 및 현황을 파악합니다.</div>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary" onclick="navigateTo('order_excel_upload')">📤 엑셀등록</button>
                <button class="btn" onclick="navigateTo('order_manual')">✏️ 수동등록</button>
            </div>
        </div>
        ${statsHtml}
        <div style="margin-bottom:16px;">
            <div class="order-dash-tabs" id="orderDashTabs" style="display:flex;gap:4px;margin-bottom:12px;">
                <button class="btn btn-sm active" data-tab="all" onclick="switchOrderTab('all')">통합주문</button>
                <button class="btn btn-sm" data-tab="seller" onclick="switchOrderTab('seller')">판매처별</button>
                <button class="btn btn-sm" data-tab="master" onclick="switchOrderTab('master')">마스터상품별</button>
                <button class="btn btn-sm" data-tab="sku" onclick="switchOrderTab('sku')">SKU상품별</button>
                <button class="btn btn-sm" data-tab="date" onclick="switchOrderTab('date')">날짜별</button>
            </div>
            <div class="filter-bar" id="orderDashFilters">
                <select id="odSeller" class="filter-select" onchange="renderOrderDashTable()" style="display:none">${sellerOpts}</select>
                <select id="odMaster" class="filter-select" onchange="renderOrderDashTable()" style="display:none">${masterOpts}</select>
                <input type="text" id="odSku" class="search-input" placeholder="SKU코드 검색" oninput="renderOrderDashTable()" style="display:none;max-width:200px">
                <input type="date" id="odDateFrom" class="search-input" onchange="renderOrderDashTable()" style="display:none;max-width:160px">
                <span id="odDateSep" style="display:none;line-height:32px;"> ~ </span>
                <input type="date" id="odDateTo" class="search-input" onchange="renderOrderDashTable()" style="display:none;max-width:160px">
                <select id="odStatus" class="filter-select" onchange="renderOrderDashTable()">
                    <option value="">전체 주문상태</option>
                    <option value="접수">접수</option>
                    <option value="확인">확인</option>
                    <option value="출고">출고</option>
                    <option value="완료">완료</option>
                    <option value="취소">취소</option>
                </select>
                <input type="text" id="odSearch" class="search-input" placeholder="검색어 입력" oninput="renderOrderDashTable()" style="max-width:200px">
                <span class="record-count" id="odRecordCount"></span>
            </div>
        </div>
        <div class="table-wrapper">
            <table class="data-table" id="orderDashTable"></table>
        </div>
        <div class="pagination" id="odPagination"></div>`;

    window._odPage = 1;
    window._odTab = 'all';
    renderOrderDashTable();
}

function switchOrderTab(tab) {
    window._odTab = tab;
    window._odPage = 1;

    // 탭 활성화
    document.querySelectorAll('#orderDashTabs button').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
        b.style.background = b.dataset.tab === tab ? 'var(--primary)' : '';
        b.style.color = b.dataset.tab === tab ? '#fff' : '';
    });

    // 필터 표시/숨김
    const show = (id, v) => { const el = document.getElementById(id); if (el) el.style.display = v ? '' : 'none'; };
    show('odSeller', tab === 'seller');
    show('odMaster', tab === 'master');
    show('odSku', tab === 'sku');
    show('odDateFrom', tab === 'date');
    show('odDateSep', tab === 'date');
    show('odDateTo', tab === 'date');

    renderOrderDashTable();
}

function renderOrderDashTable() {
    const orders = getData('order');
    const tab = window._odTab || 'all';
    const statusFilter = document.getElementById('odStatus')?.value || '';
    const search = (document.getElementById('odSearch')?.value || '').toLowerCase();
    const sellerFilter = document.getElementById('odSeller')?.value || '';
    const masterFilter = document.getElementById('odMaster')?.value || '';
    const skuFilter = (document.getElementById('odSku')?.value || '').toLowerCase();
    const dateFrom = document.getElementById('odDateFrom')?.value || '';
    const dateTo = document.getElementById('odDateTo')?.value || '';

    let filtered = orders.filter(o => {
        if (statusFilter && o.order_status !== statusFilter) return false;
        if (tab === 'seller' && sellerFilter && o.seller_id !== sellerFilter) return false;
        if (tab === 'master' && masterFilter && o.master_product_id !== masterFilter) return false;
        if (tab === 'sku' && skuFilter && !(o.sku_id || '').toLowerCase().includes(skuFilter)) return false;
        if (tab === 'date') {
            if (dateFrom && o.order_date < dateFrom) return false;
            if (dateTo && o.order_date > dateTo) return false;
        }
        if (search) {
            const vals = Object.values(o).join(' ').toLowerCase();
            if (!vals.includes(search)) return false;
        }
        return true;
    });

    const PAGE = 20;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
    if (window._odPage > totalPages) window._odPage = totalPages;
    const start = (window._odPage - 1) * PAGE;
    const pageData = filtered.slice(start, start + PAGE);

    const cols = ['order_id','order_date','seller_id','product_name','master_product_id','quantity','total_amount','order_status'];
    const colLabels = { order_id:'주문코드', order_date:'주문일자', seller_id:'판매처', product_name:'상품명',
        master_product_id:'마스터상품코드', quantity:'주문수량', total_amount:'주문금액', order_status:'주문상태' };
    const sellers = getData('seller');

    let html = '<thead><tr>';
    cols.forEach(c => { html += `<th>${colLabels[c]}</th>`; });
    html += '</tr></thead><tbody>';

    if (pageData.length === 0) {
        html += `<tr><td colspan="${cols.length}" style="text-align:center;padding:40px;color:var(--gray-400)">주문 데이터가 없습니다</td></tr>`;
    } else {
        pageData.forEach(o => {
            html += '<tr>';
            cols.forEach(c => {
                let val = o[c] || '';
                if (c === 'seller_id') {
                    const s = sellers.find(x => x.seller_id === val);
                    if (s) val = s.seller_name || val;
                }
                if (c === 'order_status') {
                    const cls = val === '완료' ? 'badge-active' : val === '취소' ? 'badge-deleted' :
                                val === '출고' ? 'badge-active' : val === '확인' ? 'badge-inactive' : 'badge-inactive';
                    val = `<span class="badge ${cls}">${val}</span>`;
                }
                if ((c === 'quantity' || c === 'total_amount' || c === 'unit_price') && val !== '') {
                    val = Number(val).toLocaleString();
                }
                html += `<td>${val}</td>`;
            });
            html += '</tr>';
        });
    }
    html += '</tbody>';
    document.getElementById('orderDashTable').innerHTML = html;
    document.getElementById('odRecordCount').textContent = `총 ${filtered.length}건`;

    // 페이지네이션
    const pag = document.getElementById('odPagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    let ph = `<button ${window._odPage <= 1 ? 'disabled' : ''} onclick="window._odPage--;renderOrderDashTable()">◀</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && Math.abs(i - window._odPage) > 2 && i !== 1 && i !== totalPages) {
            if (i === 2 || i === totalPages - 1) ph += '<span class="page-info">...</span>';
            continue;
        }
        ph += `<button class="${i === window._odPage ? 'active' : ''}" onclick="window._odPage=${i};renderOrderDashTable()">${i}</button>`;
    }
    ph += `<button ${window._odPage >= totalPages ? 'disabled' : ''} onclick="window._odPage++;renderOrderDashTable()">▶</button>`;
    pag.innerHTML = ph;
}

// ===== 판매처별 엑셀등록 =====
function renderOrderExcelUpload() {
    const main = document.getElementById('mainContent');
    const sellers = getData('seller').filter(s => s.status === '사용');

    let sellerOpts = '<option value="">-- 판매처 선택 --</option>';
    sellers.forEach(s => { sellerOpts += `<option value="${escHtml(s.seller_id)}">${escHtml(s.seller_name)}</option>`; });

    main.innerHTML = `
        <div class="page-header">
            <div>
                <div class="page-title">📤 판매처별 엑셀등록</div>
                <div class="page-desc">판매처를 선택한 후 엑셀 파일을 업로드하면 매핑 설정에 따라 자동 변환됩니다.</div>
            </div>
        </div>
        <div style="background:#fff;border:1px solid var(--gray-200);border-radius:8px;padding:20px;margin-bottom:16px;">
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;">
                <label style="font-weight:600;min-width:80px;">판매처</label>
                <select id="oeuSeller" class="filter-select" onchange="onOeuSellerChange()" style="max-width:300px">${sellerOpts}</select>
                <span id="oeuMappingStatus" style="font-size:12px;color:var(--gray-400);"></span>
            </div>
            <div id="oeuUploadArea" style="display:none;">
                <div id="oeuDropZone" style="border:2px dashed var(--gray-300);border-radius:8px;padding:40px;text-align:center;cursor:pointer;margin-bottom:16px;background:var(--gray-50);" onclick="document.getElementById('oeuFileInput').click()">
                    <div style="font-size:32px;margin-bottom:8px;">📂</div>
                    <div style="font-size:14px;color:var(--gray-500);">엑셀 파일을 드래그하거나 클릭하여 업로드</div>
                    <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">.xlsx, .xls 형식 지원</div>
                    <input type="file" id="oeuFileInput" accept=".xlsx,.xls" style="display:none" onchange="handleOeuFile(event)">
                </div>
            </div>
        </div>
        <div id="oeuPreview" style="display:none;">
            <div style="background:#fff;border:1px solid var(--gray-200);border-radius:8px;padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="font-size:14px;font-weight:600;">변환 미리보기 (<span id="oeuRowCount">0</span>건)</h3>
                    <button class="btn btn-primary" onclick="importOeuData()">📥 주문 등록</button>
                </div>
                <div class="table-wrapper">
                    <table class="data-table" id="oeuPreviewTable"></table>
                </div>
            </div>
        </div>`;

    // 드래그앤드롭
    const dz = document.getElementById('oeuDropZone');
    if (dz) {
        dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = 'var(--primary)'; });
        dz.addEventListener('dragleave', () => { dz.style.borderColor = 'var(--gray-300)'; });
        dz.addEventListener('drop', e => {
            e.preventDefault(); dz.style.borderColor = 'var(--gray-300)';
            const file = e.dataTransfer.files[0];
            if (file) processOeuFile(file);
        });
    }
    window._oeuData = [];
}

function onOeuSellerChange() {
    const sellerId = document.getElementById('oeuSeller')?.value;
    const uploadArea = document.getElementById('oeuUploadArea');
    const statusEl = document.getElementById('oeuMappingStatus');
    const previewEl = document.getElementById('oeuPreview');

    if (!sellerId) {
        uploadArea.style.display = 'none';
        statusEl.textContent = '';
        previewEl.style.display = 'none';
        return;
    }

    // 매핑 설정 확인
    const mappings = getData('seller_excel_mapping').filter(m => m.seller_id === sellerId && m.status === '사용');
    if (mappings.length > 0) {
        statusEl.innerHTML = '<span style="color:var(--success)">✅ 엑셀매핑 설정 있음</span>';
    } else {
        statusEl.innerHTML = '<span style="color:var(--warning)">⚠ 엑셀매핑 미설정 (기본 컬럼명 사용)</span>';
    }
    uploadArea.style.display = '';
    previewEl.style.display = 'none';
}

function handleOeuFile(event) {
    const file = event.target.files[0];
    if (file) processOeuFile(file);
}

function processOeuFile(file) {
    const sellerId = document.getElementById('oeuSeller')?.value;
    if (!sellerId) { alert('판매처를 먼저 선택하세요.'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (json.length === 0) { alert('엑셀에 데이터가 없습니다.'); return; }

        // 매핑 설정 조회
        const mappings = getData('seller_excel_mapping').filter(m => m.seller_id === sellerId && m.status === '사용');
        const mapping = mappings.length > 0 ? mappings[0] : null;

        // SKU매핑 조회
        const skuMappings = getData('seller_sku_mapping').filter(m => m.seller_id === sellerId && m.status === '사용');

        // 컬럼 매핑 맵 생성
        const colMap = {};
        if (mapping) {
            if (mapping.excel_col_order_date) colMap[mapping.excel_col_order_date] = 'order_date';
            if (mapping.excel_col_product_name) colMap[mapping.excel_col_product_name] = 'product_name';
            if (mapping.excel_col_sku_code) colMap[mapping.excel_col_sku_code] = 'seller_sku_code';
            if (mapping.excel_col_quantity) colMap[mapping.excel_col_quantity] = 'quantity';
            if (mapping.excel_col_unit_price) colMap[mapping.excel_col_unit_price] = 'unit_price';
            if (mapping.excel_col_total_amount) colMap[mapping.excel_col_total_amount] = 'total_amount';
            if (mapping.excel_col_receiver_name) colMap[mapping.excel_col_receiver_name] = 'receiver_name';
            if (mapping.excel_col_receiver_phone) colMap[mapping.excel_col_receiver_phone] = 'receiver_phone';
            if (mapping.excel_col_receiver_address) colMap[mapping.excel_col_receiver_address] = 'receiver_address';
        }

        // 변환
        const converted = json.map(row => {
            const item = { seller_id: sellerId };
            Object.keys(row).forEach(col => {
                const mapped = colMap[col];
                if (mapped) {
                    item[mapped] = String(row[col]);
                } else {
                    // 기본 매핑: 컬럼명이 필드 라벨과 같으면
                    const def = CODE_DEFINITIONS.order;
                    const f = def.fields.find(fd => fd.label === col);
                    if (f) item[f.key] = String(row[col]);
                }
            });

            // 날짜 형식 정리
            if (item.order_date) {
                const d = item.order_date;
                // 엑셀 숫자 시리얼 변환
                if (/^\d{5}$/.test(d)) {
                    const date = new Date((parseInt(d) - 25569) * 86400000);
                    item.order_date = date.toISOString().slice(0, 10);
                }
            }
            if (!item.order_date) item.order_date = new Date().toISOString().slice(0, 10);

            // SKU매핑으로 마스터상품코드 자동 변환
            if (item.seller_sku_code) {
                const skuMap = skuMappings.find(m => m.seller_sku_code === item.seller_sku_code);
                if (skuMap) {
                    if (skuMap.master_product_id) item.master_product_id = skuMap.master_product_id;
                    if (skuMap.sku_id) item.sku_id = skuMap.sku_id;
                    if (!item.product_name && skuMap.seller_product_name) item.product_name = skuMap.seller_product_name;
                }
            }

            if (!item.product_name) item.product_name = '-';
            return item;
        });

        window._oeuData = converted;

        // 미리보기 테이블
        const cols = ['order_date','seller_sku_code','product_name','master_product_id','sku_id','quantity','unit_price','total_amount','receiver_name'];
        const colLabels = { order_date:'주문일자', seller_sku_code:'판매처SKU', product_name:'상품명', master_product_id:'마스터상품코드',
            sku_id:'SKU코드', quantity:'수량', unit_price:'단가', total_amount:'금액', receiver_name:'수령자' };

        let html = '<thead><tr>';
        cols.forEach(c => { html += `<th>${colLabels[c] || c}</th>`; });
        html += '</tr></thead><tbody>';
        converted.slice(0, 20).forEach(item => {
            html += '<tr>';
            cols.forEach(c => {
                let val = item[c] || '';
                if ((c === 'quantity' || c === 'unit_price' || c === 'total_amount') && val !== '') val = Number(val).toLocaleString();
                html += `<td>${escHtml(String(val))}</td>`;
            });
            html += '</tr>';
        });
        if (converted.length > 20) {
            html += `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--gray-400)">... 외 ${converted.length - 20}건</td></tr>`;
        }
        html += '</tbody>';

        document.getElementById('oeuPreviewTable').innerHTML = html;
        document.getElementById('oeuRowCount').textContent = converted.length;
        document.getElementById('oeuPreview').style.display = '';
    };
    reader.readAsArrayBuffer(file);
}

function importOeuData() {
    const items = window._oeuData || [];
    if (items.length === 0) { alert('등록할 데이터가 없습니다.'); return; }

    const data = getData('order');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    items.forEach(item => {
        item.order_id = generateId('order', data);
        if (!item.order_status) item.order_status = '접수';
        if (!item.status) item.status = '사용';
        item.created_by = 'Admin';
        item.created_at = now;
        item.updated_by = 'Admin';
        item.updated_at = now;
        data.push(item);
    });

    setData('order', data);
    alert(`${items.length}건의 주문이 등록되었습니다.`);
    window._oeuData = [];
    navigateTo('order_dashboard');
}

// ===== 수동 주문등록 =====
function renderOrderManualEntry() {
    const main = document.getElementById('mainContent');
    const sellers = getData('seller').filter(s => s.status === '사용');

    let sellerOpts = '<option value="">-- 판매처 선택 --</option>';
    sellers.forEach(s => { sellerOpts += `<option value="${escHtml(s.seller_id)}">${escHtml(s.seller_name)}</option>`; });

    const today = new Date().toISOString().slice(0, 10);

    main.innerHTML = `
        <div class="page-header">
            <div>
                <div class="page-title">✏️ 수동 주문등록</div>
                <div class="page-desc">주문 정보를 직접 입력하여 등록합니다.</div>
            </div>
        </div>
        <div style="background:#fff;border:1px solid var(--gray-200);border-radius:8px;padding:20px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
                <div>
                    <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">판매처 <span style="color:var(--danger)">*</span></label>
                    <select id="omSeller" class="filter-select" style="width:100%">${sellerOpts}</select>
                </div>
                <div>
                    <label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px;">주문일자 <span style="color:var(--danger)">*</span></label>
                    <input type="date" id="omDate" class="search-input" value="${today}" style="width:100%">
                </div>
            </div>
            <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="font-size:14px;font-weight:600;">주문 상품 목록</h3>
                <button class="btn btn-sm btn-primary" onclick="addManualOrderRow()">+ 행 추가</button>
            </div>
            <div class="table-wrapper">
                <table class="data-table" id="omTable">
                    <thead><tr>
                        <th style="width:40px">No.</th>
                        <th>상품명 *</th>
                        <th>판매처SKU코드</th>
                        <th>마스터상품코드</th>
                        <th style="width:90px">수량 *</th>
                        <th style="width:90px">단가</th>
                        <th style="width:100px">금액</th>
                        <th>수령자</th>
                        <th>수령자연락처</th>
                        <th>배송주소</th>
                        <th style="width:50px">삭제</th>
                    </tr></thead>
                    <tbody id="omTableBody"></tbody>
                </table>
            </div>
            <div style="margin-top:16px;text-align:right;">
                <button class="btn" onclick="navigateTo('order_dashboard')">취소</button>
                <button class="btn btn-primary" onclick="saveManualOrders()" style="margin-left:8px;">💾 주문 저장</button>
            </div>
        </div>`;

    window._omRowCount = 0;
    addManualOrderRow();
}

function addManualOrderRow() {
    window._omRowCount++;
    const idx = window._omRowCount;
    const tbody = document.getElementById('omTableBody');
    const tr = document.createElement('tr');
    tr.id = 'omRow_' + idx;
    tr.innerHTML = `
        <td>${idx}</td>
        <td><input type="text" name="product_name_${idx}" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;"></td>
        <td><input type="text" name="seller_sku_${idx}" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;" onchange="onManualSkuChange(${idx})"></td>
        <td><input type="text" name="master_id_${idx}" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;" readonly></td>
        <td><input type="number" name="qty_${idx}" min="1" value="1" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;" onchange="calcManualRow(${idx})"></td>
        <td><input type="number" name="price_${idx}" min="0" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;" onchange="calcManualRow(${idx})"></td>
        <td><input type="number" name="amount_${idx}" min="0" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;" readonly></td>
        <td><input type="text" name="recv_name_${idx}" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;"></td>
        <td><input type="text" name="recv_phone_${idx}" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;"></td>
        <td><input type="text" name="recv_addr_${idx}" style="width:100%;padding:4px 6px;border:1px solid var(--gray-300);border-radius:4px;"></td>
        <td><button class="btn btn-sm btn-danger" onclick="document.getElementById('omRow_${idx}').remove()">✕</button></td>`;
    tbody.appendChild(tr);
}

function onManualSkuChange(idx) {
    const sellerId = document.getElementById('omSeller')?.value;
    const skuCode = document.querySelector(`[name="seller_sku_${idx}"]`)?.value;
    if (!sellerId || !skuCode) return;

    const skuMappings = getData('seller_sku_mapping').filter(m => m.seller_id === sellerId && m.status === '사용');
    const match = skuMappings.find(m => m.seller_sku_code === skuCode);
    if (match) {
        const masterInput = document.querySelector(`[name="master_id_${idx}"]`);
        if (masterInput && match.master_product_id) masterInput.value = match.master_product_id;
        const nameInput = document.querySelector(`[name="product_name_${idx}"]`);
        if (nameInput && !nameInput.value && match.seller_product_name) nameInput.value = match.seller_product_name;
    }
}

function calcManualRow(idx) {
    const qty = parseFloat(document.querySelector(`[name="qty_${idx}"]`)?.value) || 0;
    const price = parseFloat(document.querySelector(`[name="price_${idx}"]`)?.value) || 0;
    const amountEl = document.querySelector(`[name="amount_${idx}"]`);
    if (amountEl) amountEl.value = qty * price;
}

function saveManualOrders() {
    const sellerId = document.getElementById('omSeller')?.value;
    const orderDate = document.getElementById('omDate')?.value;

    if (!sellerId) { alert('판매처를 선택하세요.'); return; }
    if (!orderDate) { alert('주문일자를 입력하세요.'); return; }

    const rows = document.getElementById('omTableBody')?.querySelectorAll('tr') || [];
    if (rows.length === 0) { alert('주문 상품을 추가하세요.'); return; }

    const data = getData('order');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let count = 0;

    rows.forEach(tr => {
        const id = tr.id.replace('omRow_', '');
        const productName = tr.querySelector(`[name="product_name_${id}"]`)?.value?.trim();
        const qty = tr.querySelector(`[name="qty_${id}"]`)?.value;

        if (!productName) return;

        const order = {
            order_id: generateId('order', data),
            order_date: orderDate,
            seller_id: sellerId,
            product_name: productName,
            seller_sku_code: tr.querySelector(`[name="seller_sku_${id}"]`)?.value || '',
            master_product_id: tr.querySelector(`[name="master_id_${id}"]`)?.value || '',
            quantity: qty || '1',
            unit_price: tr.querySelector(`[name="price_${id}"]`)?.value || '',
            total_amount: tr.querySelector(`[name="amount_${id}"]`)?.value || '',
            receiver_name: tr.querySelector(`[name="recv_name_${id}"]`)?.value || '',
            receiver_phone: tr.querySelector(`[name="recv_phone_${id}"]`)?.value || '',
            receiver_address: tr.querySelector(`[name="recv_addr_${id}"]`)?.value || '',
            order_status: '접수',
            status: '사용',
            created_by: 'Admin',
            created_at: now,
            updated_by: 'Admin',
            updated_at: now,
        };
        data.push(order);
        count++;
    });

    if (count === 0) { alert('상품명이 입력된 행이 없습니다.'); return; }

    setData('order', data);
    alert(`${count}건의 주문이 등록되었습니다.`);
    navigateTo('order_dashboard');
}

// 하우스 아이콘 클릭 → 수정 폼으로 이동
function goToHouse(houseId) {
    navigateTo('greenhouse');
    setTimeout(() => openEditForm(houseId), 100);
}

// ===== 페이지 렌더링 =====
function renderPage() {
    const def = CODE_DEFINITIONS[currentCode];
    if (!def) { renderPlaceholder(currentCode); return; }
    const data = getData(currentCode);
    const main = document.getElementById('mainContent');

    // 통계 카드
    let statsHtml = '';
    if (def.hasMasterDashboard) {
        const activeProducts = data.filter(d => d.status === '사용').length;
        const mappingData = getData('product_mapping');
        const totalMappings = mappingData.filter(m => m.status === '사용').length;
        statsHtml = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">전체 등록상품</div>
                <div class="stat-value">${data.length}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">사용중</div>
                <div class="stat-value">${activeProducts}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">전체 SKU매핑</div>
                <div class="stat-value">${totalMappings}<span class="stat-unit">건</span></div>
            </div>
        </div>`;
    }
    if (def.hasSkuMasterItems) {
        const activeSkus = data.filter(d => d.status === '사용').length;
        const mixedSkus = data.filter(d => d.is_mixed === '혼합' && d.status === '사용').length;
        statsHtml = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">전체 SKU상품</div>
                <div class="stat-value">${data.length}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">사용중</div>
                <div class="stat-value">${activeSkus}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">혼합상품</div>
                <div class="stat-value">${mixedSkus}<span class="stat-unit">건</span></div>
            </div>
        </div>`;
    }
    if (def.hasInventoryView) {
        const total = data.filter(d => d.status === '사용').length;
        const lowStock = data.filter(d => {
            const cur = parseFloat(d.current_stock || d.quantity || 0);
            const min = parseFloat(d.min_stock_qty || 0);
            return min > 0 && cur < min;
        }).length;
        statsHtml = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">전체 등록</div>
                <div class="stat-value">${data.length}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">사용중</div>
                <div class="stat-value">${total}<span class="stat-unit">건</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:var(--danger)">부족재고</div>
                <div class="stat-value" style="color:var(--danger)">${lowStock}<span class="stat-unit">건</span></div>
            </div>
        </div>`;
    }
    if (def.hasHarvestCalc) {
        const activeData = data.filter(d => d.status === '사용');
        const growing = activeData.filter(d => d.house_status === '생육중').length;
        const harvesting = activeData.filter(d => d.house_status === '수확중').length;
        const idle = activeData.filter(d => d.house_status === '휴경중').length;
        const maintaining = activeData.filter(d => d.house_status === '정비중' || d.house_status === '보수중').length;
        statsHtml = `
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">전체 하우스</div>
                <div class="stat-value">${activeData.length}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:var(--success)">생육중</div>
                <div class="stat-value" style="color:var(--success)">${growing}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:var(--primary)">수확중</div>
                <div class="stat-value" style="color:var(--primary)">${harvesting}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:var(--warning)">휴경중</div>
                <div class="stat-value" style="color:var(--warning)">${idle}<span class="stat-unit">동</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color:var(--danger)">정비/보수</div>
                <div class="stat-value" style="color:var(--danger)">${maintaining}<span class="stat-unit">동</span></div>
            </div>
        </div>`;
    }

    main.innerHTML = `
        <div class="page-header">
            <div>
                <div class="page-title">${def.icon} ${def.name} 관리</div>
                <div class="page-desc">${def.description}</div>
            </div>
            <div class="page-actions">
                ${def.hasAutoTranslate ? '<button class="btn" onclick="batchTranslateKH()" id="btnBatchTranslate">🌐 캄보디아어 일괄번역</button>' : ''}
                <button class="btn btn-danger" onclick="deleteAllRecords()">🗑 전체 삭제</button>
                <button class="btn" onclick="downloadTemplate()">📥 엑셀 템플릿</button>
                <button class="btn btn-success" onclick="openExcelModal()">📤 엑셀 대량등록</button>
                <button class="btn btn-primary" onclick="openNewForm()">+ 신규 등록</button>
            </div>
        </div>
        ${statsHtml}
        <div class="filter-bar">
            <input type="text" class="search-input" id="searchInput" placeholder="검색어 입력 (코드, 이름 등)" oninput="renderTable()">
            ${currentCode === 'sku_product' ? buildSkuChannelSellerFilter() : ''}
            ${def.hasHarvestCalc ? `
            <select class="filter-select" id="houseStatusFilter" onchange="renderTable()">
                <option value="">전체 하우스상태</option>
                <option value="생육중">생육중</option>
                <option value="수확중">수확중</option>
                <option value="휴경중">휴경중</option>
                <option value="정비중">정비중</option>
                <option value="보수중">보수중</option>
            </select>` : ''}
            <select class="filter-select" id="statusFilter" onchange="renderTable()">
                <option value="">전체 상태</option>
                <option value="사용" selected>사용</option>
                <option value="정지">정지</option>
                <option value="삭제">삭제</option>
            </select>
            <select class="filter-select" id="pageSizeSelect" onchange="changePageSize(this.value)" style="width:auto;min-width:80px;">
                <option value="20"${PAGE_SIZE===20?' selected':''}>20건</option>
                <option value="25"${PAGE_SIZE===25?' selected':''}>25건</option>
                <option value="100"${PAGE_SIZE===100?' selected':''}>100건</option>
                <option value="500"${PAGE_SIZE===500?' selected':''}>500건</option>
            </select>
            <span class="record-count" id="recordCount"></span>
        </div>
        <div class="table-wrapper">
            <table class="data-table" id="dataTable"></table>
        </div>
        <div class="pagination" id="pagination"></div>
    `;

    renderTable();
}

// ===== SKU상품 판매채널/판매처 필터 =====
function buildSkuChannelSellerFilter() {
    const channels = getData('sales_channel').filter(d => d.status === '사용');
    const sellers = getData('seller').filter(d => d.status === '사용');

    let html = `<select class="filter-select" id="channelFilter" onchange="onChannelFilterChange()">
        <option value="">전체 판매채널</option>`;
    channels.forEach(ch => {
        html += `<option value="${escHtml(ch.sales_channel_id)}">${escHtml(ch.channel_name)}</option>`;
    });
    html += '</select>';

    html += `<select class="filter-select" id="sellerFilter" onchange="currentPage=1;renderTable()">
        <option value="">전체 판매처</option>`;
    sellers.forEach(s => {
        html += `<option value="${escHtml(s.seller_id)}">${escHtml(s.seller_name)}</option>`;
    });
    html += '</select>';

    return html;
}

function onChannelFilterChange() {
    const channelId = document.getElementById('channelFilter')?.value || '';
    const sellerSelect = document.getElementById('sellerFilter');
    if (!sellerSelect) return;

    const sellers = getData('seller').filter(d => d.status === '사용');
    let filtered = sellers;
    if (channelId) {
        filtered = sellers.filter(s => s.sales_channel_id === channelId);
    }

    // 판매처 드롭다운 갱신
    let html = '<option value="">전체 판매처</option>';
    filtered.forEach(s => {
        html += `<option value="${escHtml(s.seller_id)}">${escHtml(s.seller_name)}</option>`;
    });
    sellerSelect.innerHTML = html;

    currentPage = 1;
    renderTable();
}

// ===== 테이블 렌더링 =====
function renderTable() {
    const def = CODE_DEFINITIONS[currentCode];
    const allData = getData(currentCode);
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const houseStatusFilter = document.getElementById('houseStatusFilter')?.value || '';

    // SKU상품 판매채널/판매처 필터
    const channelFilter = document.getElementById('channelFilter')?.value || '';
    const sellerFilter = document.getElementById('sellerFilter')?.value || '';
    // 판매채널 필터 → 해당 채널 소속 판매처 ID 목록 구하기
    let channelSellerIds = null;
    if (channelFilter && currentCode === 'sku_product') {
        const sellers = getData('seller').filter(s => s.sales_channel_id === channelFilter);
        channelSellerIds = new Set(sellers.map(s => s.seller_id));
    }

    let filtered = allData.filter(item => {
        if (statusFilter && item.status !== statusFilter) return false;
        if (houseStatusFilter && item.house_status !== houseStatusFilter) return false;
        // 판매처 직접 선택 필터
        if (sellerFilter && item.sku_seller_id !== sellerFilter) return false;
        // 판매채널 필터 (판매처 미선택시 채널 소속 전체 판매처로 필터)
        if (channelSellerIds && !sellerFilter && !channelSellerIds.has(item.sku_seller_id)) return false;
        if (search) {
            const values = Object.values(item).join(' ').toLowerCase();
            if (!values.includes(search)) return false;
        }
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const pageData = filtered.slice(startIdx, startIdx + PAGE_SIZE);

    const columns = def.listColumns;
    const fieldMap = {};
    def.fields.forEach(f => fieldMap[f.key] = f);

    const table = document.getElementById('dataTable');
    let html = '<thead><tr>';
    columns.forEach(col => {
        const f = fieldMap[col];
        html += `<th>${f ? f.label : col}</th>`;
    });
    html += '<th style="width:120px">작업</th></tr></thead><tbody>';

    if (pageData.length === 0) {
        html += `<tr><td colspan="${columns.length + 1}" style="text-align:center;padding:40px;color:var(--gray-400)">등록된 데이터가 없습니다</td></tr>`;
    } else {
        pageData.forEach(item => {
            html += '<tr>';
            columns.forEach(col => {
                let val = item[col] || '';
                if (col === 'status') {
                    const cls = val === '사용' || val === '재직' ? 'badge-active' :
                                val === '정지' || val === '휴직' ? 'badge-inactive' : 'badge-deleted';
                    val = `<span class="badge ${cls}">${val}</span>`;
                }
                // ref_select 필드인 경우 참조 이름 표시
                const fieldDef = fieldMap[col];
                if (fieldDef && fieldDef.type === 'ref_select' && val) {
                    const refItems = getData(fieldDef.refCode);
                    const refItem = refItems.find(r => r[fieldDef.refIdField] === val);
                    if (refItem) val = refItem[fieldDef.refNameField] || val;
                }
                if (col === 'house_status') {
                    const cls = val === '수확중' ? 'badge-active' :
                                val === '생육중' ? 'badge-active' :
                                val === '휴경중' ? 'badge-inactive' :
                                val === '정비중' || val === '보수중' ? 'badge-deleted' : '';
                    if (cls) val = `<span class="badge ${cls}">${val}</span>`;
                }
                const f = fieldMap[col];
                if (f && f.type === 'number' && val !== '' && typeof val !== 'object') {
                    val = Number(val).toLocaleString();
                }
                html += `<td title="${item[col] || ''}">${val}</td>`;
            });
            const idField = def.fields[0].key;
            const id = item[idField];
            html += `<td class="td-actions">
                <button class="btn btn-sm" onclick="showQr('${id}')">QR</button>
                <button class="btn btn-sm" onclick="openEditForm('${id}')">수정</button>
                <button class="btn btn-sm btn-danger" onclick="deleteRecord('${id}')">삭제</button>
            </td></tr>`;
        });
    }
    html += '</tbody>';
    table.innerHTML = html;

    document.getElementById('recordCount').textContent = `총 ${filtered.length}건`;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pag = document.getElementById('pagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }

    let html = `<button ${currentPage <= 1 ? 'disabled' : ''} onclick="goPage(${currentPage - 1})">◀</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
            if (i === 2 || i === totalPages - 1) html += '<span class="page-info">...</span>';
            continue;
        }
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    html += `<button ${currentPage >= totalPages ? 'disabled' : ''} onclick="goPage(${currentPage + 1})">▶</button>`;
    pag.innerHTML = html;
}

function goPage(p) {
    currentPage = p;
    renderTable();
}

// ===== 모달: 신규등록 =====
function openNewForm() {
    editingId = null;
    const def = CODE_DEFINITIONS[currentCode];
    document.getElementById('modalTitle').textContent = `${def.icon} ${def.name} 신규 등록`;
    applyModalSize(def);
    renderForm({});
    document.getElementById('modalOverlay').style.display = 'flex';
}

// ===== 모달: 수정 =====
function openEditForm(id) {
    const def = CODE_DEFINITIONS[currentCode];
    const data = getData(currentCode);
    const idField = def.fields[0].key;
    const record = data.find(d => d[idField] === id);
    if (!record) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = `${def.icon} ${def.name} 수정 - ${id}`;
    applyModalSize(def);
    renderForm(record);
    document.getElementById('modalOverlay').style.display = 'flex';
}

// ===== 폼 렌더링 =====
function renderForm(record) {
    const def = CODE_DEFINITIONS[currentCode];
    const isNew = !editingId;
    const fieldMap = {};
    def.fields.forEach(f => fieldMap[f.key] = f);

    let html = '';

    if (def.fieldSections) {
        def.fieldSections.forEach(section => {
            html += `<div class="form-section">
                <h4 style="margin:16px 0 8px;padding-bottom:6px;border-bottom:2px solid var(--primary-light);color:var(--primary);font-size:13px;">${section.title}</h4>
                <div class="form-grid">`;
            section.fields.forEach(key => {
                const field = fieldMap[key];
                if (field) html += renderFieldHtml(field, record, isNew);
            });
            html += '</div></div>';
        });
    } else {
        html += '<div class="form-grid">';
        def.fields.forEach(field => {
            html += renderFieldHtml(field, record, isNew);
        });
        html += '</div>';
    }

    document.getElementById('modalBody').innerHTML = html;

    if (def.hasHarvestCalc) {
        bindHarvestCalcEvents();
    }
    if (def.hasAutoTranslate) {
        bindAutoTranslate();
    }
    if (def.hasSkuMasterItems) {
        bindSkuEvents();
    }
    // 마스터상품 신규등록: 상품명→코드 자동생성 바인딩
    if (currentCode === 'master_product' && !editingId) {
        bindMasterProductIdAuto();
    }
}

function renderFieldHtml(field, record, isNew) {
    const rawVal = (record[field.key] !== undefined && record[field.key] !== null && record[field.key] !== '') ? record[field.key] : (field.default || '');
    const val = String(rawVal);
    const isAuto = field.auto && isNew;
    const isComputed = field.computed;
    const reqMark = field.required ? '<span class="required">*</span>' : '';
    const fullClass = field.type === 'textarea' || field.type === 'unit_system' || field.type === 'mapping_actions' || field.type === 'change_history' || field.type === 'sku_master_items' || field.type === 'sku_gift_items' ? 'full-width' : '';

    // hidden 필드는 렌더링하지 않음 (데이터 저장용)
    if (field.type === 'hidden') return '';

    // ── 단위코드 시스템 (마스터상품 전용) ──
    if (field.type === 'unit_system') {
        return renderUnitSystemHtml(record);
    }

    // ── SKU 마스터상품 동적 행 ──
    if (field.type === 'sku_master_items') {
        return renderSkuMasterItemsHtml(record, isNew);
    }
    // ── SKU 증정상품 동적 행 ──
    if (field.type === 'sku_gift_items') {
        return renderSkuGiftItemsHtml(record, isNew);
    }

    // ── 매핑 액션 버튼 ──
    if (field.type === 'mapping_actions') {
        return renderMappingActionsHtml(record, isNew);
    }

    // ── 변경이력 버튼 ──
    if (field.type === 'change_history') {
        if (isNew) return '';
        const def = CODE_DEFINITIONS[currentCode];
        const idField = def.fields[0].key;
        const itemId = record[idField] || '';
        return `<div class="form-group full-width" style="margin-top:8px;">
            <button type="button" class="btn" onclick="showChangeHistory('${itemId}')" style="width:100%;">📋 변경이력 조회</button>
        </div>`;
    }

    let html = `<div class="form-group ${fullClass}">`;
    html += `<label class="form-label">${field.label}${reqMark}</label>`;

    if (isAuto) {
        if (currentCode === 'master_product') {
            // 마스터상품: 상품명 입력시 초성 기반 코드 자동생성
            html += `<input type="text" class="form-control" name="${field.key}" value="" disabled placeholder="상품명 입력시 자동생성 (GTP-초성-순번)" style="background:#e8effc;font-weight:600;">`;
        } else {
            const autoId = generateId(currentCode);
            html += `<input type="text" class="form-control" name="${field.key}" value="${escHtml(autoId)}" disabled>`;
        }
    } else if (!isNew && field.auto) {
        // 수정모드: 자동생성 ID는 읽기전용으로 표시
        html += `<input type="text" class="form-control" name="${field.key}" value="${escHtml(val)}" readonly style="background:#f0f0f0;font-weight:600;">`;
    } else if (field.type === 'notice') {
        html += `<div style="background:var(--gray-50);border:1px dashed var(--gray-300);border-radius:6px;padding:12px;font-size:12px;color:var(--gray-500);white-space:pre-line;grid-column:1/-1;">${field.noticeText}</div>`;
        html += '</div>';
        return html;
    } else if (isComputed) {
        html += `<input type="text" class="form-control" name="${field.key}" value="${escHtml(val)}" disabled style="background:#e8effc;font-weight:600;color:var(--primary);">`;
    } else if (field.type === 'select') {
        // 공통코드에서 동적으로 옵션 로드
        const groupId = findGroupIdByField(currentCode, field.key);
        let options = field.options || [];
        if (groupId) {
            const dynamicValues = getCodeValues(groupId);
            if (dynamicValues.length > 0) options = dynamicValues;
        }

        html += '<div class="select-with-add">';
        html += `<select class="form-control" name="${field.key}">`;
        if (!field.required) html += '<option value="">선택</option>';
        options.forEach(opt => {
            html += `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`;
        });
        html += '</select>';
        if (groupId) {
            html += `<button type="button" class="btn-add-code" onclick="addCodeInline('${groupId}','${field.key}')" title="새 항목 추가">+신규</button>`;
        }
        html += '</div>';
    } else if (field.type === 'ref_select') {
        // 등록된 데이터에서 드롭다운 + 신규 버튼
        const allRefData = getData(field.refCode);
        const refData = allRefData.filter(d => d.status === '사용' || d.status === '재직');
        html += '<div class="select-with-add">';
        html += `<select class="form-control" name="${field.key}">`;
        html += '<option value="">선택</option>';
        // 기존 선택값이 활성 목록에 없으면 별도 표시 (삭제/정지된 참조)
        let existingFound = false;
        refData.forEach(d => {
            const id = d[field.refIdField];
            const name = d[field.refNameField] || id;
            if (val === id) existingFound = true;
            html += `<option value="${escHtml(id)}" ${val === id ? 'selected' : ''}>${escHtml(name)} (${escHtml(id)})</option>`;
        });
        if (val && !existingFound) {
            const oldRef = allRefData.find(d => d[field.refIdField] === val);
            const oldName = oldRef ? (oldRef[field.refNameField] || val) : val;
            html += `<option value="${escHtml(val)}" selected style="color:#e74c3c;">${escHtml(oldName)} (${escHtml(val)}) [비활성]</option>`;
        }
        html += '</select>';
        html += `<button type="button" class="btn-add-code" onclick="quickAddRef('${field.refCode}','${field.key}')" title="새 ${field.label} 등록">+신규</button>`;
        html += '</div>';
    } else if (field.type === 'multi_ref') {
        // 복수 선택 태그 UI + 신규 버튼
        return renderMultiRefHtml(field, record);
    } else if (field.type === 'textarea') {
        html += `<textarea class="form-control" name="${field.key}">${escHtml(val)}</textarea>`;
    } else if (field.type === 'ref') {
        html += `<input type="text" class="form-control" name="${field.key}" value="${escHtml(val)}" placeholder="${field.label} 입력">`;
    } else {
        const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : field.type === 'password' ? 'password' : 'text';
        html += `<input type="${inputType}" class="form-control" name="${field.key}" value="${escHtml(val)}" ${field.type === 'number' ? 'step="any"' : ''}>`;
    }
    if (field.hint) html += `<span class="form-hint">${field.hint}</span>`;
    html += '</div>';
    return html;
}

// ===== 단위코드 시스템 렌더링 (마스터상품 전용) =====
const UNIT_CODES = [
    { id: 'kg',      label: 'kg단위',     desc: '기본 kg 단위' },
    { id: 'box',     label: '박스단위',    desc: '박스 포장 단위' },
    { id: 'pack',    label: '팩단위',      desc: '팩 포장 단위' },
    { id: 'tonbag',  label: '톤백단위',    desc: '톤백 대량 단위' },
    { id: 'pallet',  label: '파레트단위',  desc: '파레트 물류 단위' },
];

function renderUnitSystemHtml(record) {
    let html = `<div class="form-group full-width">
        <label class="form-label">단위코드 선택 <span class="form-hint" style="display:inline;">(중복 선택 가능, 선택 시 중량 입력란 자동 추가)</span></label>
        <div class="unit-system-wrapper">`;

    UNIT_CODES.forEach(u => {
        const useKey = 'use_unit_' + u.id;
        const weightKey = 'weight_unit_' + u.id;
        const isUsed = record[useKey] === 'Y';
        const weightVal = record[weightKey] || '';

        html += `
        <div class="unit-row" id="unitRow_${u.id}">
            <label class="unit-check">
                <input type="checkbox" name="${useKey}" value="Y" ${isUsed ? 'checked' : ''} onchange="toggleUnitWeight('${u.id}')">
                <span class="unit-check-label">${u.label}</span>
            </label>
            <div class="unit-weight-input" id="unitWeight_${u.id}" style="${isUsed ? '' : 'display:none;'}">
                <input type="number" class="form-control" name="${weightKey}" value="${escHtml(weightVal)}" step="any" placeholder="중량(kg)" style="width:120px;">
                <span class="form-hint">kg 기준 (소수점 가능)</span>
            </div>
        </div>`;
    });

    html += `</div></div>`;
    return html;
}

function toggleUnitWeight(unitId) {
    const checkbox = document.querySelector(`[name="use_unit_${unitId}"]`);
    const weightDiv = document.getElementById('unitWeight_' + unitId);
    if (checkbox && weightDiv) {
        weightDiv.style.display = checkbox.checked ? '' : 'none';
        if (!checkbox.checked) {
            const weightInput = weightDiv.querySelector('input');
            if (weightInput) weightInput.value = '';
        }
    }
}

// ===== SKU 마스터상품 동적 행 렌더링 =====
function renderSkuMasterItemsHtml(record, isNew) {
    let items = [];
    try { items = JSON.parse(record.master_items_json || '[]'); } catch(e) {}
    const isMixed = record.is_mixed === '혼합';
    const mixedCount = parseInt(record.mixed_count) || (isMixed ? 2 : 1);
    const rowCount = isMixed ? Math.max(mixedCount, 1) : 1;

    // 행 개수에 맞게 items 배열 조정
    while (items.length < rowCount) items.push({});
    if (items.length > rowCount) items = items.slice(0, rowCount);

    const masterData = getData('master_product').filter(d => d.status === '사용');
    const pkgData = getData('package_material').filter(d => d.status === '사용');
    const pkgTypes = getSkuPkgTypeOptions();

    let html = `<div class="form-group full-width">
        <label class="form-label">마스터상품 연결 <span class="form-hint" style="display:inline;">(${isMixed ? '혼합: ' + rowCount + '개 상품' : '단독: 1개 상품'})</span></label>
        <div id="skuMasterItemsContainer">`;

    for (let i = 0; i < rowCount; i++) {
        const item = items[i] || {};
        html += renderSkuItemRow(i, item, masterData, pkgData, pkgTypes, 'master');
    }

    html += `</div></div>`;
    return html;
}

function renderSkuGiftItemsHtml(record, isNew) {
    const hasGift = record.has_gift === 'Y';
    if (!hasGift) {
        return `<div class="form-group full-width" id="skuGiftItemsWrapper" style="display:none;">
            <div id="skuGiftItemsContainer"></div>
        </div>`;
    }

    let items = [];
    try { items = JSON.parse(record.gift_items_json || '[]'); } catch(e) {}
    const giftCount = parseInt(record.gift_count) || 1;
    while (items.length < giftCount) items.push({});
    if (items.length > giftCount) items = items.slice(0, giftCount);

    const masterData = getData('master_product').filter(d => d.status === '사용');
    const pkgData = getData('package_material').filter(d => d.status === '사용');
    const pkgTypes = getSkuPkgTypeOptions();

    let html = `<div class="form-group full-width" id="skuGiftItemsWrapper">
        <label class="form-label">증정상품 연결 <span class="form-hint" style="display:inline;">(${giftCount}개 상품)</span></label>
        <div id="skuGiftItemsContainer">`;

    for (let i = 0; i < giftCount; i++) {
        const item = items[i] || {};
        html += renderSkuItemRow(i, item, masterData, pkgData, pkgTypes, 'gift');
    }

    html += `</div></div>`;
    return html;
}

function getSkuPkgTypeOptions() {
    const groupId = findGroupIdByField('sku_product', 'sku_package_type');
    if (groupId) {
        const vals = getCodeValues(groupId);
        if (vals.length > 0) return vals;
    }
    return ['봉지','박스','팩','트레이','기타'];
}

function renderSkuItemRow(idx, item, masterData, pkgData, pkgTypes, prefix) {
    const p = prefix + '_' + idx;
    const masterName = item.master_product_name || '';
    const masterId = item.master_product_id || '';
    const inputW = item.input_weight || '';
    const extraPct = item.extra_weight_pct || '';
    const extraW = item.extra_weight || '';
    const outputW = item.output_weight || '';
    const pkgType = item.package_type || '';
    const pkgMatId = item.package_material_id || '';
    const pkgBoxId = item.package_box_id || '';
    const boxQty = item.box_input_qty || '';

    // 포장자재 필터: 포장팩 등
    const pkgMaterials = pkgData.filter(d => d.category !== '박스');
    const pkgBoxes = pkgData.filter(d => d.category === '박스');

    // 마스터상품 참조 - 기존 선택값이 활성 목록에 없으면 별도 표시
    let masterFound = false;
    let masterOptionsHtml = '<option value="">선택</option>';
    masterData.forEach(d => {
        if (masterId === d.master_product_id) masterFound = true;
        masterOptionsHtml += `<option value="${escHtml(d.master_product_id)}" ${masterId === d.master_product_id ? 'selected' : ''}>${escHtml(d.product_name_kr)}</option>`;
    });
    if (masterId && !masterFound) {
        masterOptionsHtml += `<option value="${escHtml(masterId)}" selected>${escHtml(masterName || masterId)} [비활성]</option>`;
    }

    // 포장자재/박스 참조 - 기존 선택값 보존
    let pkgMatFound = false, pkgBoxFound = false;

    let html = `<div class="sku-item-row" id="skuRow_${p}" data-prefix="${p}">
        <div class="sku-item-header">
            <span class="sku-item-num">${prefix === 'master' ? '마스터상품' : '증정상품'} ${idx + 1}</span>
        </div>
        <div class="sku-item-fields">
            <div class="sku-field-group">
                <label>마스터상품명</label>
                <div class="select-with-add">
                    <select class="form-control" name="${p}_master_id" onchange="onSkuMasterSelect('${p}')">
                        ${masterOptionsHtml}
                    </select>
                    <button type="button" class="btn-add-code" onclick="quickAddRef('master_product','${p}_master_id')" title="마스터상품 신규등록">+신규</button>
                </div>
            </div>
            <div class="sku-field-group">
                <label>마스터코드</label>
                <input type="text" class="form-control" name="${p}_master_code" value="${escHtml(masterId)}" disabled style="background:#f0f0f0;">
            </div>
            <div class="sku-field-group">
                <label>입수중량</label>
                <input type="number" class="form-control" name="${p}_input_weight" value="${escHtml(inputW)}" step="any" placeholder="g" oninput="calcSkuExtraWeight('${p}')">
            </div>
            <div class="sku-field-group">
                <label>추가중량 %</label>
                <input type="number" class="form-control" name="${p}_extra_pct" value="${escHtml(extraPct)}" step="any" placeholder="%" oninput="calcSkuExtraWeight('${p}')">
            </div>
            <div class="sku-field-group">
                <label>추가중량 (자동계산)</label>
                <input type="number" class="form-control" name="${p}_extra_weight" value="${escHtml(extraW)}" disabled style="background:#e8effc;font-weight:600;">
            </div>
            <div class="sku-field-group">
                <label>출고중량</label>
                <input type="number" class="form-control" name="${p}_output_weight" value="${escHtml(outputW)}" step="any" placeholder="g">
            </div>
        </div>
        <div class="sku-item-note">재고, 출고관리에 반영</div>
        <div class="sku-item-packaging">
            <div class="sku-field-group">
                <label>포장형태</label>
                <div class="select-with-add">
                    <select class="form-control" name="${p}_pkg_type">
                        <option value="">선택</option>`;
    pkgTypes.forEach(opt => {
        html += `<option value="${escHtml(opt)}" ${pkgType === opt ? 'selected' : ''}>${escHtml(opt)}</option>`;
    });
    html += `</select>
                    <button type="button" class="btn-add-code" onclick="addCodeInline('SKU_PKG_TYPE','${p}_pkg_type')" title="포장형태 추가">+신규</button>
                </div>
            </div>
            <div class="sku-field-group">
                <label>포장자재</label>
                <div class="select-with-add">
                    <select class="form-control" name="${p}_pkg_material">
                        <option value="">선택</option>`;
    pkgMaterials.forEach(d => {
        if (pkgMatId === d.package_id) pkgMatFound = true;
        html += `<option value="${escHtml(d.package_id)}" ${pkgMatId === d.package_id ? 'selected' : ''}>${escHtml(d.package_name)}</option>`;
    });
    if (pkgMatId && !pkgMatFound) {
        html += `<option value="${escHtml(pkgMatId)}" selected>${escHtml(pkgMatId)} [비활성]</option>`;
    }
    html += `</select>
                    <button type="button" class="btn-add-code" onclick="quickAddRef('package_material','${p}_pkg_material')" title="포장자재 신규등록">+신규</button>
                </div>
            </div>
            <div class="sku-field-group">
                <label>포장박스</label>
                <div class="select-with-add">
                    <select class="form-control" name="${p}_pkg_box">
                        <option value="">선택</option>`;
    pkgBoxes.forEach(d => {
        if (pkgBoxId === d.package_id) pkgBoxFound = true;
        html += `<option value="${escHtml(d.package_id)}" ${pkgBoxId === d.package_id ? 'selected' : ''}>${escHtml(d.package_name)}</option>`;
    });
    if (pkgBoxId && !pkgBoxFound) {
        html += `<option value="${escHtml(pkgBoxId)}" selected>${escHtml(pkgBoxId)} [비활성]</option>`;
    }
    html += `</select>
                    <button type="button" class="btn-add-code" onclick="quickAddRef('package_material','${p}_pkg_box')" title="포장박스 신규등록">+신규</button>
                </div>
            </div>
            <div class="sku-field-group">
                <label>박스입수량</label>
                <input type="number" class="form-control" name="${p}_box_qty" value="${escHtml(boxQty)}" step="1" placeholder="개">
            </div>
        </div>
    </div>`;
    return html;
}

// 마스터상품 선택시 코드 자동 반영
function onSkuMasterSelect(prefix) {
    const form = document.getElementById('modalBody');
    const select = form.querySelector(`[name="${prefix}_master_id"]`);
    const codeInput = form.querySelector(`[name="${prefix}_master_code"]`);
    if (select && codeInput) {
        codeInput.value = select.value;
    }
}

// 추가중량 자동계산: 입수중량 * 추가중량% / 100
function calcSkuExtraWeight(prefix) {
    const form = document.getElementById('modalBody');
    const inputW = parseFloat(form.querySelector(`[name="${prefix}_input_weight"]`)?.value) || 0;
    const extraPct = parseFloat(form.querySelector(`[name="${prefix}_extra_pct"]`)?.value) || 0;
    const extraWeightField = form.querySelector(`[name="${prefix}_extra_weight"]`);
    if (extraWeightField) {
        const calc = Math.round(inputW * extraPct / 100 * 100) / 100;
        extraWeightField.value = calc || '';
    }
}

// SKU 혼합상품 여부/개수 변경 이벤트
function onSkuMixedChange() {
    const form = document.getElementById('modalBody');
    const isMixed = form.querySelector('[name="is_mixed"]')?.value === '혼합';
    const countInput = form.querySelector('[name="mixed_count"]');
    if (countInput) {
        countInput.closest('.form-group').style.display = isMixed ? '' : 'none';
        if (!isMixed) countInput.value = '';
    }
    rebuildSkuMasterRows();
}

function onSkuMixedCountChange() {
    rebuildSkuMasterRows();
}

function rebuildSkuMasterRows() {
    const form = document.getElementById('modalBody');
    const isMixed = form.querySelector('[name="is_mixed"]')?.value === '혼합';
    const count = isMixed ? (parseInt(form.querySelector('[name="mixed_count"]')?.value) || 2) : 1;

    // 현재 행 데이터 수집
    const currentItems = collectSkuItems('master');
    while (currentItems.length < count) currentItems.push({});

    const container = document.getElementById('skuMasterItemsContainer');
    if (!container) return;

    const masterData = getData('master_product').filter(d => d.status === '사용');
    const pkgData = getData('package_material').filter(d => d.status === '사용');
    const pkgTypes = getSkuPkgTypeOptions();

    let html = '';
    for (let i = 0; i < count; i++) {
        html += renderSkuItemRow(i, currentItems[i] || {}, masterData, pkgData, pkgTypes, 'master');
    }
    container.innerHTML = html;
}

// 증정상품 여부/개수 변경 이벤트
function onSkuGiftChange() {
    const form = document.getElementById('modalBody');
    const hasGift = form.querySelector('[name="has_gift"]')?.value === 'Y';
    const countInput = form.querySelector('[name="gift_count"]');
    const wrapper = document.getElementById('skuGiftItemsWrapper');

    if (countInput) {
        countInput.closest('.form-group').style.display = hasGift ? '' : 'none';
        if (!hasGift) countInput.value = '';
    }
    if (wrapper) {
        wrapper.style.display = hasGift ? '' : 'none';
    }
    if (hasGift) rebuildSkuGiftRows();
}

function onSkuGiftCountChange() {
    rebuildSkuGiftRows();
}

function rebuildSkuGiftRows() {
    const form = document.getElementById('modalBody');
    const count = parseInt(form.querySelector('[name="gift_count"]')?.value) || 1;

    const currentItems = collectSkuItems('gift');
    while (currentItems.length < count) currentItems.push({});

    const container = document.getElementById('skuGiftItemsContainer');
    if (!container) return;

    const masterData = getData('master_product').filter(d => d.status === '사용');
    const pkgData = getData('package_material').filter(d => d.status === '사용');
    const pkgTypes = getSkuPkgTypeOptions();

    let html = '';
    for (let i = 0; i < count; i++) {
        html += renderSkuItemRow(i, currentItems[i] || {}, masterData, pkgData, pkgTypes, 'gift');
    }
    container.innerHTML = html;
}

// SKU 행 데이터 수집
function collectSkuItems(prefix) {
    const form = document.getElementById('modalBody');
    if (!form) return [];
    const items = [];
    let idx = 0;
    while (true) {
        const p = prefix + '_' + idx;
        const masterSelect = form.querySelector(`[name="${p}_master_id"]`);
        if (!masterSelect) break;
        const selText = masterSelect.options[masterSelect.selectedIndex]?.text || '';
        items.push({
            master_product_id: masterSelect.value || '',
            master_product_name: selText.replace(/ \[비활성\]$/, ''),
            input_weight: form.querySelector(`[name="${p}_input_weight"]`)?.value || '',
            extra_weight_pct: form.querySelector(`[name="${p}_extra_pct"]`)?.value || '',
            extra_weight: form.querySelector(`[name="${p}_extra_weight"]`)?.value || '',
            output_weight: form.querySelector(`[name="${p}_output_weight"]`)?.value || '',
            package_type: form.querySelector(`[name="${p}_pkg_type"]`)?.value || '',
            package_material_id: form.querySelector(`[name="${p}_pkg_material"]`)?.value || '',
            package_box_id: form.querySelector(`[name="${p}_pkg_box"]`)?.value || '',
            box_input_qty: form.querySelector(`[name="${p}_box_qty"]`)?.value || '',
        });
        idx++;
    }
    return items;
}

// SKU 이벤트 바인딩
function bindSkuEvents() {
    const form = document.getElementById('modalBody');
    if (!form) return;

    const mixedSelect = form.querySelector('[name="is_mixed"]');
    if (mixedSelect) {
        mixedSelect.addEventListener('change', onSkuMixedChange);
        // 초기 상태 설정
        const isMixed = mixedSelect.value === '혼합';
        const countInput = form.querySelector('[name="mixed_count"]');
        if (countInput) countInput.closest('.form-group').style.display = isMixed ? '' : 'none';
    }

    const mixedCountInput = form.querySelector('[name="mixed_count"]');
    if (mixedCountInput) mixedCountInput.addEventListener('change', onSkuMixedCountChange);

    const giftSelect = form.querySelector('[name="has_gift"]');
    if (giftSelect) {
        giftSelect.addEventListener('change', onSkuGiftChange);
        const hasGift = giftSelect.value === 'Y';
        const giftCountInput = form.querySelector('[name="gift_count"]');
        if (giftCountInput) giftCountInput.closest('.form-group').style.display = hasGift ? '' : 'none';
        const wrapper = document.getElementById('skuGiftItemsWrapper');
        if (wrapper) wrapper.style.display = hasGift ? '' : 'none';
    }

    const giftCountInput = form.querySelector('[name="gift_count"]');
    if (giftCountInput) giftCountInput.addEventListener('change', onSkuGiftCountChange);
}

// ===== 매핑 액션 버튼 렌더링 =====
function renderMappingActionsHtml(record, isNew) {
    if (isNew) {
        return `<div class="form-group full-width">
            <div style="background:var(--gray-50);border:1px dashed var(--gray-300);border-radius:6px;padding:12px;text-align:center;color:var(--gray-400);font-size:12px;">
                상품 저장 후 SKU 매핑을 등록할 수 있습니다.
            </div>
        </div>`;
    }

    const productId = record.master_product_id || '';
    const mappings = getData('product_mapping').filter(m => m.master_product_id === productId && m.status === '사용');
    const mappingCount = mappings.length;

    let mappingListHtml = '';
    if (mappingCount > 0) {
        mappingListHtml = `<div style="margin-top:8px;"><table class="data-table" style="font-size:11px;">
            <thead><tr><th>SKU코드</th><th>환산비율</th><th>중량(g)</th><th>상태</th></tr></thead><tbody>`;
        mappings.forEach(m => {
            mappingListHtml += `<tr><td>${m.sku_id}</td><td>${m.conversion_rate || ''}</td><td>${m.mapping_weight_g || ''}</td><td><span class="badge badge-active">${m.status}</span></td></tr>`;
        });
        mappingListHtml += '</tbody></table></div>';
    }

    return `<div class="form-group full-width">
        <div style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="btn" onclick="showMappingList('${productId}')">📋 매핑내역 보기 (${mappingCount}건)</button>
            <button type="button" class="btn btn-primary" onclick="openMappingRegister('${productId}')">+ 매핑등록</button>
        </div>
        ${mappingListHtml}
    </div>`;
}

// ===== 매핑내역 보기 =====
function showMappingList(productId) {
    const mappings = getData('product_mapping').filter(m => m.master_product_id === productId);
    if (mappings.length === 0) {
        alert('등록된 매핑이 없습니다.');
        return;
    }
    let msg = `[${productId}] 매핑내역 (${mappings.length}건)\n\n`;
    mappings.forEach(m => {
        msg += `SKU: ${m.sku_id} | 환산: ${m.conversion_rate || '-'} | 중량: ${m.mapping_weight_g || '-'}g | ${m.status}\n`;
    });
    alert(msg);
}

// ===== 매핑등록 (마스터-SKU 매핑 화면으로 이동) =====
function openMappingRegister(productId) {
    closeModal();
    switchModule('system');
    setTimeout(() => {
        navigateTo('product_mapping');
        setTimeout(() => {
            openNewForm();
            setTimeout(() => {
                const el = document.querySelector('[name="master_product_id"]');
                if (el) el.value = productId;
            }, 100);
        }, 100);
    }, 100);
}

// ===== 변경이력 조회 (팝업) =====
function showChangeHistory(productId) {
    const history = JSON.parse(localStorage.getItem('gtp_change_history_' + productId) || '[]');
    if (history.length === 0) {
        alert(`[${productId}] 변경이력이 없습니다.\n\n(저장 시 자동으로 변경이력이 기록됩니다.)`);
        return;
    }
    let msg = `[${productId}] 변경이력\n${'─'.repeat(40)}\n\n`;
    history.forEach(h => {
        msg += `${h.date} | ${h.user} | ${h.field}: ${h.old_value} → ${h.new_value}\n`;
    });
    alert(msg);
}

// ===== 변경이력 저장 (마스터상품 수정시) =====
function saveChangeHistory(productId, oldRecord, newRecord) {
    const def = CODE_DEFINITIONS[currentCode];
    const history = JSON.parse(localStorage.getItem('gtp_change_history_' + productId) || '[]');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    def.fields.forEach(field => {
        if (field.type === 'hidden' || field.type === 'unit_system' || field.type === 'mapping_actions' || field.type === 'change_history' || field.type === 'sku_master_items' || field.type === 'sku_gift_items') return;
        const oldVal = oldRecord[field.key] || '';
        const newVal = newRecord[field.key] || '';
        if (oldVal !== newVal) {
            history.push({
                date: now,
                user: 'Admin',
                field: field.label,
                old_value: oldVal || '(없음)',
                new_value: newVal || '(없음)',
            });
        }
    });

    localStorage.setItem('gtp_change_history_' + productId, JSON.stringify(history));
    saveToFirestore('change_history_' + productId, history);
}

// ===== 자동번역 (한국어 → 캄보디아어/크메르어) =====

// 로컬 사전 (오프라인 폴백용 + API 결과 캐시)
const KR_TO_KH_MAP = {
    '적상추': 'សាឡាដក្រហម', '청상추': 'សាឡាដបៃតង', '쌈배추': 'បន្លែសម',
    '깻잎': 'ស្លឹកម្រះ', '로메인': 'រ៉ូមែន', '청경채': 'ស្ពៃចិន',
    '시금치': 'ស្ពៃនាគ', '쑥갓': 'ឈុក្កាត់', '부추': 'គូឆៃ',
    '당근': 'ការ៉ុត', '양배추': 'ស្ពៃក្ដោប', '브로콜리': 'ប្រូកូលី',
    '파프리카': 'ម្ទេសប៉េស៊ី', '오이': 'ត្រសក់', '토마토': 'ប៉េងប៉ោះ',
    '고추': 'ម្ទេស', '대파': 'គូឆៃធំ', '양파': 'ខ្ទឹមបារាំង',
    '감자': 'ដំឡូងបារាំង', '고구마': 'ដំឡូងជ្វា', '무': 'ឆៃថាវ',
    '배추': 'ស្ពៃសា', '마늘': 'ខ្ទឹមស', '생강': 'ខ្ញី',
    '상추': 'សាឡាដ', '케일': 'កាឡេ', '미나리': 'ម៉ាណារី',
    '셀러리': 'សេឡឺរី', '콩나물': 'បន្ទង់សណ្ដែក', '숙주': 'បន្ទង់',
    '바질': 'ជីរបារាំង', '파슬리': 'ប៉ារស្លី', '딸기': 'ផ្លែស្ត្របឺរី',
    '수박': 'ឪឡឹក', '참외': 'ដោះគោ', '멜론': 'ម៉េឡុង',
    '호박': 'ល្ពៅ', '가지': 'ត្រប់', '피망': 'ម្ទេសប៉េស៊ី',
    '옥수수': 'ពោត', '감귤': 'ក្រូចពោធិ៍សាត់', '사과': 'ប៉ោម',
    '포도': 'ទំពាំងបាយជូរ', '배': 'សាលី', '레몬': 'ក្រូចឆ្មារ',
};

// localStorage에 번역 캐시 저장
function getTranslationCache() {
    return JSON.parse(localStorage.getItem('gtp_translation_cache') || '{}');
}
function setTranslationCache(cache) {
    localStorage.setItem('gtp_translation_cache', JSON.stringify(cache));
    saveToFirestore('translation_cache', cache);
}

// 1단계: 로컬 사전 조회
function localTranslateKH(koreanName) {
    if (KR_TO_KH_MAP[koreanName]) return KR_TO_KH_MAP[koreanName];
    for (const [kr, kh] of Object.entries(KR_TO_KH_MAP)) {
        if (koreanName.includes(kr)) return kh;
    }
    // 캐시 조회
    const cache = getTranslationCache();
    if (cache[koreanName]) return cache[koreanName];
    return null;
}

// 2단계: MyMemory 무료 번역 API (한국어→크메르어)
async function apiTranslateKH(koreanName) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(koreanName)}&langpair=ko|km`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translated = data.responseData.translatedText;
            // 번역 실패 케이스 필터 (원문 그대로 반환되는 경우)
            if (translated === koreanName || translated.match(/^[a-zA-Z\s]+$/)) return null;
            // 캐시 저장
            const cache = getTranslationCache();
            cache[koreanName] = translated;
            setTranslationCache(cache);
            return translated;
        }
        return null;
    } catch (e) {
        console.warn('번역 API 호출 실패:', e);
        return null;
    }
}

// 통합 번역 함수 (로컬 → API → 실패)
async function translateToKH(koreanName) {
    // 1. 로컬 사전 / 캐시
    const local = localTranslateKH(koreanName);
    if (local) return local;
    // 2. API 호출
    const api = await apiTranslateKH(koreanName);
    return api;
}

function bindAutoTranslate() {
    const form = document.getElementById('modalBody');
    const krInput = form?.querySelector('[name="product_name_kr"]');
    const khInput = form?.querySelector('[name="product_name_kh"]');
    if (!krInput || !khInput) return;

    krInput.addEventListener('blur', async () => {
        const koreanName = krInput.value.trim();
        if (!koreanName) return;
        // 이미 캄보디아어가 입력되어 있으면 건너뜀
        if (khInput.value.trim()) return;

        // 번역 중 표시
        khInput.value = '번역 중...';
        khInput.disabled = true;

        const translated = await translateToKH(koreanName);
        khInput.disabled = false;

        if (translated) {
            khInput.value = translated;
        } else {
            khInput.value = '';
            khInput.placeholder = '자동번역 실패 - 직접 입력하세요';
        }
    });
}

// ===== 캄보디아어 일괄번역 =====
async function batchTranslateKH() {
    const data = getData('master_product');
    const needTranslation = data.filter(d => d.product_name_kr && !d.product_name_kh && d.status !== '삭제');

    if (needTranslation.length === 0) {
        // 이미 번역된 것도 표시
        const translated = data.filter(d => d.product_name_kh);
        if (translated.length > 0) {
            let msg = `모든 상품이 이미 번역되어 있습니다.\n\n번역 현황 (${translated.length}건):\n`;
            translated.forEach(d => { msg += `  ${d.product_name_kr} → ${d.product_name_kh}\n`; });
            alert(msg);
        } else {
            alert('번역할 상품이 없습니다. 먼저 마스터상품을 등록하세요.');
        }
        return;
    }

    const btn = document.getElementById('btnBatchTranslate');
    const totalCount = needTranslation.length;
    if (!confirm(`캄보디아어 미등록 상품 ${totalCount}건을 일괄 번역합니다.\n\n대상:\n${needTranslation.map(d => '  - ' + d.product_name_kr).join('\n')}\n\n진행하시겠습니까?`)) return;

    btn.disabled = true;
    btn.textContent = '🔄 번역 중... (0/' + totalCount + ')';

    let successCount = 0;
    let failList = [];

    for (let i = 0; i < needTranslation.length; i++) {
        const item = needTranslation[i];
        btn.textContent = `🔄 번역 중... (${i + 1}/${totalCount})`;

        const translated = await translateToKH(item.product_name_kr);

        if (translated) {
            // data 배열에서 해당 레코드 업데이트
            const idx = data.findIndex(d => d.master_product_id === item.master_product_id);
            if (idx >= 0) {
                data[idx].product_name_kh = translated;
                data[idx].updated_by = 'Admin';
                data[idx].updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
                successCount++;
            }
        } else {
            failList.push(item.product_name_kr);
        }

        // API 과부하 방지 (1초 대기)
        if (i < needTranslation.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    setData('master_product', data);
    btn.disabled = false;
    btn.textContent = '🌐 캄보디아어 일괄번역';

    // 결과 리포트
    let resultMsg = `번역 완료!\n\n성공: ${successCount}건`;
    if (failList.length > 0) {
        resultMsg += `\n실패: ${failList.length}건\n  - ${failList.join('\n  - ')}\n\n실패 항목은 수정 화면에서 직접 입력하세요.`;
    }

    // 성공한 번역 목록 표시
    const translatedItems = data.filter(d => d.product_name_kh);
    if (translatedItems.length > 0) {
        resultMsg += `\n\n--- 번역 결과 ---\n`;
        translatedItems.forEach(d => {
            resultMsg += `${d.product_name_kr} → ${d.product_name_kh}\n`;
        });
    }

    alert(resultMsg);
    renderTable();
}

// ===== 복수 선택 참조 필드 (multi_ref) =====
function renderMultiRefHtml(field, record) {
    const refData = getData(field.refCode).filter(d => d.status === '사용' || d.status === '재직');
    const selectedIds = (record[field.key] || '').split(',').filter(Boolean);
    const reqMark = field.required ? '<span class="required">*</span>' : '';

    let html = `<div class="form-group full-width">
        <label class="form-label">${field.label}${reqMark}</label>
        <input type="hidden" name="${field.key}" value="${escHtml(selectedIds.join(','))}">
        <div class="multi-ref-wrapper">
            <div class="multi-ref-tags" id="tags_${field.key}">`;

    // 선택된 태그 표시
    selectedIds.forEach(id => {
        const ref = refData.find(d => d[field.refIdField] === id);
        const name = ref ? ref[field.refNameField] : id;
        html += `<span class="multi-ref-tag">${name} <button type="button" class="multi-ref-remove" onclick="removeMultiRef('${field.key}','${id}')">&times;</button></span>`;
    });

    html += `</div>
            <div class="select-with-add">
                <select class="form-control" id="select_${field.key}" style="flex:1;">
                    <option value="">담당자 선택</option>`;
    refData.forEach(d => {
        const id = d[field.refIdField];
        const name = d[field.refNameField] || id;
        if (!selectedIds.includes(id)) {
            html += `<option value="${id}">${name} (${id})</option>`;
        }
    });
    html += `</select>
                <button type="button" class="btn btn-sm btn-primary" onclick="addMultiRef('${field.key}','${field.refCode}','${field.refIdField}','${field.refNameField}')">추가</button>
                <button type="button" class="btn-add-code" onclick="quickAddRef('${field.refCode}','${field.key}')" title="새 ${field.label} 등록">+신규</button>
            </div>
        </div>`;
    if (field.hint) html += `<span class="form-hint">${field.hint}</span>`;
    html += '</div>';
    return html;
}

function addMultiRef(fieldKey, refCode, refIdField, refNameField) {
    const select = document.getElementById('select_' + fieldKey);
    if (!select || !select.value) return;
    const id = select.value;
    const name = select.options[select.selectedIndex].text;

    const hiddenInput = document.querySelector(`input[name="${fieldKey}"]`);
    let ids = (hiddenInput.value || '').split(',').filter(Boolean);
    if (ids.includes(id)) return;
    ids.push(id);
    hiddenInput.value = ids.join(',');

    // 태그 추가
    const tagsDiv = document.getElementById('tags_' + fieldKey);
    const tag = document.createElement('span');
    tag.className = 'multi-ref-tag';
    tag.innerHTML = `${name.split(' (')[0]} <button type="button" class="multi-ref-remove" onclick="removeMultiRef('${fieldKey}','${id}')">&times;</button>`;
    tagsDiv.appendChild(tag);

    // 선택된 항목 드롭다운에서 제거
    select.remove(select.selectedIndex);
    select.selectedIndex = 0;
}

function removeMultiRef(fieldKey, removeId) {
    const hiddenInput = document.querySelector(`input[name="${fieldKey}"]`);
    let ids = (hiddenInput.value || '').split(',').filter(Boolean);
    ids = ids.filter(id => id !== removeId);
    hiddenInput.value = ids.join(',');

    // 현재 폼 데이터 수집 후 UI 새로고침
    const tempRecord = collectCurrentFormData();
    tempRecord[fieldKey] = ids.join(',');
    renderForm(tempRecord);
}

// ===== 현재 폼 데이터 수집 (수정모드시 기존 record 데이터 보존) =====
function collectCurrentFormData() {
    const def = CODE_DEFINITIONS[currentCode];
    const form = document.getElementById('modalBody');
    const tempRecord = {};

    // 수정모드: 기존 저장 데이터를 기반으로 시작 (hidden 등 폼에 없는 필드 보존)
    if (editingId) {
        const data = getData(currentCode);
        const idField = def.fields[0].key;
        const original = data.find(d => d[idField] === editingId);
        if (original) Object.assign(tempRecord, original);
    }

    // 폼 요소에서 현재값 덮어쓰기
    def.fields.forEach(f => {
        const el = form.querySelector(`[name="${f.key}"]`);
        if (el) {
            if (el.type === 'checkbox') {
                tempRecord[f.key] = el.checked ? 'Y' : 'N';
            } else {
                tempRecord[f.key] = el.value;
            }
        }
    });
    if (def.hasUnitSystem) {
        UNIT_CODES.forEach(u => {
            const cb = form.querySelector(`[name="use_unit_${u.id}"]`);
            const wt = form.querySelector(`[name="weight_unit_${u.id}"]`);
            tempRecord['use_unit_' + u.id] = cb && cb.checked ? 'Y' : 'N';
            tempRecord['weight_unit_' + u.id] = wt ? wt.value : '';
        });
    }
    if (def.hasSkuMasterItems) {
        tempRecord.master_items_json = JSON.stringify(collectSkuItems('master'));
        tempRecord.gift_items_json = JSON.stringify(collectSkuItems('gift'));
    }
    return tempRecord;
}

// ===== 참조 데이터 빠른 등록 (매입거래처, 직원 등) =====
function quickAddRef(refCode, fieldKey) {
    const def = CODE_DEFINITIONS[refCode];
    if (!def) { alert('해당 코드 정의를 찾을 수 없습니다.'); return; }

    const nameField = def.fields.find(f => f.key !== def.fields[0].key && f.type === 'text' && f.required);
    if (!nameField) return;

    const name = prompt(`새 ${def.name} 등록 - ${nameField.label}:`);
    if (!name || !name.trim()) return;

    const data = getData(refCode);
    const idField = def.fields[0].key;
    const newId = def.prefix + '-' + String(data.length + 1).padStart(4, '0');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const newRecord = {
        [idField]: newId,
        [nameField.key]: name.trim(),
        status: '사용',
        created_by: 'Admin',
        created_at: now,
        updated_by: 'Admin',
        updated_at: now,
    };

    // 직원인 경우 재직 상태
    if (refCode === 'employee') {
        newRecord.status = '재직';
    }

    data.push(newRecord);
    setData(refCode, data);

    // 현재 폼 데이터 보존 후 새로고침
    refreshFormAfterQuickAdd(fieldKey, newId);
    alert(`${def.name} "${name.trim()}" (${newId}) 이 등록되었습니다.`);
}

function refreshFormAfterQuickAdd(fieldKey, newId) {
    const def = CODE_DEFINITIONS[currentCode];
    const tempRecord = collectCurrentFormData();

    // 해당 필드에 새 항목 반영
    const field = def.fields.find(f => f.key === fieldKey);
    if (field && field.type === 'multi_ref') {
        let ids = (tempRecord[fieldKey] || '').split(',').filter(Boolean);
        ids.push(newId);
        tempRecord[fieldKey] = ids.join(',');
    } else if (field) {
        tempRecord[fieldKey] = newId;
    }
    // SKU 행 내부에서 신규 등록한 경우: 폼 재렌더 후 select에 반영
    // fieldKey가 SKU 행 필드명 패턴인 경우 (예: master_0_master_id, gift_1_pkg_material)
    const skuFieldMatch = fieldKey.match(/^(master|gift)_(\d+)_(.+)$/);

    renderForm(tempRecord);

    // SKU 행 내부 신규 등록 후 해당 select에 새 값 선택
    if (skuFieldMatch) {
        setTimeout(() => {
            const sel = document.querySelector(`[name="${fieldKey}"]`);
            if (sel) sel.value = newId;
        }, 50);
    }
}

// ===== 하우스 자동계산 =====
function bindHarvestCalcEvents() {
    const form = document.getElementById('modalBody');
    const calcFields = ['sowing_date', 'growth_period', 'harvest_period', 'daily_harvest_target'];
    calcFields.forEach(key => {
        const el = form.querySelector(`[name="${key}"]`);
        if (el) el.addEventListener('input', recalcHarvest);
        if (el) el.addEventListener('change', recalcHarvest);
    });
}

function recalcHarvest() {
    const form = document.getElementById('modalBody');
    const getVal = (name) => form.querySelector(`[name="${name}"]`)?.value || '';
    const setVal = (name, val) => {
        const el = form.querySelector(`[name="${name}"]`);
        if (el) el.value = val;
    };

    const sowingDate = getVal('sowing_date');
    const growthPeriod = parseInt(getVal('growth_period')) || 0;
    const harvestPeriod = parseInt(getVal('harvest_period')) || 0;
    const dailyTarget = parseFloat(getVal('daily_harvest_target')) || 0;

    if (sowingDate && growthPeriod > 0) {
        const start = new Date(sowingDate);
        start.setDate(start.getDate() + growthPeriod);
        setVal('harvest_start_date', start.toISOString().slice(0, 10));

        if (harvestPeriod > 0) {
            const end = new Date(start);
            end.setDate(end.getDate() + harvestPeriod);
            setVal('harvest_end_date', end.toISOString().slice(0, 10));
        }
    }

    if (dailyTarget > 0 && harvestPeriod > 0) {
        const autoTotal = dailyTarget * harvestPeriod;
        setVal('total_harvest_target', autoTotal);
    }
}

// ===== 저장 =====
function saveRecord() {
    const def = CODE_DEFINITIONS[currentCode];
    const data = getData(currentCode);
    const idField = def.fields[0].key;
    const form = document.getElementById('modalBody');
    const record = {};

    def.fields.forEach(field => {
        if (field.type === 'unit_system' || field.type === 'mapping_actions' || field.type === 'change_history' || field.type === 'sku_master_items' || field.type === 'sku_gift_items') return;
        const el = form.querySelector(`[name="${field.key}"]`);
        if (el) {
            // 체크박스인 경우
            if (el.type === 'checkbox') {
                record[field.key] = el.checked ? 'Y' : 'N';
            } else {
                record[field.key] = el.value;
            }
        }
    });

    // 단위코드 체크박스 수집 (마스터상품)
    if (def.hasUnitSystem) {
        UNIT_CODES.forEach(u => {
            const useKey = 'use_unit_' + u.id;
            const weightKey = 'weight_unit_' + u.id;
            const cb = form.querySelector(`[name="${useKey}"]`);
            const wt = form.querySelector(`[name="${weightKey}"]`);
            record[useKey] = cb && cb.checked ? 'Y' : 'N';
            record[weightKey] = wt ? wt.value : '';
        });
    }

    // SKU 마스터상품/증정상품 연결 데이터 수집
    if (def.hasSkuMasterItems) {
        const masterItems = collectSkuItems('master');
        record.master_items_json = JSON.stringify(masterItems);
        const giftItems = collectSkuItems('gift');
        record.gift_items_json = JSON.stringify(giftItems);
    }

    if (!editingId && def.fields[0].auto) {
        if (currentCode === 'master_product') {
            record[idField] = generateMasterProductId();
        } else {
            record[idField] = generateId(currentCode);
        }
    }

    for (const field of def.fields) {
        if (field.required && !record[field.key] && !field.auto) {
            alert(`"${field.label}" 항목은 필수입니다.`);
            const el = form.querySelector(`[name="${field.key}"]`);
            if (el) el.focus();
            return;
        }
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (editingId) {
        record.updated_by = 'Admin';
        record.updated_at = now;
        const idx = data.findIndex(d => d[idField] === editingId);
        if (idx >= 0) {
            // 변경이력 저장 (마스터상품, SKU상품)
            if (currentCode === 'master_product' || def.hasChangeHistory) {
                saveChangeHistory(editingId, data[idx], record);
            }
            record.created_by = data[idx].created_by;
            record.created_at = data[idx].created_at;
            data[idx] = record;
        }
    } else {
        record.created_by = 'Admin';
        record.created_at = now;
        record.updated_by = 'Admin';
        record.updated_at = now;
        data.push(record);
    }

    setData(currentCode, data);
    closeModal();
    renderTable();
}

// ===== 삭제 (소프트) =====
function deleteRecord(id) {
    if (!confirm(`"${id}" 항목의 상태를 '삭제'로 변경하시겠습니까?`)) return;
    const def = CODE_DEFINITIONS[currentCode];
    const data = getData(currentCode);
    const idField = def.fields[0].key;
    const idx = data.findIndex(d => d[idField] === id);
    if (idx >= 0) {
        data[idx].status = '삭제';
        data[idx].updated_by = 'Admin';
        data[idx].updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        setData(currentCode, data);
        renderTable();
    }
}

// ===== 전체 삭제 =====
function deleteAllRecords() {
    const def = CODE_DEFINITIONS[currentCode];
    const data = getData(currentCode);
    if (data.length === 0) { alert('삭제할 데이터가 없습니다.'); return; }
    if (!confirm(`[${def.name}] 전체 ${data.length}건을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    if (!confirm(`정말 삭제하시겠습니까? 모든 ${def.name} 데이터가 영구 삭제됩니다.`)) return;
    setData(currentCode, []);
    renderPage();
}

// ===== 품목수 변경 =====
function changePageSize(val) {
    PAGE_SIZE = parseInt(val) || 20;
    currentPage = 1;
    renderTable();
}

// ===== 모달 크기 적용 =====
function applyModalSize(def) {
    const modal = document.getElementById('formModal');
    modal.classList.remove('modal-lg');
    // 복잡한 폼(섹션 구조)이 있는 경우 대형 모달 사용
    if (def.fieldSections || def.hasSkuMasterItems || def.hasUnitSystem) {
        modal.classList.add('modal-lg');
    }
}

// ===== 모달 닫기 =====
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    editingId = null;
}

// ===== 엑셀 템플릿 다운로드 =====
// SKU 마스터상품/증정상품 연결 항목 헤더 (최대 3개 상품)
const SKU_ITEM_FIELDS = [
    { suffix: '마스터상품명', jsonKey: 'master_product_name' },
    { suffix: '마스터코드', jsonKey: 'master_product_id' },
    { suffix: '입수중량', jsonKey: 'input_weight' },
    { suffix: '추가중량%', jsonKey: 'extra_weight_pct' },
    { suffix: '출고중량', jsonKey: 'output_weight' },
    { suffix: '포장형태', jsonKey: 'package_type' },
    { suffix: '포장자재', jsonKey: 'package_material_id' },
    { suffix: '포장박스', jsonKey: 'package_box_id' },
    { suffix: '박스입수량', jsonKey: 'box_input_qty' },
];
const SKU_MAX_MASTER = 3;
const SKU_MAX_GIFT = 2;

function getSkuItemHeaders(prefix, maxCount) {
    const headers = [];
    for (let i = 1; i <= maxCount; i++) {
        SKU_ITEM_FIELDS.forEach(f => {
            headers.push(`${prefix}${i}_${f.suffix}`);
        });
    }
    return headers;
}

function skuItemToFlatRow(jsonStr, prefix, maxCount) {
    let items = [];
    try { items = JSON.parse(jsonStr || '[]'); } catch(e) {}
    const row = {};
    for (let i = 1; i <= maxCount; i++) {
        const item = items[i - 1] || {};
        SKU_ITEM_FIELDS.forEach(f => {
            row[`${prefix}${i}_${f.suffix}`] = item[f.jsonKey] || '';
        });
    }
    return row;
}

function flatRowToSkuItems(row, prefix, maxCount) {
    const items = [];
    for (let i = 1; i <= maxCount; i++) {
        const item = {};
        let hasData = false;
        SKU_ITEM_FIELDS.forEach(f => {
            const val = row[`${prefix}${i}_${f.suffix}`] || '';
            item[f.jsonKey] = val;
            if (val) hasData = true;
        });
        if (hasData) items.push(item);
    }
    return items;
}

// 엑셀 시트에 폰트 크기 10 일괄 적용
function applySheetFont(ws) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[addr]) continue;
            if (!ws[addr].s) ws[addr].s = {};
            ws[addr].s.font = { sz: 10 };
        }
    }
}

function downloadTemplate() {
    const def = CODE_DEFINITIONS[currentCode];
    const data = getData(currentCode);
    const isSku = def.hasSkuMasterItems;

    // 기본 필드 (auto 포함 - 기존 데이터 표시용)
    const templateFields = def.fields.filter(f =>
        f.key !== 'remarks' &&
        f.type !== 'hidden' && f.type !== 'unit_system' &&
        f.type !== 'mapping_actions' && f.type !== 'change_history' && f.type !== 'notice' &&
        f.type !== 'sku_master_items' && f.type !== 'sku_gift_items'
    );

    // SKU 마스터/증정 연결 헤더
    const skuMasterHeaders = isSku ? getSkuItemHeaders('상품', SKU_MAX_MASTER) : [];
    const skuGiftHeaders = isSku ? getSkuItemHeaders('증정', SKU_MAX_GIFT) : [];

    // ── 전체 헤더 (기존데이터 시트용) ──
    const allHeaders = templateFields.map(f => {
        let label = f.label;
        if (f.required && !f.auto) label += ' (필수)';
        if (f.auto) label += ' (자동)';
        return label;
    });
    // SKU인 경우 혼합상품 개수 다음에 마스터 항목, 증정상품 개수 다음에 증정 항목 삽입
    let fullHeaders = [...allHeaders];
    if (isSku) {
        const mixedIdx = fullHeaders.findIndex(h => h.startsWith('혼합상품 개수'));
        if (mixedIdx >= 0) fullHeaders.splice(mixedIdx + 1, 0, ...skuMasterHeaders);
        const giftIdx = fullHeaders.findIndex(h => h.startsWith('증정상품 개수'));
        if (giftIdx >= 0) fullHeaders.splice(giftIdx + 1, 0, ...skuGiftHeaders);
    }

    // ── 시트1: 기존 등록 데이터 ──
    const existingRows = data.filter(d => d.status !== '삭제').map(item => {
        const row = {};
        templateFields.forEach(f => {
            let label = f.label;
            if (f.required && !f.auto) label += ' (필수)';
            if (f.auto) label += ' (자동)';
            row[label] = item[f.key] || '';
        });
        if (isSku) {
            Object.assign(row, skuItemToFlatRow(item.master_items_json, '상품', SKU_MAX_MASTER));
            Object.assign(row, skuItemToFlatRow(item.gift_items_json, '증정', SKU_MAX_GIFT));
        }
        return row;
    });

    // ── 시트2: 신규 입력용 빈 템플릿 ──
    const newInputFields = templateFields.filter(f => !f.auto);
    const newBaseHeaders = newInputFields.map(f => f.required ? f.label + ' (필수)' : f.label);
    let newHeaders = [...newBaseHeaders];
    if (isSku) {
        const mixedIdx = newHeaders.findIndex(h => h.startsWith('혼합상품 개수'));
        if (mixedIdx >= 0) newHeaders.splice(mixedIdx + 1, 0, ...skuMasterHeaders);
        const giftIdx = newHeaders.findIndex(h => h.startsWith('증정상품 개수'));
        if (giftIdx >= 0) newHeaders.splice(giftIdx + 1, 0, ...skuGiftHeaders);
    }

    const example = {};
    newHeaders.forEach(h => { example[h] = ''; });
    newInputFields.forEach(f => {
        const header = f.required ? f.label + ' (필수)' : f.label;
        if (f.options) example[header] = f.options[0];
        else if (f.type === 'number') example[header] = 0;
        else if (f.type === 'date') example[header] = '2026-01-01';
    });

    // ── 워크북 생성 ──
    const wb = XLSX.utils.book_new();

    if (existingRows.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(existingRows, { header: fullHeaders });
        ws1['!cols'] = fullHeaders.map(h => ({ wch: Math.max(h.length * 2, 12) }));
        applySheetFont(ws1);
        XLSX.utils.book_append_sheet(wb, ws1, '기존데이터(' + existingRows.length + '건)');
    }

    const ws2 = XLSX.utils.json_to_sheet([example], { header: newHeaders });
    ws2['!cols'] = newHeaders.map(h => ({ wch: Math.max(h.length * 2, 12) }));
    applySheetFont(ws2);
    XLSX.utils.book_append_sheet(wb, ws2, '신규입력 템플릿');

    XLSX.writeFile(wb, `${def.name}_템플릿.xlsx`);
}

// ===== 엑셀 모달 =====
function openExcelModal() {
    excelData = [];
    document.getElementById('excelPreview').style.display = 'none';
    document.getElementById('btnExcelImport').disabled = true;
    document.getElementById('excelModalOverlay').style.display = 'flex';
}
function closeExcelModal() {
    document.getElementById('excelModalOverlay').style.display = 'none';
    excelData = [];
}

function handleExcelFile(event) {
    const file = event.target.files[0];
    if (file) processExcelFile(file);
}

function processExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const def = CODE_DEFINITIONS[currentCode];

        // 시트 자동 선택: 현재 코드명과 일치하는 시트 우선, 없으면 첫 번째 시트
        let sheetName = wb.SheetNames[0];
        // 1) 정확히 일치하는 시트명
        const exactMatch = wb.SheetNames.find(s => s === def.name);
        if (exactMatch) {
            sheetName = exactMatch;
        } else {
            // 2) 시트명에 현재 코드명이 포함된 경우
            const partialMatch = wb.SheetNames.find(s => s.includes(def.name) || def.name.includes(s));
            if (partialMatch) sheetName = partialMatch;
            // 3) 여러 시트인데 매칭 안될 경우 사용자에게 선택
            else if (wb.SheetNames.length > 1) {
                const sheetList = wb.SheetNames.map((s, i) => `${i + 1}. ${s}`).join('\n');
                const choice = prompt(`엑셀에 여러 시트가 있습니다.\n현재 메뉴: ${def.name}\n\n시트 번호를 선택하세요:\n${sheetList}`);
                if (choice) {
                    const idx = parseInt(choice) - 1;
                    if (idx >= 0 && idx < wb.SheetNames.length) sheetName = wb.SheetNames[idx];
                }
            }
        }

        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (json.length === 0) { alert(`"${sheetName}" 시트에 데이터가 없습니다.`); return; }

        // 헤더 → 필드키 매핑 (다양한 접미사 대응)
        const labelToKey = {};
        def.fields.forEach(f => {
            labelToKey[f.label] = f.key;
            labelToKey[f.label + ' (필수)'] = f.key;
            labelToKey[f.label + ' (자동)'] = f.key;
        });

        excelData = json.map(row => {
            const mapped = {};
            Object.keys(row).forEach(label => {
                const key = labelToKey[label] || label;
                mapped[key] = String(row[label]);
            });
            return mapped;
        });

        // 미리보기 컬럼: listColumns 전체 사용 (auto 포함)
        document.getElementById('excelRowCount').textContent = excelData.length;
        const columns = def.listColumns;
        let html = '<thead><tr>';
        columns.forEach(col => {
            const f = def.fields.find(fd => fd.key === col);
            html += `<th>${f ? f.label : col}</th>`;
        });
        html += '</tr></thead><tbody>';
        excelData.slice(0, 10).forEach(row => {
            html += '<tr>';
            columns.forEach(col => { html += `<td>${row[col] || ''}</td>`; });
            html += '</tr>';
        });
        if (excelData.length > 10) {
            html += `<tr><td colspan="${columns.length}" style="text-align:center;color:var(--gray-400)">... 외 ${excelData.length - 10}건</td></tr>`;
        }
        html += '</tbody>';
        document.getElementById('excelPreviewTable').innerHTML = html;
        document.getElementById('excelPreview').style.display = 'block';
        document.getElementById('btnExcelImport').disabled = false;
    };
    reader.readAsArrayBuffer(file);
}

function importExcelData() {
    if (excelData.length === 0) return;
    const def = CODE_DEFINITIONS[currentCode];
    const data = getData(currentCode);
    const idField = def.fields[0].key;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const isSku = def.hasSkuMasterItems;

    // ===== 공통코드 / 참조코드 유효성 검증 =====
    const errors = [];
    excelData.forEach((row, rowIdx) => {
        def.fields.forEach(f => {
            const val = row[f.key];
            if (!val || val === '') return; // 빈 값은 검증 스킵

            // select 필드: 공통코드 옵션 일치 여부
            if (f.type === 'select' && f.options) {
                if (!f.options.includes(val)) {
                    errors.push(`${rowIdx + 1}행 [${f.label}]: "${val}" → 허용값: ${f.options.join(', ')}`);
                }
            }

            // ref_select 필드: 참조 데이터 존재 여부
            if (f.type === 'ref_select' && f.refCode && f.refIdField) {
                const refData = getData(f.refCode);
                const exists = refData.some(d => d[f.refIdField] === val);
                if (!exists) {
                    errors.push(`${rowIdx + 1}행 [${f.label}]: "${val}" → 등록되지 않은 코드입니다`);
                }
            }
        });
    });

    if (errors.length > 0) {
        alert('⚠ 공통코드 불일치 오류\n\n' + errors.slice(0, 20).join('\n') +
              (errors.length > 20 ? `\n\n... 외 ${errors.length - 20}건 추가 오류` : ''));
        return;
    }

    let imported = 0;
    excelData.forEach(row => {
        // SKU 마스터상품/증정상품 연결 데이터를 JSON으로 변환
        if (isSku) {
            const masterItems = flatRowToSkuItems(row, '상품', SKU_MAX_MASTER);
            if (masterItems.length > 0) row.master_items_json = JSON.stringify(masterItems);
            const giftItems = flatRowToSkuItems(row, '증정', SKU_MAX_GIFT);
            if (giftItems.length > 0) row.gift_items_json = JSON.stringify(giftItems);
            // 플랫 컬럼 제거 (저장 불필요)
            for (let i = 1; i <= SKU_MAX_MASTER; i++) {
                SKU_ITEM_FIELDS.forEach(f => delete row[`상품${i}_${f.suffix}`]);
            }
            for (let i = 1; i <= SKU_MAX_GIFT; i++) {
                SKU_ITEM_FIELDS.forEach(f => delete row[`증정${i}_${f.suffix}`]);
            }
        }

        if (currentCode === 'sku_product' && row.sku_id) {
            // SKU코드 그대로 사용
        } else if (def.fields[0].auto) {
            if (currentCode === 'master_product') {
                row[idField] = generateMasterProductId(data);
            } else {
                row[idField] = generateId(currentCode);
            }
            data.push(Object.assign(row, { created_by: 'Admin', created_at: now, updated_by: 'Admin', updated_at: now }));
            imported++;
            return;
        }

        if (!row.status) row.status = '사용';
        row.created_by = 'Admin';
        row.created_at = now;
        row.updated_by = 'Admin';
        row.updated_at = now;
        data.push(row);
        imported++;
    });

    setData(currentCode, data);
    closeExcelModal();
    renderTable();
    alert(`${imported}건이 등록되었습니다.`);
}

// ===== QR 코드 =====
function showQr(code) {
    document.getElementById('qrModalOverlay').style.display = 'flex';
    document.getElementById('qrCodeText').textContent = code;
    const canvas = document.getElementById('qrCanvas');
    QRCode.toCanvas(canvas, code, { width: 200, margin: 2 }, function(error) {
        if (error) console.error(error);
    });
}
function closeQrModal() {
    document.getElementById('qrModalOverlay').style.display = 'none';
}
function printQr() {
    const canvas = document.getElementById('qrCanvas');
    const code = document.getElementById('qrCodeText').textContent;
    const win = window.open('', '_blank');
    win.document.write(`<html><body style="text-align:center;padding:40px;">
        <img src="${canvas.toDataURL()}" style="width:200px;"><br>
        <p style="font-size:16px;font-weight:bold;margin-top:10px;">${code}</p>
        <p style="font-size:12px;color:#666;">그트플 통합관리시스템</p>
    </body></html>`);
    win.print();
}

// ===== 엑셀 다운로드 =====
function exportToExcel() {
    const def = CODE_DEFINITIONS[currentCode];
    const data = getData(currentCode);
    if (data.length === 0) { alert('다운로드할 데이터가 없습니다.'); return; }

    const exportData = data.map(item => {
        const row = {};
        def.fields.forEach(f => { row[f.label] = item[f.key] || ''; });
        return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, def.name);
    XLSX.writeFile(wb, `${def.name}_데이터.xlsx`);
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => {
    const dropZone = document.getElementById('excelDropZone');
    if (dropZone) {
        dropZone.addEventListener('click', () => document.getElementById('excelFileInput').click());
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; });
        dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--gray-300)'; });
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--gray-300)';
            const file = e.dataTransfer.files[0];
            if (file) processExcelFile(file);
        });
    }

    // Firestore → localStorage 동기화 (앱 시작 시)
    await syncFromFirestore();

    // 공통코드 초기화
    initCommonCodes();

    // 마스터상품 데이터 초기화 (1회성 - GTP-0001 순번 코드체계 전환)
    if (!localStorage.getItem('gtp_master_product_reset_v3')) {
        localStorage.removeItem('gtp_master_product');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('gtp_change_history_GTP-')) localStorage.removeItem(key);
        });
        localStorage.setItem('gtp_master_product_reset_v3', 'done');
    }

    // SKU상품 데이터 초기화 (1회성)
    if (!localStorage.getItem('gtp_sku_product_reset_v3')) {
        localStorage.removeItem('gtp_sku_product');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('gtp_change_history_SKU-')) localStorage.removeItem(key);
        });
        localStorage.setItem('gtp_sku_product_reset_v3', 'done');
    }

    // 모듈 초기화
    switchModule('system');
});
