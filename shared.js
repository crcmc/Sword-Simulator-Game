/* ============================================================
   shared.js — Sword Enhancement common module
   Used by: sword-rental.html, sword-dungeon.html
   (sword-enhancement.html keeps its own inline copy for now)
   ============================================================ */

// =============== CONSTANTS ===============
const MAX_LEVEL = 30;
const SAVE_KEY_PREFIX = 'sword_enhancement_save_v4__';
const LEGACY_SAVE_KEY = 'sword_enhancement_save_v4';
const FORGE_KEY = 'sword_enhancement_forge_v1';
const BALANCE_KEY = 'sword_balance_overrides_v1';
let SAVE_KEY = '';
const RESOURCE_KEYS = ['iron','steel','mystic','crystal','inferno','legendary'];

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// =============== BALANCE ===============
const BALANCE_DEFAULTS = {
  startGold: 1000000,
  costBase: 100, costExp: 1.55, costMult: 1,
  sellAnchor: 1000000, sellAnchorLvl: 10, sellRatio: 1.5,
  shopStone: 100000, shopProtect1: 2000000, shopProtect10: 15000000,
  fragmentBonus: 10, stoneBonusEach: 5, stoneMaxStack: 3,
  destroyRefundRate: 0.2, fragmentDropMin: 2, fragmentDropMax: 4,
  failureRules: [
    { maxLevel: 3,  maintain: 1.0, downgrade: 0.0, destroy: 0.0 },
    { maxLevel: 9,  maintain: 0.7, downgrade: 0.3, destroy: 0.0 },
    { maxLevel: 99, maintain: 0.5, downgrade: 0.3, destroy: 0.2 }
  ],
  materialStartLvl: 19, materialOffset: 18,
  resourceNames: ['철', '강철', '신비석', '수정', '화염석', '전설석'],
  startingIron: 100, startIronCost: 1, summonBaseCost: 1,
  dungeons: [
    { name: '철광산',     durationMs:       20000, successRate: 100, baseRewardGold:      50, baseRewardResource:  1 },
    { name: '강철 채굴장', durationMs:       60000, successRate:  90, baseRewardGold:     200, baseRewardResource:  1 },
    { name: '신비의 동굴', durationMs:      120000, successRate:  80, baseRewardGold:     800, baseRewardResource:  1 },
    { name: '수정 광산',   durationMs:     1800000, successRate:  70, baseRewardGold:    5000, baseRewardResource:  2 },
    { name: '화염 던전',   durationMs:    14400000, successRate:  60, baseRewardGold:   50000, baseRewardResource:  2 },
    { name: '전설 심연',   durationMs:  4320000000, successRate:  50, baseRewardGold: 5000000, baseRewardResource:  5 }
  ],
  // Tier mismatch (sword tier vs dungeon tier)
  tierMismatchPenalty: 15,        // % success rate reduction per tier UNDER (gap=-N → -N×15%)
  tierMismatchBonus: 5,           // % success rate bonus per tier OVER (gap=+N → +N×5%)
  tierMismatchTimeBonus: 10,      // % duration reduction per tier OVER (capped at 50%)
  tierMismatchTimePenalty: 10,    // % duration EXTENSION per tier UNDER (capped at 100%)
  // Hero applicants
  applicantBaseIntervalMs: 30000, // T0 sword cycle interval; higher tier swords have shorter cycles
  applicantMaxPerSword: 10,       // max applicants per sword level
  applicantMaxTotal: 100,         // global hard cap
  successRates: [
    100, 95, 90, 85, 78, 70, 60, 50, 42, 35,
    28, 23, 19, 15, 12, 10,  8,  6, 4.5, 3.5,
    2.7, 2.0, 1.5, 1.1, 0.8, 0.6, 0.4, 0.25, 0.15, 0.08
  ],
  swordNames: [
    '평범한 철검', '단련된 철검', '예리한 철검', '빛나는 철검', '정교한 철검',
    '강철검', '단단한 강철검', '명장의 강철검', '군주의 강철검', '최상급 강철검',
    '신비한 검', '룬이 새겨진 검', '마법사의 검', '정령의 검', '드루이드의 검',
    '수정 검', '빙결의 수정검', '영혼의 수정검', '심연의 수정검', '어둠의 수정검',
    '화염검', '용염의 검', '작열의 검', '불멸의 화염검', '멸세의 화염검',
    '전설의 검', '천상의 검', '신성의 검', '창조의 검', '영원의 검', '천공의 패검'
  ],
  tierNames: ['Iron', 'Steel', 'Mystic', 'Crystal', 'Inferno', 'Legendary'],
  tierColors: ['#cdd5e0', '#9bd4ff', '#4d6dff', '#c060ff', '#ff5060', '#ffd700'],
  tierLore: [
    '마을 대장간에서 단조한 평범한 검. 견습공이 처음 휘둘러보는 무기.',
    '정련된 강철로 빚어진 견고한 검. 정규 기사단의 표준 무장.',
    '마법의 룬이 새겨진 신비로운 검. 마탑의 고서에 기록된 자취.',
    '수정 핵심에서 빛이 흘러나오는 검. 정령의 가호가 깃들었다.',
    '타오르는 화염을 머금은 검. 휘두를 때마다 대지가 진동한다.',
    '전설로 전해지는 신화의 검. 그 진가를 본 자는 살아남지 못했다.'
  ]
};

function loadBalance() {
  try {
    const raw = localStorage.getItem(BALANCE_KEY);
    if (!raw) return deepClone(BALANCE_DEFAULTS);
    return Object.assign(deepClone(BALANCE_DEFAULTS), JSON.parse(raw));
  } catch (e) { return deepClone(BALANCE_DEFAULTS); }
}
function saveBalance() {
  const overrides = {};
  for (const k in balance) {
    if (JSON.stringify(balance[k]) !== JSON.stringify(BALANCE_DEFAULTS[k])) overrides[k] = balance[k];
  }
  if (Object.keys(overrides).length === 0) localStorage.removeItem(BALANCE_KEY);
  else localStorage.setItem(BALANCE_KEY, JSON.stringify(overrides));
}
function resetBalance() { balance = deepClone(BALANCE_DEFAULTS); localStorage.removeItem(BALANCE_KEY); applyBalance(); }

let balance = loadBalance();
let SUCCESS_RATES = balance.successRates;
let SWORD_NAMES = balance.swordNames;
let TIER_TIER_NAMES = balance.tierNames;
let TIER_COLORS = balance.tierColors;
let TIER_LORE = balance.tierLore;
let SHOP_PRICE_STONE = balance.shopStone;
let SHOP_PRICE_PROTECT_1 = balance.shopProtect1;
let SHOP_PRICE_PROTECT_10 = balance.shopProtect10;

