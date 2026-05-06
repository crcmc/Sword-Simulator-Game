# Sword Simulator Game — 프로젝트 컨텍스트

> 새 Claude 세션에서 이 프로젝트를 이어 작업할 때 읽어주세요.

## 배포 정보
- **GitHub Repo**: https://github.com/crcmc/Sword-Simulator-Game
- **로컬 경로**: `~/Documents/GitHub/Sword Simulator Game`
- **배포 URL**: https://www.lunchspace.store
- **호스팅**: GitHub Pages (무료) + 가비아 도메인 + Let's Encrypt SSL
- **DNS**: apex A 레코드 4개 (185.199.108-111.153, TTL 600), www CNAME → crcmc.github.io (TTL 3600)

## 파일 구조

```
Sword Simulator Game/
├── index.html              # 랜딩 페이지 (3게임 카드 허브: 강화/대여/던전)
├── sword-enhancement.html  # 검 강화 (대장간) — 메인 게임
├── sword-rental.html       # 검 대여소 (용사에게 검 빌려줌)
├── sword-dungeon.html      # 던전 (실시간 출정 진행)
├── sword-gallery.html      # 갤러리 (생성된 정적 산출물 — 허브에서 링크 안 됨)
├── admin.html / admin.js   # 어드민 패널 (밸런스 편집)
├── shared.css              # 공통 스타일 (픽셀 + 다크 + 골드 액센트)
├── balance-defaults.js     # 단일 진실 소스 — BALANCE_KEY/deepClone/BALANCE_DEFAULTS
├── shared.js               # 공통 데이터 레이어 (state/forge/tier/balance runtime)
└── CNAME                   # `www.lunchspace.store`
```

## 핵심 시스템

### 데이터 레이어 (shared.js)
- **localStorage 네임스페이싱**: `sword_enhancement_save_v4__{forgeName}` — 대장간별로 데이터 분리
- **다중 대장간**: `createForge` / `switchForge` / `deleteForge` / `listForges`
- **티어 시스템 (6단계)**: 검·용사·던전 모두 1~6 티어. 갭이 크면 페널티/보너스
- **티어 헬퍼**: `adjustedSuccessRate(swordTier, dungeonTier, heroTier?)`, `adjustedDuration(...)`, `tierGap(...)`
- **렌탈 정산**: `resolveRentals()` — 오프라인 진행도 처리, 페이컷 자동 계산
- **신청자 시스템**: `rollHeroTier`, `rollDesiredDungeon`, `rollHeroStats`, `rollPayRate`, `generateApplicant`, `maybeGenerateApplicants`
- **SVG 빌더**: 검(6티어×31강), 용사, 보스 픽셀아트
- **Audio**: Web Audio 합성 (모루 / 동전 / 성공·실패 점프 음)

### 페이지별 핵심 기능
- **검 강화**: +0~+30 강화, +20부터 재료(철광석), 보호석 아이템, 손익분기 +10
- **검 대여소**: 3컬럼 — 보관함(좌) / 검·용사·신청자(중) / 진행중·죽은검(우). 신청자 행 클릭은 선택, [신청서 확인]은 모달 → 닫기/반려/계약
- **던전**: 6티어 탭, 좌→우→보스→귀환 픽셀 애니메이션, 시간 카운트다운
- **갤러리**: 컬렉션 그리드 (5칸)

## 밸런스 (BALANCE_DEFAULTS, balance-defaults.js)
- 시작 골드: 100,000
- 판매 앵커: +10 = 1,000,000 G (sellAnchor / sellAnchorLvl), 레벨당 1.5배 (sellRatio)
- 강화석 / 보호석 / 강화권 / 철광석 가격 모두 balance 객체로 관리
- 어드민 게이트: `?admin=<ADMIN_HASH>` (SHA-256 해시값을 query param으로 전달). 해시는 `balance-defaults.js`의 `ADMIN_HASH` 상수와 비교

## 완료된 마일스톤 (요약)

- 강화 메커닉, 31강까지 SVG, 사운드, 재료, 보호석
- localStorage 저장 + 다중 대장간
- 티어 갭 페널티/보너스 + 언더레벨 시간 연장
- 대여 신청자 시스템 (UI 재구성, 페이컷 흥정)
- 신청자 행/버튼 분리, 모달 버튼 닫기/반려/계약
- 다중 대장간 createForge/switchForge/deleteForge
- 실시간 던전 진행, 보스 픽셀 아트
- GitHub Pages 배포 + 커스텀 도메인 SSL

## 다음 작업 (STAGE 5 — 보류 중)

- [ ] 던전 층(floor) 시스템 — 같은 티어 내 깊이 개념
- [ ] 관리자 패널과 던전 페이지 통합
- [ ] 비주얼 이펙트 — 강화 성공/실패 파티클, 보스 처치 연출
- [ ] (논의 필요) 용사 성장/사망 영구화, 길드/PvP 등 메타 진행

## 코딩 컨벤션 / 주의사항

- **밸런스 단일 소스**: BALANCE_DEFAULTS / BALANCE_KEY / deepClone은 `balance-defaults.js`에서만 정의됨. 모든 페이지가 이 파일을 가장 먼저 로드. 밸런스 값을 바꿀 때는 이 파일만 수정.
- **shared.js vs inline JS**: sword-enhancement.html은 forge/state/render 로직을 여전히 inline에 가지고 있고 shared.js를 로드하지 않음 (별도 통합 작업 진행 중 — 핵심 함수가 양쪽에 중복되어 있어 수정 시 항상 두 곳을 함께 봐야 함). sword-rental.html · sword-dungeon.html은 shared.js를 사용. 신규 공통 함수 추가 시 어디에 둘지 점검.
- **animations**: 강화 결과 애니메이션은 `clearAnims()`로 정리해야 함 (저장/판매/파괴 시).
- **+0 검**: 보관함에서 숨기고 판매 불가 (무한 루프 방지).
- **regex 주의**: validateForgeName은 `\0` 대신 `charCodeAt` 필터 사용.
- **검 보관 탭 이름**: "보관함" (not "보관함 검").

## 새 세션 시작 메시지 템플릿

```
Sword Simulator Game 프로젝트를 이어서 작업하고 싶어.
- Repo: https://github.com/crcmc/Sword-Simulator-Game
- 로컬: ~/Documents/GitHub/Sword Simulator Game
- 배포: https://www.lunchspace.store
- 컨텍스트는 PROJECT.md 참고

[이번 세션 목표를 여기 적기]
```
