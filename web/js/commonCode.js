/**
 * 그트플 통합관리시스템 - 공통코드 관리
 * 그룹코드 → 상세코드 2단계 구조
 */

// ===== 초기 공통코드 데이터 (최초 1회 자동등록) =====
const INITIAL_COMMON_CODES = {
    // ── 마스터상품 ──
    PRD_CAT_L:   { name: '마스터상품_대분류',   module: 'master_product',    field: 'category_large',   values: ['엽채류','과채류','근채류','과일류','양념채소','버섯류','기타'] },
    PRD_CAT_M:   { name: '마스터상품_중분류',   module: 'master_product',    field: 'category_medium',  values: ['쌈채소','샐러드','양념채소','열매채소','뿌리채소','기타'] },
    PRD_UNIT:    { name: '마스터상품_기본단위', module: 'master_product',    field: 'unit',             values: ['kg','g','개','박스','봉','팩','묶음'] },
    PRD_ORIGIN:  { name: '마스터상품_원산지',   module: 'master_product',    field: 'origin',           values: ['국산','수입(중국)','수입(미국)','수입(베트남)','수입(기타)'] },
    PRD_CHANNEL: { name: '마스터상품_매입채널', module: 'master_product',    field: 'purchase_channel', values: ['농장','시장','외부'] },
    PRD_STORAGE: { name: '마스터상품_보관구분', module: 'master_product',    field: 'storage_type',     values: ['냉장','냉동','상온'] },
    PRD_ZONE:    { name: '마스터상품_보관존',   module: 'master_product',    field: 'storage_zone',     values: ['A존','B존','C존','D존','기타'] },
    // ── SKU상품 ──
    SKU_DLV_CAT: { name: 'SKU상품_배송구분',   module: 'sku_product',       field: 'delivery_category', values: ['자체배송','택배','화물','퀵'] },
    SKU_OWN:     { name: 'SKU상품_직영위탁',   module: 'sku_product',       field: 'own_or_consign',    values: ['직영','위탁'] },
    SKU_OUTZONE: { name: 'SKU상품_출고생산존', module: 'sku_product',       field: 'outbound_zone',     values: ['A존','B존','C존','D존','기타'] },
    SKU_PKG_TYPE:{ name: 'SKU상품_포장형태',   module: 'sku_product',       field: 'sku_package_type',  values: ['봉지','박스','팩','트레이','기타'] },
    // ── 포장자재 ──
    PKG_CAT:     { name: '포장자재_분류',       module: 'package_material',  field: 'category',         values: ['포장팩','박스','라벨지','테이프','완충재','밴드','기타'] },
    // ── 소모품 ──
    CSM_CAT:     { name: '소모품_분류',         module: 'consumable',        field: 'category',         values: ['사무용품','탕비비품','청소용품','위생용품','기타'] },
    // ── 물류자재 ──
    EQP_CAT:     { name: '물류자재_분류',       module: 'logistics_material',field: 'category',         values: ['바구니','파레트','진열대','운반카트','기타'] },
    // ── 시설/기구 ──
    FCL_CAT:     { name: '시설기구_분류',       module: 'facility',          field: 'category',         values: ['시설','기구'] },
    // ── 매출거래처 ──
    CST_CHANNEL: { name: '판매채널',            module: 'customer',          field: 'sales_channel',    values: ['GTP-오프라인','CHEF-온라인'] },
    CST_PAY:     { name: '매출거래처_결제조건', module: 'customer',          field: 'payment_terms',    values: ['선불','후불','월정산','기타'] },
    // ── 판매채널 ──
    SCH_TYPE:    { name: '판매채널_유형',       module: 'sales_channel',     field: 'channel_type',     values: ['온라인채널','오프라인채널','기타채널'] },
    // ── 판매처 ──
    SLR_PAY:     { name: '판매처_결제조건',     module: 'seller',            field: 'payment_terms',    values: ['선불','후불','월정산','기타'] },
    // ── 매입거래처 ──
    SUP_TYPE:    { name: '매입거래처_구분',     module: 'supplier',          field: 'supplier_type',    values: ['상품매입','자재매입','소모품매입','물류'] },
    SUP_PAY:     { name: '매입거래처_결제조건', module: 'supplier',          field: 'payment_terms',    values: ['현금','외상','월정산','기타'] },
    // ── 역발행 ──
    RIV_TYPE:    { name: '역발행_발행유형',     module: 'reverse_invoice',   field: 'invoice_type',     values: ['수수료','장려금','판촉비','기타'] },
    // ── 직원 ──
    EMP_TYPE:    { name: '직원_구분',           module: 'employee',          field: 'employee_type',    values: ['관리직','현장직','계약직'] },
    EMP_NAT:     { name: '직원_국적',           module: 'employee',          field: 'nationality',      values: ['한국','캄보디아','기타'] },
    // ── 사용자계정 ──
    USR_AUTH:    { name: '사용자_권한그룹',     module: 'user_account',      field: 'auth_group',       values: ['경영그룹','사용자그룹','농장그룹','물류현장그룹','거래처그룹'] },
    // ── 하우스 ──
    GHS_STATUS:  { name: '하우스_상태',         module: 'greenhouse',        field: 'house_status',     values: ['휴경중','생육중','수확중','정비중','보수중'] },
    GHS_USAGE:   { name: '하우스_용도',         module: 'greenhouse',        field: 'usage_type',       values: ['생산동','육묘동','관리동','창고동'] },
    GHS_STRUCT:  { name: '하우스_구조유형',     module: 'greenhouse',        field: 'structure_type',   values: ['비닐하우스','유리온실','망하우스','기타'] },
    GHS_CROP_ST: { name: '하우스_작물상태',     module: 'greenhouse',        field: 'crop_status',      values: ['모종','정식','생육','수확','휴경','예정','신규'] },
    // ── 설비 ──
    FAC_CAT:     { name: '설비_분류',           module: 'farm_facility',     field: 'category',         values: ['관수','난방','환기','조명','기타'] },
    // ── 농사장비 ──
    AGM_CAT:     { name: '농사장비_분류',       module: 'agri_machine',      field: 'category',         values: ['경운기','트랙터','분무기','예초기','기타'] },
    // ── 농사기구 ──
    AGT_CAT:     { name: '농사기구_분류',       module: 'agri_tool',         field: 'category',         values: ['수확용','정리용','관리용','기타'] },
    // ── 비용관리 ──
    COST_CAT:    { name: '비용_대분류',         module: 'cost_code',         field: 'cost_category',    values: ['인건비','재료비','경비','감가상각','기타'] },
    COST_DEPT:   { name: '비용_적용부서',       module: 'cost_code',         field: 'applicable_dept',  values: ['전체','농장','온라인','오프라인','물류','관리'] },
    COST_TAX:    { name: '비용_세금구분',       module: 'cost_code',         field: 'tax_type',         values: ['계산서','비계산서'] },
    // ── 물류관리 ──
    LOG_VTYPE:   { name: '물류_차량유형',       module: 'logistics',         field: 'vehicle_type',     values: ['냉장탑','화물','승합','기타'] },
    // ── 배송타입 ──
    DLV_METHOD:  { name: '배송_배송방법',       module: 'delivery_type',     field: 'delivery_method',  values: ['자체배송','택배','화물','퀵'] },
    // ── 판매부서 ──
    SLD_DEPT:    { name: '사업부서_기본',       module: 'sales_dept',        field: 'sales_dept_name',  values: ['GTP-오프라인','CHEF-온라인'] },
    // ── 판매처 ──
    SLR_PLAT:    { name: '판매처_플랫폼유형',   module: 'seller',            field: 'platform_type',    values: ['오픈마켓','폐쇄몰','직거래','기타'] },
    // ── 3정5S ──
    TDO_CAT:     { name: '3정5S_관리분류',      module: 'todo_item',         field: 'todo_category',    values: ['경영관리','현장관리','판매관리'] },
    TDO_CYCLE:   { name: '3정5S_관리주기',      module: 'todo_item',         field: 'management_cycle', values: ['매일','주간','월간','분기','수시'] },
};