function applyBalance() {
  SUCCESS_RATES = balance.successRates;
  SWORD_NAMES = balance.swordNames;
  TIER_TIER_NAMES = balance.tierNames;
  TIER_COLORS = balance.tierColors;
  TIER_LORE = balance.tierLore;
  SHOP_PRICE_STONE = balance.shopStone;
  SHOP_PRICE_PROTECT_1 = balance.shopProtect1;
  SHOP_PRICE_PROTECT_10 = balance.shopProtect10;
  saveBalance();
  if (typeof render === 'function') render();
}

// =============== HELPERS ===============
function getTier(level) {
  if (level <= 4) return 0;
  if (level <= 9) return 1;
  if (level <= 14) return 2;
  if (level <= 19) return 3;
  if (level <= 24) return 4;
  return 5;
}
function getSubLevel(level) { return level - [0,5,10,15,20,25][getTier(level)]; }
function tierBounds(tier) {
  const min = tier * 5;
  const max = tier === 5 ? 30 : (min + 4);
  return { min, max };
}
function cleanRound(n) {
  if (n <= 0) return 0;
  if (n < 100) return 100;
  const log = Math.floor(Math.log10(n));
  const factor = Math.pow(10, Math.max(2, log - 1));
  return Math.round(n / factor) * factor;
}
function getCost(level) {
  return Math.round(Math.pow(level + 1, balance.costExp)) * balance.costBase * balance.costMult;
}
function getSellPrice(level) {
  if (level <= 0) return 0;
  return cleanRound(balance.sellAnchor * Math.pow(balance.sellRatio, level - balance.sellAnchorLvl));
}
function getMaterialReq(currentLevel) {
  if (currentLevel < balance.materialStartLvl) return null;
  return { level: currentLevel, count: currentLevel - balance.materialOffset };
}
function rollFailure(level) {
  for (const rule of balance.failureRules) {
    if (level <= rule.maxLevel) {
      const r = Math.random();
      if (r < rule.maintain) return 'maintain';
      if (r < rule.maintain + rule.downgrade) return 'downgrade';
      return 'destroy';
    }
  }
  return 'maintain';
}
function getSummonCost(level) {
  const sublevel = level - getTier(level) * 5;
  return Math.max(1, balance.summonBaseCost) * Math.pow(2, sublevel);
}

// =============== STATE ===============
function defaultState() {
  return {
    level: 0,
    gold: balance.startGold,
    fragments: 0, stones: 0, protections: 0,
    useFragment: false, useStones: 0, useProtection: false,
    soundOn: true,
    collection: new Array(31).fill(0),
    unlocked: new Array(31).fill(false).map((_, i) => i === 0),
    resources: { iron: balance.startingIron, steel: 0, mystic: 0, crystal: 0, inferno: 0, legendary: 0 },
    rentals: [],
    deadSwords: [],
    applicants: [],
    lastApplicantGen: {},
    dungeonProgress: {
      0: { unlocked: true,  bestFloor: 0 },
      1: { unlocked: false, bestFloor: 0 },
      2: { unlocked: false, bestFloor: 0 },
      3: { unlocked: false, bestFloor: 0 },
      4: { unlocked: false, bestFloor: 0 },
      5: { unlocked: false, bestFloor: 0 }
    },
    stats: {
      attempts: 0, success: 0, fail: 0, broken: 0,
      sold: 0, stored: 0, best: 0,
      goldSpent: 0, goldEarned: 0,
      rentalsStarted: 0, rentalsSucceeded: 0, rentalsFailed: 0
    },
    log: []
  };
}

let state = defaultState();

function loadState() {
  try {
    if (!SAVE_KEY) return defaultState();
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const def = defaultState();
    return Object.assign({}, def, parsed, {
      stats: Object.assign({}, def.stats, parsed.stats || {}),
      resources: Object.assign({}, def.resources, parsed.resources || {}),
      collection: Array.isArray(parsed.collection) && parsed.collection.length === 31 ? parsed.collection : def.collection,
      unlocked: Array.isArray(parsed.unlocked) && parsed.unlocked.length === 31 ? parsed.unlocked : def.unlocked,
      rentals: Array.isArray(parsed.rentals) ? parsed.rentals : def.rentals,
      deadSwords: Array.isArray(parsed.deadSwords) ? parsed.deadSwords : def.deadSwords,
      applicants: Array.isArray(parsed.applicants) ? parsed.applicants : def.applicants,
      lastApplicantGen: Object.assign({}, def.lastApplicantGen, parsed.lastApplicantGen || {}),
      dungeonProgress: Object.assign({}, def.dungeonProgress, parsed.dungeonProgress || {})
    });
  } catch (e) { return defaultState(); }
}
function saveState() {
  try {
    if (SAVE_KEY) {
      state.lastPlayedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }
  } catch (e) {}
}

// =============== MULTI-FORGE MANAGEMENT ===============
function listForges() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key.indexOf(SAVE_KEY_PREFIX) !== 0) continue;
    const name = key.slice(SAVE_KEY_PREFIX.length);
    if (!name) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (!data) continue;
      out.push({
        name: name,
        lastPlayedAt: data.lastPlayedAt || 0,
        level: data.level || 0,
        gold: data.gold || 0,
        bestLevel: (data.stats && data.stats.best) || 0,
        unlockedCount: ((data.unlocked) || []).filter(Boolean).length,
        rentalCount: ((data.rentals) || []).length
      });
    } catch (e) {
      out.push({ name: name, lastPlayedAt: 0, level: 0, gold: 0, bestLevel: 0, unlockedCount: 0, rentalCount: 0 });
    }
  }
  out.sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
  return out;
}
function switchForge(name) {
  const validName = validateForgeName(name);
  if (!validName) return false;
  const key = SAVE_KEY_PREFIX + validName;
  if (!localStorage.getItem(key)) return false;
  const existing = forge && forge.name === validName ? forge : null;
  forge = {
    name: validName,
    createdAt: existing?.createdAt || Date.now(),
    renamedAt: existing?.renamedAt || Date.now(),
    lastPlayedAt: Date.now()
  };
  saveForge();
  SAVE_KEY = key;
  state = loadState();
  return true;
}
// Create a NEW forge without renaming current. If name already exists, switches to it.
function createForge(rawName) {
  const name = validateForgeName(rawName);
  if (!name) return false;
  const newKey = SAVE_KEY_PREFIX + name;
  if (localStorage.getItem(newKey)) {
    return switchForge(name);
  }
  // First-time setup: migrate legacy un-namespaced data
  if (!forge) {
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacy) {
      localStorage.setItem(newKey, legacy);
      localStorage.removeItem(LEGACY_SAVE_KEY);
    }
  }
  forge = { name, createdAt: Date.now(), renamedAt: Date.now(), lastPlayedAt: Date.now() };
  saveForge();
  SAVE_KEY = newKey;
  state = loadState();
  saveState();
  return true;
}
function deleteForge(name) {
  const validName = validateForgeName(name);
  if (!validName) return false;
  localStorage.removeItem(SAVE_KEY_PREFIX + validName);
  if (forge && forge.name === validName) {
    forge = null;
    SAVE_KEY = '';
    localStorage.removeItem(FORGE_KEY);
  }
  return true;
}
function formatRelativeTime(ts) {
  if (!ts) return '신규';
  const diff = Date.now() - ts;
  if (diff < 60000) return '방금';
  if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
  if (diff < 86400000 * 30) return Math.floor(diff / 86400000) + '일 전';
  return Math.floor(diff / (86400000 * 30)) + '개월 전';
}

