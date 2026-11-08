# Zi Wei Dou Shu (紫微斗數) Chart & Analyser — Plan

Status: planning only, no code yet. Written 2026-11-08.
Working name: **ziwei-chart** (repo `williamwuofficial/ziwei-chart`, Pages at `/ziwei-chart/`).

---

## 1. Goals (from the brief)

| # | Requirement | How the plan meets it |
|---|---|---|
| 1 | Enter date of birth and place | Date + time + place form. The place is geocoded to lat/lon and an IANA timezone, then converted to true solar time to get the birth hour (時辰). **Gender is also required**, because it sets the direction of the 10-year periods (大限). |
| 2 | Chart shows main stars and minor stars | Traditional 4×4 grid with 12 palaces around a centre info panel. It shows the 14 main stars (主星), the 6 lucky and 6 malefic minor stars (六吉/六煞), 祿存, 天馬, the miscellaneous stars (雜曜) and the transformations (四化). Brightness (廟旺利平陷) is shown too. |
| 3 | Star and palace names in Chinese, everything else in English | Star and palace names are always Chinese glyphs, with a Traditional/Simplified toggle. Hovering a name shows a tooltip with pinyin and an English gloss. All UI and analysis prose is in English. |
| 4 | Analysis below the chart: best-guess breakdown of life stages | The analysis has a natal summary, then a timeline of decades. Each 大限 is labelled with a life stage (childhood, education, early career, …). |
| 5 | All analysis based on known star configurations | A **rule database** stores every statement with its trigger conditions and a citation to its classical or school source. There is no free-form or AI-generated text. Each paragraph shows "why": which stars, in which palace, from which rule. |

Same hosting pattern as bne-flood-watch and ai-flow-watch: Vite static build, deployed by GitHub Actions to Pages. Unlike those two, there is **no data cron and no `data` branch**, because everything is computed in the browser.

---

## 2. Research summary

### 2.1 Schools (流派)

| School | Core method | Strengths for an automated tool | Weaknesses |
|---|---|---|---|
| **三合派 (San He, "Southern")** | Star nature (星性), brightness, the four key palaces (三方四正), named patterns (格局). This is the classic method of 《紫微斗數全書》. | Static, rule-shaped and well documented. Patterns have explicit formation and break conditions, so it maps directly onto a rule engine. | Pattern books overlap, and some conditions are vague ("會吉" = meets lucky stars). |
| **四化派 / 飛星派 (Si Hua / Fei Xing, "Northern")** | Palace-stem transformations (宮干飛化): 祿/權/科/忌 fly from palace to palace. It reads 自化 (self-transformation), 忌沖 (化忌 clash) and 祿忌 chains. | Very good for *timing*. 大限宮干 transformations are deterministic and easy to compute. | Interpretations of the chains are lineage-specific and mostly oral or copyrighted. Hard to cite a single canonical rule set. |
| **欽天門 (Qin Tian Men)** | A 四化 variant: the birth-year transformations are treated as the "root". It uses 來因宮 (the palace whose stem matches the year stem) and 化忌 as the key signal. | 來因宮 is a single deterministic and interesting feature. | Small, guarded literature. |
| **中州派 (Zhongzhou, 王亭之)** | A San He base with its own star placements for some miscellaneous stars and its own brightness tables. It reads by "star system" (星系) across 12 palaces, with heavy emphasis on 大限. | iztro implements its placement (`algorithm: 'zhongzhou'`). | 王亭之's lecture notes are copyrighted, so they can only be summarised and paraphrased. |

**Recommendation.** Use **三合派 as the primary analysis framework** (palaces, star groups, 格局), with a **limited and well-defined 四化 layer**:

- birth-year 四化: which palace each transformation falls in;
- 大限 palace-stem 四化: where the decade's 祿 and 忌 land;
- 化忌 entering, or clashing (沖) from the opposite palace, the 命, 財, 官 and 疾 palaces;
- 來因宮 as a one-line note.

