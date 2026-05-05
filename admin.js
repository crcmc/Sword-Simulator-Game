/* ============================================================
   admin.js — Sword Simulator Game admin panel
   Loaded by: admin.html (alongside balance-defaults.js)
   Provides:
   - URL hash auth gate
   - Form populate / read / apply (localStorage override)
   - balance-defaults.js download (for git-committed global patches)
   - JSON export / import
   - Reset to defaults
   ============================================================ */

const $ = id => document.getElementById(id);

// =============== AUTH GATE ===============
(function authGate() {
  const param = new URLSearchParams(location.search).get('admin');
  const ok = param === ADMIN_HASH;
  $('admin-content').style.display = ok ? '' : 'none';
  $('auth-gate').style.display = ok ? 'none' : '';
  if (!ok) throw new Error('admin gate: not authenticated');
})();

// =============== BALANCE STATE (localStorage-backed, same key as game) ===============
function loadBalance() {
  try {
    const raw = localStorage.getItem(BALANCE_KEY);
    if (!raw) return deepClone(BALANCE_DEFAULTS);
    return Object.assign(deepClone(BALANCE_DEFAULTS), JSON.parse(raw));
  } catch (e) {
    console.warn('Balance load failed', e);
    return deepClone(BALANCE_DEFAULTS);
  }
}

function saveBalance(b) {
  const overrides = {};
  for (const k in b) {
    if (JSON.stringify(b[k]) !== JSON.stringify(BALANCE_DEFAULTS[k])) overrides[k] = b[k];
  }
  if (Object.keys(overrides).length === 0) localStorage.removeItem(BALANCE_KEY);
  else localStorage.setItem(BALANCE_KEY, JSON.stringify(overrides));
}

let balance = loadBalance();