// =============== FORGE ===============
function loadForge() {
  try {
    const raw = localStorage.getItem(FORGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string' && parsed.name.length > 0) return parsed;
    return null;
  } catch (e) { return null; }
}
function saveForge() {
  if (forge && forge.name) localStorage.setItem(FORGE_KEY, JSON.stringify(forge));
}
function validateForgeName(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.split('').filter(function(ch) {
    var c = ch.charCodeAt(0);
    return c >= 0x20 && c !== 0x7f;
  }).join('').trim();
  if (cleaned.length === 0) return null;
  if (cleaned.length > 16) return null;
  return cleaned;
}
function setupForge(rawName) {
  const name = validateForgeName(rawName);
  if (!name) return false;
  const oldForge = forge;
  const newKey = SAVE_KEY_PREFIX + name;
  if (!oldForge) {
    if (!localStorage.getItem(newKey)) {
      const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
      if (legacy) { localStorage.setItem(newKey, legacy); localStorage.removeItem(LEGACY_SAVE_KEY); }
    }
  } else if (oldForge.name !== name) {
    const oldKey = SAVE_KEY_PREFIX + oldForge.name;
    const oldData = localStorage.getItem(oldKey);
    if (oldData) { localStorage.setItem(newKey, oldData); localStorage.removeItem(oldKey); }
  }
  forge = { name: name, createdAt: oldForge?.createdAt || Date.now(), renamedAt: Date.now() };
  saveForge();
  SAVE_KEY = newKey;
  return true;
}

let forge = loadForge();

// =============== SWORD VISUAL ===============
const TIER_PATTERNS = {
  0: [
    '................','.......BB.......','.......BB.......','......BEEB......',
    '......BEEB......','......BEEB......','......BEEB......','......BEEB......',
    '......BEEB......','......BEEB......','......BEEB......','......BEEB......',
    '......BEEB......','......BEEB......','......BEEB......','......BEEB......',
    '......BEEB......','......BEEB......','......BEEB......','......BBBB......',
    '.....gGGGGg.....','....gGGGGGGg....','....gggGGggg....','.....HhhhhH.....',
    '.....HhhhhH.....','.....HhhhhH.....','.....HhhhhH.....','....HHhhhhHH....',
    '....HJJJJJJH....','....HJJJJJJH....','.....HJJJJH.....','................'
  ],
  1: [
    '.......BB.......','.......BB.......','......BEEB......','......BEEB......',
    '......BEEB......','.....BEEEEB.....','.....BEEEEB.....','.....BEEEEB.....',
    '.....BEEEEB.....','.....BEEEEB.....','.....BEEEEB.....','.....BEEEEB.....',
    '.....BEEEEB.....','.....BEEEEB.....','.....BEEEEB.....','.....BEEEEB.....',
    '.....BEEEEB.....','.....BEEEEB.....','.....BEEEEB.....','.....BEEEEB.....',
    '.....BBEEBB.....','GGGGGGggggGGGGGG','GGGGGGggggGGGGGG','gGGGGggggggGGGGg',
    '.....HhhhhH.....','.....HhhhhH.....','.....HhhhhH.....','.....HhhhhH.....',
    '....HHhhhhHH....','....HJJJJJJH....','....HJJJJJJH....','.....HJJJJH.....'
  ],
  2: [
    '.......BB.......','.......BB.......','......BEEB......','......BEEB......',
    '.....BBEEBB.....','.....BECCEB.....','.....BECCEB.....','.....BECCEB.....',
    '.....BECCEB.....','.....BECCEB.....','.....BECCEB.....','.....BECCEB.....',
    '.....BECCEB.....','.....BECCEB.....','.....BECCEB.....','.....BECCEB.....',
    '.....BECCEB.....','.....BECCEB.....','.....BECCEB.....','.....BEEEEB.....',
    '.....BBEEBB.....','GGGGGOggggOGGGGG','GGGGOOggggOOGGGG','gGGggggggggggGGg',
    '.....HhhhhH.....','.....HhhhhH.....','.....HhhhhH.....','....HHhhhhHH....',
    '....HJJJJJJH....','...HJjJJJJjJH...','....HJJJJJJH....','.....HJJJJH.....'
  ],
  3: [
    '.......BB.......','......BEEB......','......BEEB......','.....BEEEEB.....',
    '....BEEEEEEB....','....BECCCCEB....','....BECCCCEB....','....BECCCCEB....',
    '....BECCCCEB....','....BECCCCEB....','....BECCCCEB....','....BECCCCEB....',
    '....BECCCCEB....','....BECCCCEB....','....BECCCCEB....','....BECCCCEB....',
    '....BECCCCEB....','....BECCCCEB....','....BECCCCEB....','....BBEEEEBB....',
    '....BBBBBBBB....','GGGGOOggggOOGGGG','gGGOggggggggOGGg','gGGggggggggggGGg',
    '.....HhhhhH.....','.....HhhhhH.....','.....HhhhhH.....','....HHhhhhHH....',
    '...HJjJJJJjJH...','...HjJJJJJJjH...','...HJjJJJJjJH...','....HJJJJJJH....'
  ],
  4: [
    '.......BB.......','......BEEB......','.....BEEEEB.....','....BBEEEEBB....',
    '....BEEEEEEB....','....BECCCCEB....','....BECCCCEB....','...BBECCCCEBB...',
    '...BEECCCCEEB...','....BECCCCEB....','....BECCCCEB....','...BBECCCCEBB...',
    '...BEECCCCEEB...','....BECCCCEB....','....BECCCCEB....','....BECCCCEB....',
    '....BECCCCEB....','....BECCCCEB....','....BECCCCEB....','....BECCCCEB....',
    '....BBEEEEBB....','gGGOOggggggOOGGg','gGOOggggggggOOGg','GGggggggggggggGG',
    '.....HhhhhH.....','.....HhhhhH.....','.....HhhhhH.....','....HHhhhhHH....',
    '...HJjJJJJjJH...','...HjJJJJJJjH...','...HJjJJJJjJH...','....HJJJJJJH....'
  ],
  5: [
    '.......BB.......','......BEEB......','.....BEEEEB.....','....BEEEEEEB....',
    '...BBEEEEEEBB...','...BEECCCCEEB...','...BEECCCCEEB...','...BEECCCCEEB...',
    '..BBEECCCCEEBB..','..BEEECCCCEEEB..','...BEECCCCEEB...','..BBEECCCCEEBB..',
    '..BEEECCCCEEEB..','...BEECCCCEEB...','...BEECCCCEEB...','...BEECCCCEEB...',
    '...BEECCCCEEB...','...BEECCCCEEB...','...BEECCCCEEB...','...BEECCCCEEB...',
    '...BBEEEEEEBB...','gGOOggggggggOOGg','GOOgggggggggggOO','gGggggggggggggGg',
    '.....HhhhhH.....','.....HhhhhH.....','....HHhhhhHH....','...HHhhhhhhHH...',
    '..HJjjJJJJjjJH..','..HjJJJJJJJJjH..','..HJjjJJJJjjJH..','...HJJJJJJJJH...'
  ]
};
const TIER_DECOR = {
  0: [[],[[7,28,'j']],[[7,28,'j'],[8,28,'j']],[[7,28,'j'],[8,28,'j'],[7,14,'r']],[[7,28,'j'],[8,28,'j'],[7,14,'r'],[8,14,'r']]],
  1: [[],[[7,13,'r']],[[7,13,'r'],[8,13,'r']],[[7,13,'r'],[8,13,'r'],[7,17,'r']],[[7,13,'r'],[8,13,'r'],[7,17,'r'],[8,17,'r']]],
  2: [[],[[7,9,'r']],[[7,9,'r'],[8,9,'r']],[[7,9,'r'],[8,9,'r'],[7,14,'r']],[[7,9,'r'],[8,9,'r'],[7,14,'r'],[8,14,'r']]],
  3: [[],[[6,10,'r'],[9,10,'r']],[[6,10,'r'],[9,10,'r'],[6,15,'r'],[9,15,'r']],[[6,10,'r'],[9,10,'r'],[6,15,'r'],[9,15,'r'],[7,13,'j']],[[6,10,'r'],[9,10,'r'],[6,15,'r'],[9,15,'r'],[7,13,'j'],[8,13,'j']]],
  4: [[],[[7,6,'r'],[8,6,'r']],[[7,6,'r'],[8,6,'r'],[7,17,'r'],[8,17,'r']],[[7,6,'r'],[8,6,'r'],[7,17,'r'],[8,17,'r'],[7,10,'s']],[[7,6,'r'],[8,6,'r'],[7,17,'r'],[8,17,'r'],[7,10,'s'],[8,10,'s']]],
  5: [[],[[7,7,'s']],[[6,7,'s'],[9,7,'s']],[[6,7,'s'],[9,7,'s'],[6,14,'s'],[9,14,'s']],[[6,7,'s'],[9,7,'s'],[6,14,'s'],[9,14,'s'],[6,17,'s'],[9,17,'s']],[[6,7,'s'],[9,7,'s'],[6,14,'s'],[9,14,'s'],[6,17,'s'],[9,17,'s'],[7,11,'s'],[8,11,'s']]]
};
const PALETTE_KEYFRAMES = [
  { l: 0,  base:'#9aa4b2', edge:'#cdd5e0', dark:'#5a6270', core:'#7f8a99', guard:'#7c5b2e', guardDark:'#4a3517', ornament:'#bfb6a0', handle:'#3b2a1a', handleDark:'#221408', jewel:'#a8a8b0', jewelHi:'#d4d4dc', rune:'#5a6270', star:'#ffffff', glowR:155, glowG:164, glowB:178, glowA: 0.0 },
  { l: 5,  base:'#a8c0d8', edge:'#dceaf6', dark:'#506680', core:'#7f9bb8', guard:'#a07a40', guardDark:'#604824', ornament:'#9bd4ff', handle:'#3b2a1a', handleDark:'#221408', jewel:'#9bd4ff', jewelHi:'#d0eaff', rune:'#3a5078', star:'#ffffff', glowR:155, glowG:212, glowB:255, glowA: 0.30 },
  { l: 10, base:'#5070d0', edge:'#a0b8e8', dark:'#202a60', core:'#3050b0', guard:'#cca040', guardDark:'#806020', ornament:'#4d6dff', handle:'#3b2a1a', handleDark:'#221408', jewel:'#4d6dff', jewelHi:'#a0b0ff', rune:'#80b0ff', star:'#ffffff', glowR: 77, glowG:109, glowB:255, glowA: 0.55 },
  { l: 15, base:'#a040d8', edge:'#d080ff', dark:'#501880', core:'#7028b0', guard:'#d4af37', guardDark:'#806820', ornament:'#c060ff', handle:'#3b2a1a', handleDark:'#221408', jewel:'#c060ff', jewelHi:'#e0a0ff', rune:'#ffd0ff', star:'#ffffff', glowR:192, glowG: 96, glowB:255, glowA: 0.72 },
  { l: 20, base:'#e02040', edge:'#ff8090', dark:'#600810', core:'#a0102a', guard:'#ffd700', guardDark:'#a08000', ornament:'#ff5060', handle:'#4a1f1f', handleDark:'#2a0a0a', jewel:'#ff5060', jewelHi:'#ffa0b0', rune:'#ffd040', star:'#ffffff', glowR:255, glowG: 32, glowB: 64, glowA: 0.85 },
  { l: 25, base:'#ff8010', edge:'#ffc060', dark:'#a04000', core:'#d06010', guard:'#fff080', guardDark:'#d4a020', ornament:'#ffaa20', handle:'#4a2010', handleDark:'#2a0a05', jewel:'#ffd040', jewelHi:'#ffffa0', rune:'#ffffff', star:'#ffffff', glowR:255, glowG:128, glowB: 16, glowA: 0.95 },
  { l: 30, base:'#fff8c0', edge:'#ffffff', dark:'#d4a020', core:'#ffd700', guard:'#ffffff', guardDark:'#ffd700', ornament:'#ff60ff', handle:'#5a2020', handleDark:'#2a0a0a', jewel:'#ff60ff', jewelHi:'#ffffff', rune:'#ffffff', star:'#ffffff', glowR:255, glowG:215, glowB:  0, glowA: 1.00 }
];
const SILHOUETTE_PALETTE = {
  base:'#0e0e18', edge:'#181822', dark:'#000', core:'#0e0e18',
  guard:'#0e0e18', guardDark:'#000', ornament:'#181822',
  handle:'#0e0e18', handleDark:'#000',
  jewel:'#181822', jewelHi:'#0e0e18', rune:'#000', star:'#181822',
  glow:'transparent', glowR:0, glowG:0, glowB:0, glowA:0
};

function lerpHex(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
  const r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
  const r = Math.round(r1+(r2-r1)*t), g = Math.round(g1+(g2-g1)*t), b = Math.round(b1+(b2-b1)*t);
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
function getSwordPalette(level) {
  let lo = PALETTE_KEYFRAMES[0], hi = PALETTE_KEYFRAMES[PALETTE_KEYFRAMES.length-1];
  for (let i = 0; i < PALETTE_KEYFRAMES.length - 1; i++) {
    if (level >= PALETTE_KEYFRAMES[i].l && level <= PALETTE_KEYFRAMES[i+1].l) {
      lo = PALETTE_KEYFRAMES[i]; hi = PALETTE_KEYFRAMES[i+1]; break;
    }
  }
  const t = (hi.l === lo.l) ? 0 : (level - lo.l) / (hi.l - lo.l);
  const result = {};
  ['base','edge','dark','core','guard','guardDark','ornament','handle','handleDark','jewel','jewelHi','rune','star'].forEach(k => {
    result[k] = lerpHex(lo[k], hi[k], t);
  });
  const gr = Math.round(lo.glowR + (hi.glowR - lo.glowR) * t);
  const gg = Math.round(lo.glowG + (hi.glowG - lo.glowG) * t);
  const gb = Math.round(lo.glowB + (hi.glowB - lo.glowB) * t);
  const ga = lo.glowA + (hi.glowA - lo.glowA) * t;
  result.glow = `rgba(${gr},${gg},${gb},${ga})`;
  return result;
}
function buildSwordSVG(level, options) {
  options = options || {};
  const silhouette = !!options.silhouette;
  const width = options.width || 200;
  const tier = getTier(level);
  const sub = level - tier * 5;
  const p = silhouette ? SILHOUETTE_PALETTE : getSwordPalette(level);
  const pattern = TIER_PATTERNS[tier];
  const decor = TIER_DECOR[tier][sub] || [];
  const grid = pattern.map(r => r.split(''));
  decor.forEach(([x, y, ch]) => { if (grid[y] && x >= 0 && x < 16) grid[y][x] = ch; });
  const cols = 16, rows = 32, px = 8, w = cols*px, h = rows*px;
  let rects = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = grid[y][x];
      if (!ch || ch === '.') continue;
      let fill = '#000';
      switch(ch) {
        case 'B': fill = p.base; break; case 'E': fill = p.edge; break;
        case 'C': fill = p.core; break; case 'G': fill = p.guard; break;
        case 'g': fill = p.guardDark; break; case 'O': fill = p.ornament; break;
        case 'H': fill = p.handle; break; case 'h': fill = p.handleDark; break;
        case 'J': fill = p.jewel; break; case 'j': fill = p.jewelHi; break;
        case 'r': fill = p.rune; break; case 's': fill = p.star; break;
      }
      rects += `<rect x="${x*px}" y="${y*px}" width="${px}" height="${px}" fill="${fill}"/>`;
      if (!silhouette && (ch === 'B' || ch === 'G' || ch === 'H' || ch === 'C')) {
        rects += `<rect x="${x*px}" y="${y*px+px-1}" width="${px}" height="1" fill="${p.dark}" opacity="0.55"/>`;
      }
    }
  }
  let overlay = '', aura = '', sparkles = '';
  if (!silhouette) {
    if (level >= 28) overlay = `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#rainbow)" opacity="0.30" style="mix-blend-mode:overlay"/>`;
    if (level >= 4) {
      const auraOpacity = Math.min(0.5, 0.05 + level * 0.013);
      aura = `<circle cx="${w/2}" cy="${h/2}" r="${w*0.65}" fill="${p.glow}" opacity="${auraOpacity}"/>`;
    }
    if (level >= 25) {
      const numStars = 3 + (level - 25) * 2;
      for (let i = 0; i < numStars; i++) {
        const sx = 8 + Math.sin(i * 1.7) * 50 + w/2;
        const sy = 30 + Math.cos(i * 1.3) * 80 + h/2;
        sparkles += `<rect x="${sx}" y="${sy}" width="3" height="3" fill="${p.star}" opacity="0.8"/>`;
      }
    }
  }
  const aspect = (h + 56) / (w + 24);
  return `<svg viewBox="-12 -28 ${w+24} ${h+56}" width="${width}" height="${width*aspect}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="rainbow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ff0080"/><stop offset="20%" stop-color="#ff8000"/>
      <stop offset="40%" stop-color="#ffff00"/><stop offset="60%" stop-color="#00ff80"/>
      <stop offset="80%" stop-color="#0080ff"/><stop offset="100%" stop-color="#8000ff"/>
    </linearGradient></defs>
    ${aura}${rects}${sparkles}${overlay}
  </svg>`;
}