Full 飛星 chain reading is out of scope for v1, because it cannot meet requirement 5 with citable rules. Star placement defaults to iztro `default` (全書), with a **School** setting to switch to `zhongzhou`.

### 2.2 Known disputes the app must expose as settings

| Dispute | Options | Default |
|---|---|---|
| 庚 year-stem 四化 | 陽武陰同 (most common table) / 陽武同相 / 陽武府同 | 陽武陰同 |
| 壬 化科 | 左輔 / 天府 | 左輔 |
| 戊 化科 | 右弼 / 太陽 | 右弼 |
| Late 子 hour (23:00–00:00) | Counts as the next day (`dayDivide: forward`) / stays on the same day (`current`) | forward |
| Year boundary | Lunar New Year (`yearDivide: normal`) / 立春 (`exact`) | normal (the ZWDS norm; 立春 is the 八字 norm) |
| Leap month (閏月) | Whole month counts as the previous month / split at the 15th | Check iztro's behaviour and expose it if possible |
| True solar time | On (longitude + equation of time) / off (clock time) | **On**, with both times shown so the user sees when the hour changes |
| Brightness table | iztro default / 中州 | Follows the school setting |

iztro supports the transformation overrides through `astro.config({ mutagens })` and the date rules through `yearDivide`, `dayDivide`, `ageDivide` and `horoscopeDivide`. The exact alternative tables must be checked against two independent sources before shipping. Treat everything in the table above as **to verify**.

### 2.3 Chart engine: iztro (MIT)

- `astro.bySolar(date, timeIndex, gender, fixLeap, lang)` returns 12 palaces with stars, brightness, transformations, 大限 ranges and the horoscope layers (大限/流年/流月…).
- It supports `zh-TW` and `zh-CN` output, so the Chinese names come straight from it.
- It has query helpers: `star('紫微').surroundedPalaces()`, `palace.has([...])`, `haveMutagen()`. These are the building blocks for rule predicates.
- It has a plugin system (`astro.loadPlugin`), which is how pattern detection gets attached.
- It does **not** do pattern (格局) detection or interpretation. That is the part this app adds.
- It does **not** do true-solar-time or place handling, which the app does before calling it.

The alternative is writing the placement algorithm from scratch. That is not worth it: iztro has ~4k stars and is tested. It will be pinned to an exact version.

### 2.4 Place → time pipeline

1. **Geocode:** Open-Meteo Geocoding API (`geocoding-api.open-meteo.com/v1/search`). It needs no key and returns `latitude`, `longitude` and `timezone` (IANA). Licence is CC BY-NC 4.0, which is fine for a free non-commercial site. Attribution goes in the footer, and CORS must be checked in a browser. The fallback is Nominatim plus a bundled timezone-lookup table.
2. **Historic UTC offset:** `Intl.DateTimeFormat` with the IANA zone gives the offset *at the birth date*. That covers DST, China's 1986–91 DST, and old offsets such as Singapore/Malaysia before 1982 or Shanghai before 1949.
3. **True solar time** = UTC + longitude × 4 min/° + equation of time (NOAA formula, about ±16 min). Many apps use longitude only and drop the equation of time; this app includes it.
4. Map the solar time to a 時辰 index 0–12, using iztro's convention where 0 = early 子 and 12 = late 子.
5. **Boundary warning:** if the solar time is within ±10 min of a 時辰 boundary, show a banner offering to view the neighbouring chart.

**Unknown birth time:** v1 requires the time, but offers "I only know the 時辰" as a direct picker. A later option shows the 12 possible 命宮.

### 2.5 Sources for the rule database