// =============== TOAST ===============
let toastTimer = null;
function showToast(msg, kind) {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// =============== POPULATE FORM ===============
function populateForm() {
  // Economy
  $('ad-startGold').value = balance.startGold;
  $('ad-costBase').value = balance.costBase;
  $('ad-costExp').value = balance.costExp;
  $('ad-costMult').value = balance.costMult;
  $('ad-sellAnchor').value = balance.sellAnchor;
  $('ad-sellAnchorLvl').value = balance.sellAnchorLvl;
  $('ad-sellRatio').value = balance.sellRatio;
  $('ad-shopStone').value = balance.shopStone;
  $('ad-shopProtect1').value = balance.shopProtect1;
  $('ad-shopProtect10').value = balance.shopProtect10;
  $('ad-shopTicket1').value = balance.shopTicket1 != null ? balance.shopTicket1 : 5000000;
  $('ad-shopTicket10').value = balance.shopTicket10 != null ? balance.shopTicket10 : 30000000;

  // Items
  $('ad-fragmentBonus').value = balance.fragmentBonus;
  $('ad-stoneBonusEach').value = balance.stoneBonusEach;
  $('ad-stoneMaxStack').value = balance.stoneMaxStack;
  $('ad-destroyRefundRate').value = balance.destroyRefundRate;
  $('ad-fragmentDropMin').value = balance.fragmentDropMin;
  $('ad-fragmentDropMax').value = balance.fragmentDropMax;
  $('ad-startingIron').value = balance.startingIron;
  $('ad-startIronCost').value = balance.startIronCost;
  $('ad-summonBaseCost').value = balance.summonBaseCost;

  // Material
  $('ad-materialStartLvl').value = balance.materialStartLvl;
  $('ad-materialOffset').value = balance.materialOffset;

  // Advanced — tier mismatch + applicant rules
  $('ad-tierMismatchPenalty').value = balance.tierMismatchPenalty != null ? balance.tierMismatchPenalty : 15;
  $('ad-tierMismatchBonus').value = balance.tierMismatchBonus != null ? balance.tierMismatchBonus : 5;
  $('ad-tierMismatchTimeBonus').value = balance.tierMismatchTimeBonus != null ? balance.tierMismatchTimeBonus : 10;
  $('ad-tierMismatchTimePenalty').value = balance.tierMismatchTimePenalty != null ? balance.tierMismatchTimePenalty : 10;
  $('ad-floorTimeMultiplier').value = balance.floorTimeMultiplier != null ? balance.floorTimeMultiplier : 0.1;
  $('ad-applicantBaseIntervalMs').value = balance.applicantBaseIntervalMs != null ? balance.applicantBaseIntervalMs : 30000;
  $('ad-applicantMaxPerSword').value = balance.applicantMaxPerSword != null ? balance.applicantMaxPerSword : 10;
  $('ad-applicantMaxTotal').value = balance.applicantMaxTotal != null ? balance.applicantMaxTotal : 100;

  // Advanced — dungeons (6 entries × 5 fields)
  const dungeonsBox = $('ad-dungeons');
  if (dungeonsBox) {
    dungeonsBox.innerHTML = '';
    const dungeons = balance.dungeons || [];
    for (let i = 0; i < 6; i++) {
      const d = dungeons[i] || { name: '', durationMs: 0, successRate: 0, baseRewardGold: 0, baseRewardResource: 0 };
      const div = document.createElement('div');
      div.className = 'admin-failure-rule';
      div.innerHTML = `
        <div class="row"><label>티어 ${i} 이름</label><input type="text" id="ad-dungeon-${i}-name" value="${(d.name||'').replace(/"/g,'&quot;')}"></div>
        <div class="row"><label>소요 시간 (ms)</label><input type="number" id="ad-dungeon-${i}-durationMs" step="1000" min="0" value="${d.durationMs|0}"></div>
        <div class="row"><label>기본 성공률 (%)</label><input type="number" id="ad-dungeon-${i}-successRate" step="1" min="0" max="100" value="${d.successRate|0}"></div>
        <div class="row"><label>보상 골드</label><input type="number" id="ad-dungeon-${i}-baseRewardGold" step="1" min="0" value="${d.baseRewardGold|0}"></div>
        <div class="row"><label>보상 자원</label><input type="number" id="ad-dungeon-${i}-baseRewardResource" step="1" min="0" value="${d.baseRewardResource|0}"></div>
      `;
      dungeonsBox.appendChild(div);
    }
  }

  // Success rates grid
  const ratesGrid = $('ad-rates-grid');
  ratesGrid.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const cell = document.createElement('div');
    cell.className = 'admin-rates-cell';
    cell.innerHTML = `<div class="label">+${i}→+${i+1}</div><input type="number" id="ad-rate-${i}" step="0.01" min="0" max="100" value="${balance.successRates[i]}">`;
    ratesGrid.appendChild(cell);
  }

  // Protect stone cost grid (per-level)
  const protectGrid = $('ad-protect-cost-grid');
  protectGrid.innerHTML = '';
  const protectArr = balance.protectStoneCost || [];
  for (let i = 0; i < 30; i++) {
    const cell = document.createElement('div');
    cell.className = 'admin-rates-cell';
    cell.innerHTML = `<div class="label">+${i}→+${i+1}</div><input type="number" id="ad-protectCost-${i}" step="1" min="0" value="${protectArr[i] != null ? protectArr[i] : 0}">`;
    protectGrid.appendChild(cell);
  }

  // Failure rules
  const frBox = $('ad-failure-rules');
  frBox.innerHTML = '';
  balance.failureRules.forEach((rule, i) => {
    const div = document.createElement('div');
    div.className = 'admin-failure-rule';
    div.innerHTML = `
      <div class="row"><label>최대 레벨</label><input type="number" id="ad-fr-${i}-maxLevel" step="1" value="${rule.maxLevel}"></div>
      <div class="row"><label>유지</label><input type="number" id="ad-fr-${i}-maintain" step="0.05" min="0" max="1" value="${rule.maintain}"></div>
      <div class="row"><label>하락</label><input type="number" id="ad-fr-${i}-downgrade" step="0.05" min="0" max="1" value="${rule.downgrade}"></div>
      <div class="row"><label>파괴</label><input type="number" id="ad-fr-${i}-destroy" step="0.05" min="0" max="1" value="${rule.destroy}"></div>
    `;
    frBox.appendChild(div);
  });

  // Tier names + colors
  const tiersBox = $('ad-tiers');
  tiersBox.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const div = document.createElement('div');
    div.className = 'admin-tier-row';
    div.innerHTML = `
      <div class="tier-idx">티어 ${i}</div>
      <input type="text" id="ad-tierName-${i}" value="${(balance.tierNames[i]||'').replace(/"/g,'&quot;')}">
      <input type="color" id="ad-tierColor-${i}" value="${balance.tierColors[i]}">
    `;
    tiersBox.appendChild(div);
  }

  // Tier lore
  const loresBox = $('ad-lores');
  loresBox.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const div = document.createElement('div');
    div.className = 'admin-lore-row';
    div.innerHTML = `
      <div class="lore-label">티어 ${i} (${balance.tierNames[i]||''})</div>
      <textarea id="ad-tierLore-${i}" rows="2">${balance.tierLore[i]||''}</textarea>
    `;
    loresBox.appendChild(div);
  }

  // Resource names
  const resnamesBox = $('ad-resnames');
  resnamesBox.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const div = document.createElement('div');
    div.className = 'admin-tier-row';
    const tcolor = balance.tierColors[i] || '#fff';
    div.innerHTML = `
      <div class="tier-idx" style="color:${tcolor}">티어 ${i}</div>
      <input type="text" id="ad-resname-${i}" value="${(balance.resourceNames[i]||'').replace(/"/g,'&quot;')}" maxlength="10">
    `;
    resnamesBox.appendChild(div);
  }

  // Sword names
  const namesBox = $('ad-names');
  namesBox.innerHTML = '';
  for (let i = 0; i <= 30; i++) {
    const div = document.createElement('div');
    div.className = 'admin-name-row';
    div.innerHTML = `<div class="lvl">+${i}</div><input type="text" id="ad-name-${i}" value="${(balance.swordNames[i]||'').replace(/"/g,'&quot;')}">`;
    namesBox.appendChild(div);
  }
}