// =============== ITEM ICONS ===============
function buildFragmentSVG() {
  return `<svg viewBox="0 0 16 16" width="36" height="36" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="6" y="2" width="2" height="2" fill="#cdd5e0"/><rect x="5" y="4" width="3" height="2" fill="#9aa4b2"/>
    <rect x="8" y="4" width="2" height="2" fill="#cdd5e0"/><rect x="4" y="6" width="3" height="2" fill="#7f8a99"/>
    <rect x="7" y="6" width="3" height="2" fill="#9aa4b2"/><rect x="10" y="6" width="2" height="2" fill="#cdd5e0"/>
    <rect x="3" y="8" width="3" height="2" fill="#5a6270"/><rect x="6" y="8" width="3" height="2" fill="#7f8a99"/>
    <rect x="9" y="8" width="3" height="2" fill="#9aa4b2"/><rect x="2" y="10" width="3" height="2" fill="#5a6270"/>
    <rect x="5" y="10" width="3" height="2" fill="#7f8a99"/><rect x="8" y="10" width="3" height="2" fill="#5a6270"/>
    <rect x="3" y="12" width="3" height="2" fill="#3a4250"/></svg>`;
}
function buildStoneSVG() {
  return `<svg viewBox="0 0 16 16" width="36" height="36" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="6" y="2" width="4" height="2" fill="#e0a0ff"/><rect x="4" y="4" width="2" height="2" fill="#c060ff"/>
    <rect x="6" y="4" width="4" height="2" fill="#e0a0ff"/><rect x="10" y="4" width="2" height="2" fill="#a040d0"/>
    <rect x="3" y="6" width="2" height="4" fill="#a040d0"/><rect x="5" y="6" width="6" height="4" fill="#c060ff"/>
    <rect x="6" y="6" width="2" height="2" fill="#fff"/><rect x="11" y="6" width="2" height="4" fill="#7028a0"/>
    <rect x="4" y="10" width="2" height="2" fill="#7028a0"/><rect x="6" y="10" width="4" height="2" fill="#a040d0"/>
    <rect x="10" y="10" width="2" height="2" fill="#502080"/><rect x="6" y="12" width="4" height="2" fill="#502080"/></svg>`;
}
function buildProtectSVG() {
  return `<svg viewBox="0 0 16 16" width="36" height="36" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="6" y="1" width="4" height="1" fill="#a7f3d0"/>
    <rect x="4" y="2" width="8" height="2" fill="#5eead4"/><rect x="6" y="2" width="2" height="1" fill="#a7f3d0"/>
    <rect x="3" y="4" width="10" height="2" fill="#2dd4bf"/><rect x="5" y="4" width="2" height="1" fill="#a7f3d0"/>
    <rect x="3" y="6" width="10" height="2" fill="#14b8a6"/><rect x="6" y="6" width="4" height="1" fill="#5eead4"/>
    <rect x="3" y="8" width="10" height="2" fill="#0d9488"/><rect x="4" y="10" width="8" height="2" fill="#0f766e"/>
    <rect x="5" y="12" width="6" height="2" fill="#115e59"/><rect x="7" y="14" width="2" height="1" fill="#0f766e"/></svg>`;
}