// ===== 공통코드 초기화 =====
function initCommonCodes() {
    if (!localStorage.getItem('gtp_common_initialized')) {
        // 최초 초기화
        const groups = [];
        const details = [];

        Object.keys(INITIAL_COMMON_CODES).forEach(groupId => {
            const g = INITIAL_COMMON_CODES[groupId];
            groups.push({
                group_code_id: groupId,
                group_code_name: g.name,
                used_in_module: g.module,
                used_in_field: g.field,
                status: '사용',
            });
            g.values.forEach((val, idx) => {
                details.push({
                    detail_code_id: groupId + '_' + String(idx + 1).padStart(3, '0'),
                    group_code_id: groupId,
                    code_value: val,
                    code_label_kh: '',
                    sort_order: idx + 1,
                    is_default: idx === 0 ? 'Y' : 'N',
                    status: '사용',
                });
            });
        });

        localStorage.setItem('gtp_common_groups', JSON.stringify(groups));
        localStorage.setItem('gtp_common_details', JSON.stringify(details));
        localStorage.setItem('gtp_common_initialized', 'true');
    }

    // 신규 그룹코드 자동 추가 (이미 초기화된 후에도 새 그룹 코드 반영)
    const groups = JSON.parse(localStorage.getItem('gtp_common_groups') || '[]');
    const details = JSON.parse(localStorage.getItem('gtp_common_details') || '[]');
    const existingGroupIds = new Set(groups.map(g => g.group_code_id));
    let changed = false;

    Object.keys(INITIAL_COMMON_CODES).forEach(groupId => {
        if (existingGroupIds.has(groupId)) return;
        const g = INITIAL_COMMON_CODES[groupId];
        groups.push({
            group_code_id: groupId,
            group_code_name: g.name,
            used_in_module: g.module,
            used_in_field: g.field,
            status: '사용',
        });
        g.values.forEach((val, idx) => {
            details.push({
                detail_code_id: groupId + '_' + String(idx + 1).padStart(3, '0'),
                group_code_id: groupId,
                code_value: val,
                code_label_kh: '',
                sort_order: idx + 1,
                is_default: idx === 0 ? 'Y' : 'N',
                status: '사용',
            });
        });
        changed = true;
    });

    if (changed) {
        localStorage.setItem('gtp_common_groups', JSON.stringify(groups));
        localStorage.setItem('gtp_common_details', JSON.stringify(details));
    }
}