- **《紫微斗數》 (陳摶, 萬曆續道藏)** on Wikisource. Public domain. Includes 定諸宮分合, 洞微十八星斷, 入骨仙經.
- **《紫微斗數全書》** (Ming, attributed to 羅洪先). Public domain. Includes 太微賦, 骨髓賦, 形性賦, 女命骨髓賦, 諸星問答, 定富局/貴局/貧賤局, and 論諸星同垣各司所宜.
- **Modern pattern catalogue:** rong0922.url.tw/File/A32.doc lists **59 named 格局** with formation and break conditions. It was downloaded and checked during research. Its commentary is copyrighted, so the app uses only the structural conditions, re-expressed in its own English, and cites the 全書 line each pattern comes from.
- **中州派 (王亭之) lecture notes:** used for star-system character sketches in paraphrase only.
- **General rule from the catalogue:** a lucky pattern that meets 四煞 (擎羊, 陀羅, 火星, 鈴星), 地空/地劫 or 化忌 in the four key palaces is **破格** (broken). It reads as "promise without full delivery". A few patterns are exceptions, such as 火貪 and 鈴貪, which *need* 火 or 鈴.

### 2.6 Patterns to implement first (v1)

These patterns have clear, mechanical conditions.

- **紫微 group:** 紫府同宮 (命 in 寅/申), 紫府朝垣, 君臣慶會, 極向離明 (紫微 in 午), 天府朝垣 (府+廉 in 戌), 府相朝垣, 極居卯酉 (an adverse pattern).
- **Star-system patterns:**
  - 機月同梁: 機陰同梁 all in the four key palaces, plus 昌 or 曲.
  - 殺破狼: 七殺, 破軍 and 貪狼 in the four key palaces.
  - 巨日同宮: in 寅.
  - 陽梁昌祿.
  - 日月並明: 日 in 辰/巳, 月 in 酉/戌.
  - 日照雷門: 日 in 卯.
  - 月朗天門: 月 in 亥.
  - 明珠出海: 命 in 未 with no main star, 日 in 卯 and 月 in 亥.
  - 金燦光輝: 日 in 午.
  - 月生滄海: 同陰 in 子.
  - 石中隱玉: 巨門 in 子/午.
  - 七殺朝斗: 七殺 in 寅/申/子/午.
  - 英星入廟: 破軍 in 子/午.
  - 壽星入廟: 天梁 in 午.
  - 貪武同行.
  - 火貪 / 鈴貪.
  - 馬頭帶箭: 擎羊 in 午.
  - 廉貞文武.
- **Flanking (夾) patterns:** 左右夾命, 昌曲夾命, 魁鉞夾命 (貴星夾命), 雙祿夾命, 科權祿夾, 羊陀夾忌, 火鈴夾命, 劫空夾命, 刑囚夾印.
- **祿 and 權 combinations:** 三奇加會, 權祿巡逢, 祿馬交馳, 雙祿朝垣, 祿合鴛鴦.
- **Adverse patterns:** 命無正曜, 日月藏輝, 巨逢四煞, 命裏逢空, 馬落空亡, 祿逢兩煞, 文星失位, 梁馬飄蕩.

The remaining patterns in the 59 have vaguer conditions. They wait until v2, or are left out with a note.

---

## 3. Analysis model (requirement 5 is the hard constraint)

### 3.1 Rule format (TypeScript data, one file per category)

```ts
{
  id: 'ge.zifu-tonggong',
  kind: 'pattern' | 'palace-star' | 'mutagen' | 'decade' | 'flank',
  name_zh: '紫府同宮格',
  name_en: 'Emperor and Treasury together',
  school: ['sanhe'],
  source: { work: '紫微斗數全書', section: '定富局', quote_zh: '紫府同宮，終身福厚' }, // public-domain quote only
  when:   all(mingAt(['寅','申']), palaceHas('命', ['紫微','天府'])),
  needs:  anyOf(sanFangHas(LUCKY_STARS), sanFangMutagen(['祿','權','科'])), // "成格" requirement
  breaks: sanFangHasAny([...SHA, '地空','地劫']).or(sanFangMutagen('忌')),
  text_en: { full: '…', broken: '…' },
  weight: 3
}
```