// =============== AUDIO ===============
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playSound(name) {
  if (!state.soundOn) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  try {
    switch (name) {
      case 'click': sndClick(ctx, t); break;
      case 'success': sndSuccess(ctx, t); break;
      case 'fail': sndFail(ctx, t); break;
      case 'cash': sndCash(ctx, t); break;
      case 'store': sndStore(ctx, t); break;
      case 'destroy': sndDestroy(ctx, t); break;
    }
  } catch (e) {}
}
function sndClick(ctx, t) {
  const o = ctx.createOscillator(); o.type='square'; o.frequency.value=800;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.1,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+0.05);
}
function sndSuccess(ctx, t) {
  [523, 659, 784, 1047].forEach((freq, i) => {
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const g = ctx.createGain(); const st = t + i*0.07;
    g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(0.18,st+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,st+0.5);
    o.connect(g).connect(ctx.destination); o.start(st); o.stop(st+0.5);
  });
}
function sndFail(ctx, t) {
  const o = ctx.createOscillator(); o.type='triangle';
  o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(80,t+0.4);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.32,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.4);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+0.4);
}
function sndCash(ctx, t) {
  [1318, 1568, 2093].forEach((freq, i) => {
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const g = ctx.createGain(); const st = t + i*0.05;
    g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(0.2,st+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,st+0.7);
    o.connect(g).connect(ctx.destination); o.start(st); o.stop(st+0.7);
  });
}
function sndStore(ctx, t) {
  const o = ctx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(80,t+0.2);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+0.25);
}
function sndDestroy(ctx, t) {
  const bufLen = Math.floor(ctx.sampleRate * 0.6);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/bufLen, 0.7);
  const n = ctx.createBufferSource(); n.buffer = buf;
  const g = ctx.createGain(); g.gain.value = 0.45;
  const f = ctx.createBiquadFilter(); f.type = 'highpass';
  f.frequency.setValueAtTime(2200,t); f.frequency.exponentialRampToValueAtTime(500,t+0.55);
  n.connect(f).connect(g).connect(ctx.destination); n.start(t);
}