// ===== 공통코드 데이터 접근 =====
function getCommonGroups() {
    return JSON.parse(localStorage.getItem('gtp_common_groups') || '[]');
}
function setCommonGroups(data) {
    localStorage.setItem('gtp_common_groups', JSON.stringify(data));
}
function getCommonDetails() {
    return JSON.parse(localStorage.getItem('gtp_common_details') || '[]');
}
function setCommonDetails(data) {
    localStorage.setItem('gtp_common_details', JSON.stringify(data));
}

// ===== 특정 그룹의 상세코드 값 목록 가져오기 =====
function getCodeValues(groupId) {
    const details = getCommonDetails();
    return details
        .filter(d => d.group_code_id === groupId && d.status === '사용')
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(d => d.code_value);
}

// 필드로 그룹코드ID 찾기
function findGroupIdByField(module, field) {
    const groups = getCommonGroups();
    const g = groups.find(g => g.used_in_module === module && g.used_in_field === field && g.status === '사용');
    return g ? g.group_code_id : null;
}

// ===== 공통코드 관리 화면 =====
let selectedGroupId = null;

function renderCommonCodePage() {
    const main = document.getElementById('mainContent');
    const groups = getCommonGroups().filter(g => g.status === '사용');
    const allDetails = getCommonDetails();
    const totalDetails = allDetails.filter(d => d.status === '사용').length;

    main.innerHTML = `
        <div class="page-header">
            <div>
                <div class="page-title">⚙️ 공통코드 관리</div>
                <div class="page-desc">전체 드롭다운 항목을 관리합니다. 그룹코드 선택 → 상세코드 추가/수정/정지</div>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary" onclick="openNewGroupModal()">+ 그룹코드 추가</button>
            </div>
        </div>
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">그룹코드</div>
                <div class="stat-value">${groups.length}<span class="stat-unit">개</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">상세코드</div>
                <div class="stat-value">${totalDetails}<span class="stat-unit">개</span></div>
            </div>
        </div>
        <div class="filter-bar">
            <input type="text" class="search-input" id="ccSearchInput" placeholder="그룹코드명 또는 상세코드 검색" oninput="filterCommonGroups()">
        </div>
        <div class="cc-layout">
            <div class="cc-groups" id="ccGroupList"></div>
            <div class="cc-details" id="ccDetailPanel">
                <div style="text-align:center;padding:60px;color:var(--gray-400);">
                    좌측에서 그룹코드를 선택하세요
                </div>
            </div>
        </div>
    `;
    renderGroupList();
}