// =============== READ FORM ===============
function readForm() {
  const num = id => parseFloat($(id).value) || 0;
  const intv = id => parseInt($(id).value, 10) || 0;
  const txt = id => $(id).value || '';

  // Start from a deep clone of the current balance so any field WITHOUT a form
  // input (e.g. dungeons[], tierMismatch*, applicant*) is preserved instead of
  // being silently dropped on save.
  const next = deepClone(balance);

  // Override editable fields from form inputs:
  next.startGold = intv('ad-startGold');
  next.costBase = num('ad-costBase');
  next.costExp = num('ad-costExp');
  next.costMult = num('ad-costMult');
  next.sellAnchor = num('ad-sellAnchor');
  next.sellAnchorLvl = intv('ad-sellAnchorLvl');
  next.sellRatio = num('ad-sellRatio');
  next.shopStone = intv('ad-shopStone');
  next.shopProtect1 = intv('ad-shopProtect1');
  next.shopProtect10 = intv('ad-shopProtect10');
  next.shopTicket1 = intv('ad-shopTicket1');
  next.shopTicket10 = intv('ad-shopTicket10');
  next.fragmentBonus = num('ad-fragmentBonus');
  next.stoneBonusEach = num('ad-stoneBonusEach');
  next.stoneMaxStack = intv('ad-stoneMaxStack');
  next.destroyRefundRate = num('ad-destroyRefundRate');
  next.fragmentDropMin = intv('ad-fragmentDropMin');
  next.fragmentDropMax = intv('ad-fragmentDropMax');
  next.startingIron = intv('ad-startingIron');
  next.startIronCost = intv('ad-startIronCost');
  next.summonBaseCost = Math.max(1, intv('ad-summonBaseCost'));
  next.materialStartLvl = intv('ad-materialStartLvl');
  next.materialOffset = intv('ad-materialOffset');
  // Advanced tab — tier mismatch + applicant rules
  next.tierMismatchPenalty = num('ad-tierMismatchPenalty');
  next.tierMismatchBonus = num('ad-tierMismatchBonus');
  next.tierMismatchTimeBonus = num('ad-tierMismatchTimeBonus');
  next.tierMismatchTimePenalty = num('ad-tierMismatchTimePenalty');
  next.floorTimeMultiplier = Math.max(0, Math.min(2, num('ad-floorTimeMultiplier')));
  next.applicantBaseIntervalMs = Math.max(1000, intv('ad-applicantBaseIntervalMs'));
  next.applicantMaxPerSword = Math.max(1, intv('ad-applicantMaxPerSword'));
  next.applicantMaxTotal = Math.max(10, intv('ad-applicantMaxTotal'));
  // Advanced tab — dungeons (6 entries × 5 fields)
  next.dungeons = [];
  for (let i = 0; i < 6; i++) {
    next.dungeons.push({
      name: txt(`ad-dungeon-${i}-name`),
      durationMs: Math.max(0, intv(`ad-dungeon-${i}-durationMs`)),
      successRate: Math.max(0, Math.min(100, intv(`ad-dungeon-${i}-successRate`))),
      baseRewardGold: Math.max(0, intv(`ad-dungeon-${i}-baseRewardGold`)),
      baseRewardResource: Math.max(0, intv(`ad-dungeon-${i}-baseRewardResource`))
    });
  }
  // Reset arrays that ARE editable in the form, then refill from inputs:
  next.successRates = [];
  next.protectStoneCost = [];
  next.failureRules = [];
  next.swordNames = [];
  next.tierNames = [];
  next.tierColors = [];
  next.tierLore = [];
  next.resourceNames = [];

  for (let i = 0; i < 30; i++) next.successRates.push(num(`ad-rate-${i}`));
  for (let i = 0; i < 30; i++) {
    const el = $(`ad-protectCost-${i}`);
    next.protectStoneCost.push(el ? Math.max(0, intv(`ad-protectCost-${i}`)) : 0);
  }
  for (let i = 0; i < balance.failureRules.length; i++) {
    next.failureRules.push({
      maxLevel: intv(`ad-fr-${i}-maxLevel`),
      maintain: num(`ad-fr-${i}-maintain`),
      downgrade: num(`ad-fr-${i}-downgrade`),
      destroy: num(`ad-fr-${i}-destroy`)
    });
  }
  for (let i = 0; i <= 30; i++) next.swordNames.push(txt(`ad-name-${i}`));
  for (let i = 0; i < 6; i++) {
    next.tierNames.push(txt(`ad-tierName-${i}`));
    next.tierColors.push(txt(`ad-tierColor-${i}`));
    next.tierLore.push(txt(`ad-tierLore-${i}`));
    const rn = $(`ad-resname-${i}`);
    next.resourceNames.push(rn ? rn.value : (balance.resourceNames[i] || ''));
  }
  return next;
}