// =============== CHEATS (session-scoped, not persisted) ===============
const cheats = { forceNext: null, infiniteGold: false, infiniteItems: false, infiniteMaterials: false };

// =============== RENTAL HELPERS ===============
// =============== APPLICANT HELPERS ===============
const HERO_MOTIVATIONS = [
  '명예와 영광을 위해!', '돈만 받으면 뭐든 합니다.', '내 검은 비싸지만 그만한 가치가 있죠.',
  '왕국을 위해 목숨을 바치겠습니다.', '이번엔 진짜 살아 돌아옵니다.', '용기는 두려움이 없는 게 아니야.',
  '먹고 살아야지요...', '운명이 부르는 곳으로!', '지난번엔 운이 없었을 뿐.',
  '내 가족을 위해.', '전설이 되어주마!', '죽음 따위 두렵지 않다.',
  '돈이 좀 부족해서요.', '이게 내 마지막 임무다.', '복수의 시간이다.',
  '신께서 인도하시리라.', '검의 노래를 부르겠소.', '뭐 어떻게든 되겠지.',
  '내가 누군지 보여주마!', '실패는 없다, 오직 다음 기회만.', '아무튼 가보자!'
];

function rollHeroTier(swordTier) {
  // Distribution centered around sword tier; high tiers rarer overall
  const r = Math.random();
  if (r < 0.50) return swordTier;
  if (r < 0.78) return Math.max(0, swordTier - 1);
  if (r < 0.92) return Math.min(5, swordTier + 1);
  if (r < 0.97) return Math.max(0, swordTier - 2);
  return Math.min(5, swordTier + 2);
}
function rollDesiredDungeon(heroTier) {
  // Most heroes go safe (heroTier dungeon); some greedy heroes overreach
  const r = Math.random();
  if (r < 0.65) return heroTier;            // safe
  if (r < 0.85) return Math.min(5, heroTier + 1); // greedy +1
  if (r < 0.93) return Math.min(5, heroTier + 2); // very greedy +2
  return Math.max(0, heroTier - 1);          // humble
}
function rollHeroStats(heroTier) {
  const baseStr = 10 + heroTier * 14;
  const baseAgi = 10 + heroTier * 14;
  const baseLuc = 5 + heroTier * 10;
  const variance = () => Math.floor(Math.random() * 18);
  return {
    strength: Math.min(99, baseStr + variance()),
    agility: Math.min(99, baseAgi + variance()),
    luck: Math.min(99, baseLuc + variance())
  };
}
function rollPayRate(heroTier, isGreedy) {
  // Pay rate is % of dungeon gold reward the hero takes
  let pct = 5 + heroTier * 5; // tier 0: 5%, tier 5: 30%
  if (isGreedy) pct += 8;
  pct += Math.floor(Math.random() * 8); // ±8% variance
  return Math.max(1, Math.min(60, pct));
}
function rollMotivation() {
  return HERO_MOTIVATIONS[Math.floor(Math.random() * HERO_MOTIVATIONS.length)];
}
function newApplicantId() {
  return 'a_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}
function generateApplicant(swordLevel) {
  const swordTier = getTier(swordLevel);
  const heroTier = rollHeroTier(swordTier);
  const desired = rollDesiredDungeon(heroTier);
  const greedy = desired > heroTier;
  return {
    id: newApplicantId(),
    name: generateHeroName(),
    tier: heroTier,
    forSwordLevel: swordLevel,
    desiredDungeonTier: desired,
    greedy: greedy,
    payRate: rollPayRate(heroTier, greedy),
    stats: rollHeroStats(heroTier),
    motivation: rollMotivation(),
    createdAt: Date.now()
  };
}
function maybeGenerateApplicants(now) {
  state.applicants = state.applicants || [];
  state.lastApplicantGen = state.lastApplicantGen || {};
  const baseInterval = balance.applicantBaseIntervalMs || 30000;
  const maxPerSword = balance.applicantMaxPerSword || 10;
  const maxTotal = balance.applicantMaxTotal || 100;
  let generated = 0;
  for (let lvl = 1; lvl <= 30; lvl++) {
    if ((state.collection[lvl] || 0) === 0) continue;
    if (state.applicants.length >= maxTotal) break;
    const tier = getTier(lvl);
    const interval = baseInterval / (1 + tier * 0.5);
    if (!state.lastApplicantGen[lvl]) {
      // First encounter — stagger initial timing so sword levels don't all fire at once
      state.lastApplicantGen[lvl] = now - Math.random() * interval;
    }
    if (now - state.lastApplicantGen[lvl] < interval) continue;
    state.lastApplicantGen[lvl] = now;
    const count = state.applicants.filter(a => a.forSwordLevel === lvl).length;
    if (count >= maxPerSword) continue;
    state.applicants.push(generateApplicant(lvl));
    generated++;
  }
  return generated;
}

function generateHeroName() {
  const prefixes = ['용감한','신비한','전설의','강철의','그림자','화염의','바람의','은빛','황금의','빛나는','어둠의','정의의'];
  const surnames = ['카엘','로한','블레이드','발로르','레오','케인','아르카','펜릴','오딘','헬가','루비','이반','테오','자나'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = surnames[Math.floor(Math.random() * surnames.length)];
  return `${p} ${s}`;
}
function newRentalId() {
  return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function dungeonRewards(tier, floor) {
  const cfg = balance.dungeons[tier];
  const floorMult = 1 + (floor - 1) * 0.5;
  const gold = Math.floor(cfg.baseRewardGold * floorMult);
  const resource = Math.max(1, Math.floor(cfg.baseRewardResource * floorMult));
  return { gold, resource };
}

// Tier-mismatch adjustments: sword tier vs dungeon tier
// gap = swordTier - dungeonTier
//   gap < 0  → success rate penalty
//   gap == 0 → unchanged
//   gap > 0  → success rate bonus + duration reduction
// Apply tier-mismatch effect for one actor (sword OR hero) to success rate
function _applyRateGap(rate, gap) {
  if (gap === 0) return rate;
  if (gap < 0) return Math.max(1, rate - Math.abs(gap) * (balance.tierMismatchPenalty || 0));
  return Math.min(100, rate + gap * (balance.tierMismatchBonus || 0));
}
// Apply tier-mismatch effect for one actor to duration multiplier (1.0 = unchanged)
function _applyDurGap(mult, gap) {
  if (gap === 0) return mult;
  if (gap > 0) {
    const red = Math.min(50, gap * (balance.tierMismatchTimeBonus || 0));
    return mult * (1 - red / 100);
  }
  const ext = Math.min(100, Math.abs(gap) * (balance.tierMismatchTimePenalty || 0));
  return mult * (1 + ext / 100);
}
function adjustedSuccessRate(swordLevel, dungeonTier, heroTier) {
  let rate = balance.dungeons[dungeonTier].successRate;
  rate = _applyRateGap(rate, getTier(swordLevel) - dungeonTier);
  if (typeof heroTier === 'number') {
    rate = _applyRateGap(rate, heroTier - dungeonTier);
  }
  return Math.max(1, Math.min(100, rate));
}
function adjustedDuration(swordLevel, dungeonTier, heroTier) {
  let mult = 1;
  mult = _applyDurGap(mult, getTier(swordLevel) - dungeonTier);
  if (typeof heroTier === 'number') {
    mult = _applyDurGap(mult, heroTier - dungeonTier);
  }
  // Cap multiplier between 0.25 (max combined reduction) and 4 (max combined extension)
  mult = Math.max(0.25, Math.min(4, mult));
  return Math.floor(balance.dungeons[dungeonTier].durationMs * mult);
}

// Resolve all rentals whose endTime ≤ now. Returns { resolved: [...], didChange }
// Safe to call from any page on init (offline progression).
function resolveRentals() {
  const now = Date.now();
  state.rentals = state.rentals || [];
  state.deadSwords = state.deadSwords || [];
  state.dungeonProgress = state.dungeonProgress || {};
  const resolved = [];
  const remaining = [];

  state.rentals.forEach(r => {
    if (now < r.endTime) { remaining.push(r); return; }
    // Use rate frozen at rental creation if available; fall back to dungeon base rate
    const rate = (typeof r.adjustedSuccessRate === 'number')
      ? r.adjustedSuccessRate
      : balance.dungeons[r.dungeonTier].successRate;
    const isSuccess = (Math.random() * 100) < rate;
    r.outcome = isSuccess ? 'success' : 'fail';
    r.resolvedAt = now;
    r.resolved = true;
    resolved.push(r);
  });

  resolved.forEach(r => {
    const cfg = balance.dungeons[r.dungeonTier];
    if (r.outcome === 'success') {
      // Distribute reward (hero takes payRate% of gold; resources go fully to player)
      const reward = dungeonRewards(r.dungeonTier, r.floor);
      const heroCutPct = (typeof r.heroPayRate === 'number') ? r.heroPayRate : 0;
      const heroCut = Math.floor(reward.gold * heroCutPct / 100);
      const playerGold = reward.gold - heroCut;
      r.heroCut = heroCut;
      r.playerGold = playerGold;
      state.gold = (state.gold || 0) + playerGold;
      const resKey = RESOURCE_KEYS[r.dungeonTier];
      state.resources[resKey] = (state.resources[resKey] || 0) + reward.resource;
      state.stats = state.stats || {};
      state.stats.goldEarned = (state.stats.goldEarned || 0) + playerGold;
      state.stats.rentalsSucceeded = (state.stats.rentalsSucceeded || 0) + 1;
      // Return rented sword to collection
      if (r.swordLevel >= 1 && r.swordLevel <= 30) {
        state.collection[r.swordLevel] = (state.collection[r.swordLevel] || 0) + 1;
      }
      // Recover dead swords stuck in same dungeon-floor
      const recovered = state.deadSwords.filter(d => d.dungeonTier === r.dungeonTier && d.floor === r.floor);
      recovered.forEach(d => {
        if (d.swordLevel >= 1 && d.swordLevel <= 30) {
          state.collection[d.swordLevel] = (state.collection[d.swordLevel] || 0) + 1;
        }
      });
      r.recoveredCount = recovered.length;
      state.deadSwords = state.deadSwords.filter(d => !(d.dungeonTier === r.dungeonTier && d.floor === r.floor));
      // Floor / next tier unlock
      const prog = state.dungeonProgress[r.dungeonTier] || { unlocked: true, bestFloor: 0 };
      if (r.floor > prog.bestFloor) prog.bestFloor = r.floor;
      state.dungeonProgress[r.dungeonTier] = prog;
      // Unlock next tier if first clear of current tier
      if (r.dungeonTier < 5) {
        const next = state.dungeonProgress[r.dungeonTier + 1] || { unlocked: false, bestFloor: 0 };
        if (!next.unlocked) {
          next.unlocked = true;
          state.dungeonProgress[r.dungeonTier + 1] = next;
          r.unlockedNextTier = r.dungeonTier + 1;
        }
      }
      state.log = state.log || [];
      state.log.push({
        text: `🎉 ${r.heroName} 귀환! +${r.swordLevel} 회수 + ${playerGold.toLocaleString()} G` +
              (heroCut > 0 ? ` (용사 보수 ${heroCut.toLocaleString()})` : '') +
              ` + ${reward.resource} ${balance.resourceNames[r.dungeonTier]}` +
              (recovered.length ? ` + 회수 검 ${recovered.length}` : ''),
        type: 'success', t: now
      });
    } else {
      // Failure: sword to dead pile
      state.deadSwords.push({
        dungeonTier: r.dungeonTier,
        floor: r.floor,
        swordLevel: r.swordLevel,
        heroName: r.heroName,
        lostAt: now
      });
      state.stats = state.stats || {};
      state.stats.rentalsFailed = (state.stats.rentalsFailed || 0) + 1;
      state.log = state.log || [];
      state.log.push({
        text: `💀 ${r.heroName} 사망. +${r.swordLevel} 검이 ${cfg.name} ${r.floor}F 에 갇힘.`,
        type: 'destroy', t: now
      });
    }
  });

  state.rentals = remaining;
  if (resolved.length > 0) saveState();
  return { resolved: resolved, didChange: resolved.length > 0 };
}

// =============== HERO + BOSS PIXEL ART ===============
function buildHeroSVG(swordLevel, options) {
  options = options || {};
  const size = options.size || 36;
  const tier = (typeof options.heroTier === 'number') ? options.heroTier
    : (swordLevel >= 0 ? getTier(swordLevel) : 0);
  const armor = TIER_COLORS[tier] || '#9bd4ff';
  const armorDark = lerpHex(armor, '#000', 0.5);
  const swordColor = swordLevel >= 0 ? getSwordPalette(swordLevel).edge : '#cdd5e0';
  const w = 8, h = 12, px = 1;
  // Pattern (8 wide × 12 tall):
  // 0: ..HHHH..  head outline
  // 1: .HskskH.  skin (s) shadow (k)
  // 2: .HsHHsH.  hair stripe
  // 3: ..ssss..  neck/skin
  // 4: AAAASS.A  body/sword
  // 5: AaaaSS.a  body/sword
  // 6: AAAA....  body
  // 7: .AaaA...
  // 8: .a..a...  legs
  // 9: .a..a...
  // 10: bb..bb..  boots
  // 11: bb..bb..
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${size*1.5}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <!-- head -->
    <rect x="2" y="0" width="4" height="1" fill="#3a2a1a"/>
    <rect x="2" y="1" width="4" height="2" fill="#ffd0a0"/>
    <rect x="2" y="1" width="4" height="1" fill="#5a4030"/>
    <rect x="3" y="2" width="1" height="1" fill="#2a1a0a"/>
    <rect x="4" y="2" width="1" height="1" fill="#2a1a0a"/>
    <!-- neck -->
    <rect x="3" y="3" width="2" height="1" fill="#ffd0a0"/>
    <!-- body -->
    <rect x="2" y="4" width="4" height="3" fill="${armor}"/>
    <rect x="2" y="6" width="4" height="1" fill="${armorDark}"/>
    <!-- arms -->
    <rect x="1" y="4" width="1" height="3" fill="${armorDark}"/>
    <rect x="6" y="4" width="1" height="3" fill="${armorDark}"/>
    <!-- sword (in right hand) -->
    <rect x="6" y="2" width="1" height="3" fill="${swordColor}"/>
    <rect x="5" y="4" width="2" height="1" fill="#ffd700"/>
    <!-- legs -->
    <rect x="2" y="7" width="2" height="3" fill="#3a2a5e"/>
    <rect x="4" y="7" width="2" height="3" fill="#3a2a5e"/>
    <!-- boots -->
    <rect x="2" y="10" width="2" height="2" fill="#5a3a1a"/>
    <rect x="4" y="10" width="2" height="2" fill="#5a3a1a"/>
  </svg>`;
}

function buildBossSVG(tier, options) {
  options = options || {};
  const size = options.size || 56;
  const palettes = [
    { body: '#5a4a3a', dark: '#2a1a0a', eye: '#ff4040', accent: '#7a6a5a' },
    { body: '#2a4060', dark: '#101830', eye: '#ffd040', accent: '#4060a0' },
    { body: '#3a2070', dark: '#100838', eye: '#80f0ff', accent: '#7028a0' },
    { body: '#601858', dark: '#200822', eye: '#ff60ff', accent: '#a040a0' },
    { body: '#702010', dark: '#280808', eye: '#ffa020', accent: '#a04030' },
    { body: '#3a3a3a', dark: '#0a0a0a', eye: '#ff0080', accent: '#605020' }
  ];
  const p = palettes[Math.min(5, Math.max(0, tier))];
  const w = 16, h = 16;
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <!-- horns -->
    <rect x="2" y="0" width="2" height="2" fill="${p.dark}"/>
    <rect x="12" y="0" width="2" height="2" fill="${p.dark}"/>
    <rect x="3" y="2" width="1" height="1" fill="${p.dark}"/>
    <rect x="12" y="2" width="1" height="1" fill="${p.dark}"/>
    <!-- main body / head -->
    <rect x="2" y="2" width="12" height="10" fill="${p.body}"/>
    <rect x="2" y="11" width="12" height="1" fill="${p.dark}"/>
    <!-- eye sockets -->
    <rect x="4" y="4" width="3" height="3" fill="#000"/>
    <rect x="9" y="4" width="3" height="3" fill="#000"/>
    <!-- eyes glow -->
    <rect x="5" y="5" width="2" height="2" fill="${p.eye}"/>
    <rect x="10" y="5" width="2" height="2" fill="${p.eye}"/>
    <!-- mouth (fangs) -->
    <rect x="5" y="9" width="6" height="2" fill="#000"/>
    <rect x="5" y="9" width="1" height="1" fill="#fff"/>
    <rect x="7" y="9" width="1" height="1" fill="#fff"/>
    <rect x="9" y="9" width="1" height="1" fill="#fff"/>
    <rect x="6" y="10" width="1" height="1" fill="#fff"/>
    <rect x="8" y="10" width="1" height="1" fill="#fff"/>
    <rect x="10" y="10" width="1" height="1" fill="#fff"/>
    <!-- arms / claws -->
    <rect x="0" y="6" width="2" height="4" fill="${p.body}"/>
    <rect x="14" y="6" width="2" height="4" fill="${p.body}"/>
    <rect x="0" y="9" width="1" height="1" fill="${p.dark}"/>
    <rect x="15" y="9" width="1" height="1" fill="${p.dark}"/>
    <!-- legs -->
    <rect x="3" y="12" width="3" height="3" fill="${p.dark}"/>
    <rect x="10" y="12" width="3" height="3" fill="${p.dark}"/>
    <rect x="3" y="15" width="3" height="1" fill="#000"/>
    <rect x="10" y="15" width="3" height="1" fill="#000"/>
    <!-- accent glow -->
    <rect x="6" y="3" width="4" height="1" fill="${p.accent}" opacity="0.6"/>
  </svg>`;
}