function renderGroupList(filter) {
    const groups = getCommonGroups().filter(g => g.status === '사용');
    const search = filter || (document.getElementById('ccSearchInput')?.value || '').toLowerCase();
    const details = getCommonDetails();

    // 모듈별 그룹핑
    const moduleNames = {};
    Object.keys(CODE_DEFINITIONS).forEach(k => {
        moduleNames[k] = CODE_DEFINITIONS[k].name;
    });

    let filtered = groups;
    if (search) {
        const matchDetails = details.filter(d => d.code_value.toLowerCase().includes(search));
        const matchGroupIds = new Set(matchDetails.map(d => d.group_code_id));
        filtered = groups.filter(g =>
            g.group_code_name.toLowerCase().includes(search) ||
            matchGroupIds.has(g.group_code_id)
        );
    }

    // 모듈별 분류
    const byModule = {};
    filtered.forEach(g => {
        const mod = g.used_in_module || '기타';
        if (!byModule[mod]) byModule[mod] = [];
        byModule[mod].push(g);
    });

    let html = '';
    Object.keys(byModule).forEach(mod => {
        const modName = moduleNames[mod] || mod;
        html += `<div class="cc-group-section">
            <div class="cc-group-module">${modName}</div>`;
        byModule[mod].forEach(g => {
            const count = details.filter(d => d.group_code_id === g.group_code_id && d.status === '사용').length;
            const active = selectedGroupId === g.group_code_id ? 'active' : '';
            html += `<div class="cc-group-item ${active}" onclick="selectGroup('${g.group_code_id}')">
                <span class="cc-group-name">${g.group_code_name}</span>
                <span class="cc-group-count">${count}</span>
            </div>`;
        });
        html += '</div>';
    });

    if (filtered.length === 0) {
        html = '<div style="padding:20px;text-align:center;color:var(--gray-400);">검색 결과 없음</div>';
    }

    document.getElementById('ccGroupList').innerHTML = html;
}

function filterCommonGroups() {
    renderGroupList();
}

function selectGroup(groupId) {
    selectedGroupId = groupId;
    renderGroupList();
    renderDetailPanel();
}

function renderDetailPanel() {
    if (!selectedGroupId) return;
    const groups = getCommonGroups();
    const group = groups.find(g => g.group_code_id === selectedGroupId);
    if (!group) return;

    const details = getCommonDetails()
        .filter(d => d.group_code_id === selectedGroupId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const modName = CODE_DEFINITIONS[group.used_in_module]?.name || group.used_in_module;

    let html = `
        <div class="cc-detail-header">
            <div>
                <h3>${group.group_code_name}</h3>
                <div class="cc-detail-meta">
                    그룹ID: <strong>${group.group_code_id}</strong> &nbsp;|&nbsp;
                    사용모듈: <strong>${modName}</strong> &nbsp;|&nbsp;
                    필드: <strong>${group.used_in_field}</strong>
                </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="addDetailCode()">+ 상세코드 추가</button>
        </div>
        <table class="data-table">
            <thead><tr>
                <th style="width:50px">순서</th>
                <th>코드값</th>
                <th>코드값(캄보디아어)</th>
                <th style="width:60px">기본값</th>
                <th style="width:60px">상태</th>
                <th style="width:100px">작업</th>
            </tr></thead>
            <tbody>`;

    if (details.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--gray-400);">상세코드가 없습니다</td></tr>';
    } else {
        details.forEach((d, idx) => {
            const statusBadge = d.status === '사용'
                ? '<span class="badge badge-active">사용</span>'
                : '<span class="badge badge-inactive">정지</span>';
            html += `<tr>
                <td style="text-align:center;">
                    ${idx > 0 ? `<button class="btn-icon btn-sm" onclick="moveDetail('${d.detail_code_id}','up')">▲</button>` : ''}
                    ${idx < details.length - 1 ? `<button class="btn-icon btn-sm" onclick="moveDetail('${d.detail_code_id}','down')">▼</button>` : ''}
                </td>
                <td><strong>${d.code_value}</strong></td>
                <td style="color:var(--gray-400);">${d.code_label_kh || '-'}</td>
                <td style="text-align:center;">${d.is_default === 'Y' ? '✔' : ''}</td>
                <td>${statusBadge}</td>
                <td class="td-actions">
                    <button class="btn btn-sm" onclick="editDetailCode('${d.detail_code_id}')">수정</button>
                    <button class="btn btn-sm btn-danger" onclick="toggleDetailStatus('${d.detail_code_id}')">
                        ${d.status === '사용' ? '정지' : '복원'}
                    </button>
                </td>
            </tr>`;
        });
    }
    html += '</tbody></table>';

    document.getElementById('ccDetailPanel').innerHTML = html;
}

// ===== 상세코드 추가 =====
function addDetailCode() {
    if (!selectedGroupId) return;
    const value = prompt('새 코드값을 입력하세요:');
    if (!value || !value.trim()) return;

    const details = getCommonDetails();
    const existing = details.filter(d => d.group_code_id === selectedGroupId);
    const maxOrder = existing.reduce((max, d) => Math.max(max, d.sort_order || 0), 0);
    const newId = selectedGroupId + '_' + String(existing.length + 1).padStart(3, '0');

    // 중복 체크
    if (existing.some(d => d.code_value === value.trim() && d.status === '사용')) {
        alert('이미 존재하는 코드값입니다.');
        return;
    }

    details.push({
        detail_code_id: newId,
        group_code_id: selectedGroupId,
        code_value: value.trim(),
        code_label_kh: '',
        sort_order: maxOrder + 1,
        is_default: 'N',
        status: '사용',
    });
    setCommonDetails(details);
    renderDetailPanel();
    renderGroupList();
}