- **Predicate library** (built on iztro queries): `palaceHas`, `palaceAt(branch)`, `sanFang(palace)`, `flanked(palace, a, b)`, `brightnessAtLeast('旺')`, `mutagenIn(palace, '忌', source: 'natal'|'decade')`, `clash(palace)` (the opposite palace has X), `noMainStar(palace)` (then the opposite palace's stars are borrowed, 借星安宮).
- Every rendered sentence carries its rule `id`. A **"Why?"** disclosure shows the matched conditions and the source line.
- A rule with no `source` fails a unit test. This is what enforces requirement 5.

### 3.2 Layers of reading

1. **Chart structure:** which of the 12 紫微-position structures (紫微 in 子 … 亥) applies. This fixes the whole star layout and gives a one-line overview.
2. **命宮 and 身宮:** the main stars, their brightness, any 借星 if the palace is empty, and the 三方四正 summary.
3. **Pattern list:** formed (成格), broken (破格) and adverse (凶格), ranked by weight.
4. **Palace-by-palace cards** (12, collapsible): main-star group × palace meaning, plus the minor stars present, plus the birth-year 四化 there. The text comes from the 全書 star-in-palace lines (諸星同垣各司所宜, 骨髓賦), paraphrased in English.
5. **Life stages:** see 3.3.

### 3.3 Life-stage breakdown ("best guess")

- **Decade sequence:** iztro gives each 大限 palace and its age range. The first decade starts at the age set by the 五行局 (2–6), and the direction depends on gender and year yin/yang.
- **Life-stage labels** by age: 0–12 childhood and family, 13–22 education, 23–32 early career and relationships, 33–42 establishment, 43–52 peak responsibility, 53–62 consolidation, 63–72 transition and health, 73+ later life. Each decade card shows its ages, its palace, and the life-stage label for the overlapping ages.
- **Per-decade scoring.** Each item comes from a rule.
  - The 大限命宮's own star group and brightness (which natal palace the decade "sits in"). For example, a decade in the natal 財帛宮 is read as a money-focused decade.
  - The 大限 palace-stem 四化: where 化祿 and 化忌 land, by natal palace meaning.
  - Patterns *formed in the decade's 三方四正*. These are the same pattern rules, re-evaluated with the decade's palace as 命.
  - 煞 and 忌 clash on the decade palace.
  - 疊忌 (double 化忌), where the natal 忌 and decade 忌 fall in the same palace. It is a well-known warning signal.
- **Output per decade:**
  - a tone: Favourable, Mixed or Challenging, from the sum of rule weights;
  - 2–4 bullet themes, covering career, wealth, relationships and health, each linked to its rule;
  - key palaces to watch.

  The tone thresholds are documented in the UI ("this is a heuristic aggregation").
- **Later:** per-year (流年) drill-down for the current decade.
- **Framing:** the analysis is framed as "traditional reading" with an entertainment disclaimer. There are no medical, financial or death predictions. The 疾厄 and health rules are softened to tendencies.

---

## 4. UI

- **Input card:**
  - date picker; time (hh:mm), or "only know 時辰";
  - gender;
  - place search with autocomplete. It shows the resolved city, country, timezone, UTC offset at birth, and the computed true solar time and 時辰.
  - **Advanced** collapsible with the school and dispute settings from 2.2.
- **Chart:**
  - CSS-grid 4×4. Each palace cell shows:
    - the 宮名 and 干支;
    - the main stars (large) with brightness glyph and 四化 badges (祿 green, 權 purple, 科 blue, 忌 red);
    - minor stars (small) and 雜曜 (smaller, toggleable);
    - the 大限 age range and 長生十二神.
  - The centre shows the solar and lunar date, 四柱, 五行局, 命主 and 身主.
  - Clicking a palace draws the 三方四正 lines (SVG overlay) and scrolls to its card.
  - A decade selector overlays that decade's palace names and 四化.
  - On a phone the grid stays 4×4 with small type, plus a "list view" toggle. No horizontal scroll.
- **Analysis:** summary, then patterns, then the 12 palace cards, then the decade timeline (a horizontal age bar plus cards).
- **Language:** a Traditional/Simplified toggle (iztro `zh-TW` / `zh-CN`). Each Chinese term has a tooltip with pinyin and English (a glossary file).
- **Privacy:** all computation is client-side. The last input is saved in localStorage (with try/catch). Birth data never goes into URLs or the network. The only network call is the city search text sent to the geocoder.
- **Export:** PNG of the chart via html-to-image (later), and print CSS.

---

## 5. Tech stack and repo layout

- Vite + TypeScript, vanilla DOM (no framework needed; matches the other Pages apps). The `iztro` npm package is pinned.
- Tests use Vitest.

```
ziwei-chart/
  index.html
  src/
    main.ts            # wiring
    input/geocode.ts   # Open-Meteo search + debounce
    input/solarTime.ts # offset, EoT, 時辰 index
    engine/chart.ts    # iztro wrapper + settings → config
    engine/predicates.ts
    rules/patterns.ts  rules/palaceStars.ts  rules/mutagens.ts  rules/decades.ts
    analysis/evaluate.ts  analysis/lifeStages.ts
    ui/chartGrid.ts  ui/analysis.ts  ui/glossary.ts
    i18n/glossary.json  # zh-TW, zh-CN, pinyin, English for every star/palace
  tests/
    golden/*.json      # reference charts
    solarTime.test.ts  predicates.test.ts  rules.test.ts
  .github/workflows/deploy.yml   # push to main → test → build → deploy-pages
```

---

## 6. Verification strategy

- **Golden charts:** about 20 births, including famous people with public birth data and edge cases. Each is cross-checked star by star against **two independent calculators**: the iztro demo, plus one other well-known 排盤 site or app. Stored as JSON and asserted in CI.
- **Edge cases:**
  - leap month;
  - births at 23:30 (late 子);
  - DST births (e.g. Sydney in January, Beijing in 1988);
  - western China (Urumqi, about −2 h solar);
  - southern hemisphere;
  - pre-1949 Shanghai;
  - a 時辰 boundary ±2 min.
- **Rule tests:** for each pattern, one chart that should form it, one that forms but is broken, and one near-miss. Plus the meta-test that every rule has a `source` and an `id`.
- **Solar time:** compared against the NOAA solar calculator for 5 dates.
- **Browser check:** with the preview pane: input → chart → analysis on desktop and at phone width, in light and dark mode.

---

## 7. Phases

| Phase | Deliverable |
|---|---|
| **0. Scaffold** | Repo, Vite + TS, Pages workflow, empty page live. |
| **1. Chart** | Input form, geocode, true solar time, iztro chart grid with all stars, 三方四正 highlight, settings panel, golden-chart tests. |
| **2. Natal analysis** | Predicate library, about 45 v1 patterns, 命/身 reading, 12 palace cards, "Why?" disclosures, glossary tooltips. |
| **3. Life stages** | Decade evaluation, timeline UI, 疊忌 and decade 四化, tone heuristic. |
| **4. Polish** | Trad/Simp toggle, PNG export, current-year 流年 drill-down, offline service worker, more patterns. |

Each phase is shippable on its own.

---

## 8. Decisions (2026-11-08)

1. **Gender** is part of the form; it is required for the decade direction.
2. **Default script:** Traditional 繁體, with a toggle to Simplified.
3. **Default school:** 三合 analysis with 全書 (iztro `default`) placement; 中州派 is a setting.
4. **Repo:** `williamwuofficial/ziwei-chart`, Pages at `/ziwei-chart/`.
5. **Unknown birth time:** exact time *or* a direct 時辰 picker is enough for v1. True-solar correction only applies to exact times.
6. **iztro pinned to 2.6.3.** 2.6.4 and 2.6.5 were under a week old at scaffold time.

## 9. Status

- Phases 0–2 are live: scaffold, then chart, then natal analysis.
- Phase 2 has 46 auspicious and 19 adverse patterns, 14 star natures, 24 star pairs, transformation and 身宮 rules, 12 palace cards, a "Why?" panel on every statement, and pinyin + English tooltips.
- Quoted verses are checked against the catalogue text, and the verified list is kept in `tests/fixtures/verses.txt`.
- The Simplified display uses a generated character map (`npm run t2s`). A test fails if the map is missing a character.