function validate(next) {
  if (next.successRates.length !== 30) return '성공률 30개 필요';
  if (next.protectStoneCost.length !== 30) return '보호석 사용량 30개 필요';
  if (next.swordNames.length !== 31) return '검 이름 31개 필요';
  if (next.fragmentDropMin > next.fragmentDropMax) return '검조각 최소 > 최대';
  return null;
}

// =============== APPLY LOCAL ===============
function applyLocal() {
  const next = readForm();
  const err = validate(next);
  if (err) { showToast(err, 'fail'); return; }
  balance = next;
  saveBalance(balance);
  showToast('로컬 적용 완료 (이 브라우저)', 'success');
}

// =============== FILE TEXT GENERATOR (shared by download + direct save) ===============
function generateBalanceDefaultsFile(next) {
  const json = JSON.stringify(next, null, 2);
  return `/* ============================================================
   balance-defaults.js — single source of truth for game balance
   Loaded by: sword-enhancement.html, sword-rental.html, sword-dungeon.html, admin.html
   Defines globals: BALANCE_KEY, deepClone, BALANCE_DEFAULTS, ADMIN_HASH

   Generated by admin.html
   생성 시각: ${new Date().toISOString()}
   ============================================================ */

const BALANCE_KEY = 'sword_balance_overrides_v1';

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// SHA-256 hash of the admin secret. Rotate by replacing with the new sha256.
const ADMIN_HASH = '${ADMIN_HASH}';

const BALANCE_DEFAULTS = ${json};
`;
}

// =============== EXPORT balance-defaults.js (download fallback) ===============
function exportDefaultsFile() {
  const next = readForm();
  const err = validate(next);
  if (err) { showToast(err, 'fail'); return; }

  const fileText = generateBalanceDefaultsFile(next);
  const blob = new Blob([fileText], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'balance-defaults.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('다운로드 완료. repo의 balance-defaults.js에 덮어쓴 뒤 commit/push 하세요.', 'success');
}

// =============== EXPORT / IMPORT JSON (existing util) ===============
function exportJSON() {
  const json = JSON.stringify(readForm(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sword-balance-' + new Date().toISOString().replace(/[:.]/g,'-').slice(0,19) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('JSON Export 완료', 'success');
}

function triggerImport() { $('ad-import-file').click(); }

function handleImport(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid JSON');
      balance = Object.assign(deepClone(BALANCE_DEFAULTS), parsed);
      saveBalance(balance);
      populateForm();
      showToast('Import 완료 (로컬에 저장됨)', 'success');
    } catch (err) {
      showToast('Import 실패: ' + err.message, 'fail');
    }
  };
  reader.readAsText(file);
}

// =============== RESET ===============
function resetToDefaults() {
  if (!confirm('모든 밸런스 설정을 기본값으로 복원합니다. 계속할까요?')) return;
  balance = deepClone(BALANCE_DEFAULTS);
  localStorage.removeItem(BALANCE_KEY);
  populateForm();
  showToast('기본값 복원됨 (localStorage clear)', 'success');
}

// =============== FILE SYSTEM ACCESS API (direct save to project file) ===============
const FS_API_SUPPORTED = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
const FS_DB_NAME = 'sword_admin_fs_v1';
const FS_STORE = 'handles';
const FS_KEY = 'balance-defaults';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FS_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(FS_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getStoredHandle() {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(FS_STORE, 'readonly');
      const r = tx.objectStore(FS_STORE).get(FS_KEY);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  } catch (e) { return null; }
}
async function setStoredHandle(handle) {
  const db = await openIDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(FS_STORE, 'readwrite');
    const r = tx.objectStore(FS_STORE).put(handle, FS_KEY);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
async function clearStoredHandle() {
  const db = await openIDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(FS_STORE, 'readwrite');
    const r = tx.objectStore(FS_STORE).delete(FS_KEY);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

async function ensureWritePermission(handle) {
  const opts = { mode: 'readwrite' };
  let perm = await handle.queryPermission(opts);
  if (perm === 'granted') return true;
  if (perm === 'prompt') {
    perm = await handle.requestPermission(opts);
    return perm === 'granted';
  }
  return false;
}

async function pickProjectFile() {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'balance-defaults.js',
    types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }]
  });
  await setStoredHandle(handle);
  return handle;
}

