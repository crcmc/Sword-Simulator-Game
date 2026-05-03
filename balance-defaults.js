/* ============================================================
   balance-defaults.js — single source of truth for game balance
   Loaded by: sword-enhancement.html, sword-rental.html, sword-dungeon.html
   Defines globals: BALANCE_KEY, deepClone, BALANCE_DEFAULTS
   ============================================================ */

const BALANCE_KEY = 'sword_balance_overrides_v1';

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

const BALANCE_DEFAULTS = {
  startGold: 1000000,
  costBase: 1000, costExp: 1.55, costMult: 1,
  sellAnchor: 1000000, sellAnchorLvl: 10, sellRatio: 1.5,
  shopStone: 100000, shopProtect1: 2000000, shopProtect10: 15000000,
  fragmentBonus: 10, stoneBonusEach: 5, stoneMaxStack: 3,
  destroyRefundRate: 0.2, fragmentDropMin: 1, fragmentDropMax: 5,
  failureRules: [
    { maxLevel: 10, maintain: 1.0, downgrade: 0.0, destroy: 0.0 },
    { maxLevel: 20, maintain: 0.7, downgrade: 0.2, destroy: 0.1 },
    { maxLevel: 30, maintain: 0.1, downgrade: 0.2, destroy: 0.7 }
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
    99, 98, 97, 96, 95, 94, 93, 92, 91, 90,
    88, 86, 84, 82, 80, 75, 70, 65, 60, 55,
    50, 40, 30, 20, 10,  8,  6,  4,  2,  1
  ],
  swordNames: [
    '평범한 철검', '단련된 철검', '예리한 철검', '빛나는 철검', '정교한 철검',
    '강철검', '단단한 강철검', '명장의 강철검', '군주의 강철검', '최상급 강철검',
    '신비한 검', '룬이 새겨진 검', '마법사의 검', '정령의 검', '드루이드의 검',
    '수정 검', '빙결의 수정검', '영혼의 수정검', '심연의 수정검', '어둠의 수정검',
    '화염검', '용염의 검', '작열의 검', '불멸의 화염검', '멸세의 화염검',
    '전설의 검', '천상의 검', '신성의 검', '창조의 검', '영원의 검', '천공의 패검'
  ],
  tierNames: ['일반', '희귀', '마법', '영웅', '고유', '전설'],
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
