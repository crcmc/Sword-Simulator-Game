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

  const next = {
    startGold: intv('ad-startGold'),
    costBase: num('ad-costBase'),
    costExp: num('ad-costExp'),
    costMult: num('ad-costMult'),
    sellAnchor: num('ad-sellAnchor'),
    sellAnchorLvl: intv('ad-sellAnchorLvl'),
    sellRatio: num('ad-sellRatio'),
    shopStone: intv('ad-shopStone'),
    shopProtect1: intv('ad-shopProtect1'),
    shopProtect10: intv('ad-shopProtect10'),
    fragmentBonus: num('ad-fragmentBonus'),
    stoneBonusEach: num('ad-stoneBonusEach'),
    stoneMaxStack: intv('ad-stoneMaxStack'),
    destroyRefundRate: num('ad-destroyRefundRate'),
    fragmentDropMin: intv('ad-fragmentDropMin'),
    fragmentDropMax: intv('ad-fragmentDropMax'),
    startingIron: intv('ad-startingIron'),
    startIronCost: intv('ad-startIronCost'),
    summonBaseCost: Math.max(1, intv('ad-summonBaseCost')),
    materialStartLvl: intv('ad-materialStartLvl'),
    materialOffset: intv('ad-materialOffset'),
    successRates: [],
    protectStoneCost: [],
    failureRules: [],
    swordNames: [],
    tierNames: [],
    tierColors: [],
    tierLore: [],
    resourceNames: []
  };

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

// =============== EXPORT balance-defaults.js (for git commit) ===============
function exportDefaultsFile() {
  const next = readForm();
  const err = validate(next);
  if (err) { showToast(err, 'fail'); return; }

  // Pretty-print balance — readable JS-style with sensible line breaks.
  // Use JSON.stringify with 2-space indent then unquote keys for nicer JS look.
  const json = JSON.stringify(next, null, 2);
  // Convert "keyName": → keyName: for top-level keys (cosmetic only).
  // Keep it as JSON for safety; valid JSON is also valid JS expression.

  const fileText = `/* ============================================================
   balance-defaults.js — single source of truth for game balance
   Loaded by: sword-enhancement.html, sword-rental.html, sword-dungeon.html, admin.html
   Defines globals: BALANCE_KEY, deepClone, BALANCE_DEFAULTS, ADMIN_HASH

   Generated by admin.html → balance-defaults.js 다운로드
   생성 시각: ${new Date().toISOString()}
   ============================================================ */

const BALANCE_KEY = 'sword_balance_overrides_v1';

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// SHA-256 hash of the admin secret. Rotate by replacing with the new sha256.
const ADMIN_HASH = '${ADMIN_HASH}';

const BALANCE_DEFAULTS = ${json};
`;

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