async function writeToHandle(handle, text) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function saveDirectToProjectFile() {
  if (!FS_API_SUPPORTED) {
    showToast('이 브라우저는 직접 저장 미지원. 다운로드를 사용하세요.', 'fail');
    return;
  }
  const next = readForm();
  const err = validate(next);
  if (err) { showToast(err, 'fail'); return; }

  let handle = await getStoredHandle();
  try {
    if (!handle) {
      handle = await pickProjectFile();
      if (handle.name && handle.name !== 'balance-defaults.js') {
        const ok = confirm(`선택한 파일 이름이 'balance-defaults.js'가 아닙니다 (${handle.name}). 그대로 진행할까요?`);
        if (!ok) { await clearStoredHandle(); return; }
      }
    }
    const granted = await ensureWritePermission(handle);
    if (!granted) { showToast('파일 쓰기 권한 거부됨', 'fail'); return; }
    const fileText = generateBalanceDefaultsFile(next);
    await writeToHandle(handle, fileText);
    showToast('파일 저장 완료. Claude에게 "커밋해줘" 요청하세요.', 'success');
    refreshFsStatus();
  } catch (e) {
    if (e.name === 'AbortError') return; // user cancelled picker
    console.error(e);
    showToast('저장 실패: ' + (e.message || e.name), 'fail');
  }
}

async function refreshFsStatus() {
  const text = $('fs-status-text');
  const actions = $('fs-status-actions');
  const directBtn = $('ad-save-direct');
  const bar = $('fs-status-bar');
  if (!text || !actions || !directBtn || !bar) return;

  if (!FS_API_SUPPORTED) {
    bar.className = 'fs-status-bar unsupported';
    text.textContent = '이 브라우저는 직접 저장 미지원 — Chrome/Edge 사용 시 활성화';
    actions.innerHTML = '';
    directBtn.disabled = true;
    directBtn.title = 'Chrome/Edge에서만 동작';
    return;
  }

  const handle = await getStoredHandle();
  if (handle) {
    bar.className = 'fs-status-bar connected';
    text.textContent = `🔗 연결됨: ${handle.name}`;
    actions.innerHTML = '<button class="fs-action-link" id="fs-disconnect-btn" type="button">연결 해제</button>';
    $('fs-disconnect-btn').addEventListener('click', async () => {
      await clearStoredHandle();
      showToast('연결 해제됨', 'success');
      refreshFsStatus();
    });
  } else {
    bar.className = 'fs-status-bar';
    text.textContent = '⚪ 파일 연결 안됨 — [💾 프로젝트 파일에 저장] 첫 클릭 시 파일 선택';
    actions.innerHTML = '<button class="fs-action-link" id="fs-connect-btn" type="button">파일 연결</button>';
    $('fs-connect-btn').addEventListener('click', async () => {
      try {
        await pickProjectFile();
        showToast('파일 연결 완료', 'success');
        refreshFsStatus();
      } catch (e) {
        if (e.name !== 'AbortError') showToast('파일 연결 실패: ' + (e.message || e.name), 'fail');
      }
    });
  }
}

// =============== TABS ===============
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tabpanel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    $('admin-tab-' + tab.dataset.tab).classList.add('active');
  });
});

// =============== EVENT WIRING ===============
$('ad-apply-local').addEventListener('click', applyLocal);
$('ad-save-direct').addEventListener('click', saveDirectToProjectFile);
$('ad-export-defaults').addEventListener('click', exportDefaultsFile);
$('ad-export-json').addEventListener('click', exportJSON);
$('ad-import').addEventListener('click', triggerImport);
$('ad-import-file').addEventListener('change', e => {
  const f = e.target.files[0];
  if (f) handleImport(f);
  e.target.value = '';
});
$('ad-reset').addEventListener('click', resetToDefaults);

// Initial render
populateForm();
refreshFsStatus();