// ===== 상세코드 수정 =====
function editDetailCode(detailId) {
    const details = getCommonDetails();
    const d = details.find(x => x.detail_code_id === detailId);
    if (!d) return;

    const newValue = prompt('코드값 수정:', d.code_value);
    if (newValue === null) return;
    if (!newValue.trim()) { alert('코드값은 비워둘 수 없습니다.'); return; }

    d.code_value = newValue.trim();

    const khValue = prompt('캄보디아어 표기 (없으면 비워두세요):', d.code_label_kh || '');
    if (khValue !== null) d.code_label_kh = khValue;

    setCommonDetails(details);
    renderDetailPanel();
}

// ===== 상태 토글 =====
function toggleDetailStatus(detailId) {
    const details = getCommonDetails();
    const d = details.find(x => x.detail_code_id === detailId);
    if (!d) return;
    d.status = d.status === '사용' ? '정지' : '사용';
    setCommonDetails(details);
    renderDetailPanel();
    renderGroupList();
}

// ===== 순서 변경 =====
function moveDetail(detailId, direction) {
    const details = getCommonDetails();
    const groupDetails = details
        .filter(d => d.group_code_id === selectedGroupId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const idx = groupDetails.findIndex(d => d.detail_code_id === detailId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= groupDetails.length) return;

    // 순서 교환
    const tmpOrder = groupDetails[idx].sort_order;
    groupDetails[idx].sort_order = groupDetails[swapIdx].sort_order;
    groupDetails[swapIdx].sort_order = tmpOrder;

    setCommonDetails(details);
    renderDetailPanel();
}

// ===== 그룹코드 추가 모달 =====
function openNewGroupModal() {
    const groupId = prompt('그룹코드ID (영문대문자_숫자):\n예: PRD_BRAND, GHS_ZONE');
    if (!groupId || !groupId.trim()) return;

    const groups = getCommonGroups();
    if (groups.some(g => g.group_code_id === groupId.trim())) {
        alert('이미 존재하는 그룹코드ID입니다.');
        return;
    }

    const groupName = prompt('그룹코드명:\n예: 마스터상품_브랜드');
    if (!groupName || !groupName.trim()) return;

    // 사용모듈 선택
    const moduleList = Object.keys(CODE_DEFINITIONS).map(k => CODE_DEFINITIONS[k].name).join(', ');
    const moduleName = prompt(`사용모듈명 (선택):\n${moduleList}`);

    let moduleKey = '';
    if (moduleName) {
        const found = Object.keys(CODE_DEFINITIONS).find(k => CODE_DEFINITIONS[k].name === moduleName.trim());
        moduleKey = found || '';
    }

    const fieldName = prompt('사용필드명 (선택):\n예: brand, zone');

    groups.push({
        group_code_id: groupId.trim(),
        group_code_name: groupName.trim(),
        used_in_module: moduleKey,
        used_in_field: fieldName || '',
        status: '사용',
    });
    setCommonGroups(groups);

    selectedGroupId = groupId.trim();
    renderCommonCodePage();
    selectGroup(groupId.trim());
}

// ===== 입력 중 [+신규] 버튼으로 코드 추가 =====
function addCodeInline(groupId, fieldName) {
    const value = prompt('새 항목 추가:');
    if (!value || !value.trim()) return;

    const details = getCommonDetails();
    const existing = details.filter(d => d.group_code_id === groupId);
    const maxOrder = existing.reduce((max, d) => Math.max(max, d.sort_order || 0), 0);

    if (existing.some(d => d.code_value === value.trim() && d.status === '사용')) {
        alert('이미 존재하는 항목입니다.');
        return;
    }

    const newId = groupId + '_' + String(existing.length + 1).padStart(3, '0');
    details.push({
        detail_code_id: newId,
        group_code_id: groupId,
        code_value: value.trim(),
        code_label_kh: '',
        sort_order: maxOrder + 1,
        is_default: 'N',
        status: '사용',
    });
    setCommonDetails(details);

    // 해당 select 업데이트
    const form = document.getElementById('modalBody');
    if (form) {
        const select = form.querySelector(`[name="${fieldName}"]`);
        if (select) {
            const option = document.createElement('option');
            option.value = value.trim();
            option.textContent = value.trim();
            option.selected = true;
            select.appendChild(option);
        }
    }
}
