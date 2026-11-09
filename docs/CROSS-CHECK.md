# Cross-check of the pattern rules (2026-11-08)

The 格局 rules were checked against four kinds of source:
1. The 全書's own pattern definitions.
2. Open-source engines.
3. Modern notes.
4. Public case studies.

This file records what was compared, what changed, and which differences were kept on purpose.

## Sources

| Source | What it gave | Used how |
|---|---|---|
| 《紫微斗數全書》卷一, 定富局 / 定貴局 / 定貧賤局 / 定雜局 (Wikisource, public domain) | The 全書's own one-line definition of about 50 patterns | Authority for definitions. The quotes are verified by `npm run verify-sources`. |
| [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) `lib/ziwei/patterns.ts` (MIT) | 45 patterns, each split into required, bonus and breaking conditions | Rule-by-rule comparison |
| [ChenShuo2004/ziwei](https://github.com/ChenShuo2004/ziwei) `lib/ziwei/patterns.ts` (MIT) | The same 34 pattern names and conditions as Renhuai123 | Not independent, so not counted |
| Modern articles and blogs (vocus.cc, udn, Threads posts) | Differing explanations of 君臣慶會, 陽梁昌祿 and 府相朝垣 | They don't agree with each other, so only used to confirm that schools differ |
| [mingli.study/famous](https://www.mingli.study/famous) | 43 public figures, each with Life palace stars and named patterns | Case comparison (below) |
| Threads posts by Taiwanese practitioners | Readings and pattern explanations, but almost never with birth data | Could not be re-run. One post on 月生滄海 led to a verified 全書 note (丙丁 years, night birth). |

## Changes made

| Rule | Before | After | Why |
|---|---|---|---|
| 君臣慶會 | 紫微 in 命 plus any two lucky stars in the 三方四正 | 紫微, 左輔 and 右弼 together in 命 | 全書 定貴局: 「紫微左右同守命是也」. Our old rule was far too loose; 4 of 41 cases fired wrongly. |
| 輔弼拱主 (new) | none | 紫微 in 命, with 左輔 and 右弼 in the 三方四正 or flanking | 全書 定貴局: 「紫微守命二星來拱是也，夾之亦然」. Renhuai's 君臣慶會 is this pattern. |
| 府相朝垣 | 天府 and 天相 in the two trines only | Both anywhere in the 三方四正, including the Life palace. 寅/申 is the top form. | The catalogue and Renhuai count 府 or 相 sitting in the Life palace. The 全書 note: 「命寅申…上格，別宮次之」. Agreement on this pattern went from 2 of 13 cases to 13 of 13. |
| 紫府朝垣 | Also fired when 紫府 sit together opposite 七殺 | 紫微 and 天府 must salute from different palaces | 紫府 together opposite is 七殺朝斗; the catalogue's four forms all have them apart |
| 月生滄海 | 同陰 in a 子 Life palace | Also 太陰 in a 子 Property palace (the 全書's own form), plus a note that 丙丁 years with a night birth are best | 全書 定貴局: 「月在子宮守田宅是也」. 卷三: 「太陰居子丙丁富貴忠良」. |
| 馬頭帶劍 (new) | The 太微賦 verse was attached to the 午 pattern | New pattern: 天馬 with 擎羊 in 命. The 午 pattern now cites 卷三. | 全書 定貴局: 「謂馬有刃是也不是居午格」, i.e. explicitly not the 午 pattern |
| 刑囚夾印 | 廉貞 + 天相 + 擎羊 in 命 | 廉貞 with 天刑 or 擎羊 in 命 or 身, with the 全書's reading (a brave, martial type) | 全書 定貴局: 「天刑廉貞同臨身命主武勇之人」 |
| 財蔭夾印, 財印夾祿 (new) | none | 天相 flanked by 天梁 and a 祿 star; 祿存 flanked by 武曲 and 天相 | See the textual issue below |
| 金輿扶駕, 生不逢時 (new) | none | As defined in 定貴局 and 定貧賤局 | Missing 全書 patterns |
| 殺破狼 (new, "structure") | none | 七殺, 破軍 or 貪狼 in the Life palace | Standard star-system grouping. It was the most frequent label we lacked (13 of 41 cases). |
| 極居卯酉 | Only shown when malefics meet it and no rescuer is present | Shown whenever 紫貪 sit in 卯/酉, as Softened when rescued | The catalogue names the structure and then says rescuers cancel the poor reading |
| 日月並明 | Two catalogue placements only | Adds a broader reading: both luminaries bright and both in the 三方四正 | The 全書's definition says 「見前批註」 and the referenced note is not in the text |
| 火貪, 將星得地, 權祿巡逢, 日月藏輝 | Catalogue readings | Unchanged, but each now says when the 全書's stricter definition holds | 定貴局 / 定貧賤局 are stricter: same palace and bright; 卯 only; must meet 巨門 |
| 羊陀夾忌 | Life palace only | Also noted on any palace card where 祿存 and the birth 化忌 meet | Practitioners apply it to the palace where it occurs |

## A textual issue in the 全書

Two 全書 definitions cannot occur as written:
- 財蔭夾印: 「相守命武梁來夾」, 天相 flanked by 武曲 and 天梁.
- 財印夾祿: 「祿守命梁相來夾」, 祿存 flanked by 天梁 and 天相.

天相's neighbours are always 巨門 and 天梁, and 天梁 and 天相 are always adjacent. Across 4,800 generated charts, neither literal reading occurred once.

Swapping the flanking stars between the two definitions makes both workable:
- 天相 flanked by 天梁 and a 祿 star: 94 of 4,800 charts.
- 祿存 flanked by 武曲 and 天相: 14 of 4,800 charts.

The first matches what the modern case list labels as 財蔭夾印 (曼德拉, 孫中山). The rules use these readings, and each rule's basis explains the problem. A test (`tests/crosscheck.test.ts`) keeps checking that the literal readings never occur.

## Case comparison (mingli.study/famous)

Method:
1. Take each public figure's known birth date and gender.
2. Try all 12 時辰 and keep the one that reproduces the Life palace branch and stars the site publishes. 39 of 41 cases could be reproduced.
3. Compare our patterns with the site's labels for that chart.

This tests the pattern logic on the same chart. It says nothing about anyone's real birth time; the site gives none.

| | Before | After |
|---|---|---|
| Labels both sides agree on | 21 | 49 |
| Site labels we don't produce | 73 | 45 |
| Our labels the site doesn't list | 59 | 54 |

Our extra labels are mostly patterns the site's vocabulary doesn't include (祿馬交馳, 權煞化祿, 天乙拱命, 魁鉞凶沖), not wrong detections.

Remaining differences are kept on purpose, because the site uses looser definitions than the 全書:
- **日月照壁 (11 cases):** none of the labelled charts has 太陽 or 太陰 in the Property palace, which the 全書 requires: 「日月臨田宅宮是也」.
- **日月並明 (8):** the site appears to use "both luminaries bright, anywhere". Ours requires them to shine on the Life palace.
- **火貪 / 鈴貪 (8):** the site counts 貪狼 with 火星 or 鈴星 in any palace. The 全書 says 「二星守命」, i.e. in the Life palace.
- **馬頭帶箭 (2):** the site counts any 擎羊 in a 午 Life palace. The 全書 卷三 requires 同陰 or 貪狼.
- **財蔭夾印 (2):** the site counts 祿存 on the same side as 天梁. "夾" means flanked from both sides.
- **羊陀夾忌 (2):** the site counts it in other palaces. We now note it on those palace cards rather than as a Life palace pattern.
- **Not implemented:** 百官朝拱, 風流彩杖, 鈴昌陀武. These come from other sources and are not in the 全書's pattern lists. 鈴昌陀武 is a death-in-a-period warning, which the app avoids.

Eight agreed cases are kept as a regression test (`tests/crosscheck.test.ts`).

## Limits

- No birth-time-verified case studies were available. Threads posts almost never include birth data, and the case site gives no times.
- Copyrighted modern books (王亭之, 陸斌兆, 紫雲) were not consulted directly. The free articles found disagree with each other on the disputed patterns.
- Where sources conflict, the app follows the 全書 and says so in each rule's basis.

## 范振木's published cases (fjm.tw, 2026-11-09)

[逸雲閣星相研究所](https://www.fjm.tw/xoops/modules/tadnews/index.php?ncsn=4) publishes worked cases by 范振木. He teaches the 占驗派 and is the teacher 簡少年 credits for his 天相忌 and 小限 methods. The cases give lunar birth data, every palace's stars, named 夾/拱 features, and events for each 10-year period.

Cases used:
- **論命實務一:** an anonymous woman, lunar 1966-7-2 戌時.
- **李小龍:** lunar 民國29年11月26日亥時.
- **吳火獅:** lunar 民國7年12月8日申時.
- **The 地空/地劫 teaching page:** its placement table by 時辰.

Cases skipped:
- **劉邦友 and the 學歷線 case:** video only.
- **Crime, assault and suicide cases:** sensitive, so not used.
- **論命實務十 and 十一:** they give no birth data. Their charts were searched for by matching every published palace; results are below.

### Chart placement

- Every palace in 論命實務一 matches the published description: stars, 四化, the Body palace in 財帛, and the 戊戌 → 丁酉 → 丙申 → 乙未 period order.
- 李小龍's and 吳火獅's dates only reproduce the published charts when read as **lunar** dates. This explains why mingli.study's 李小龍 chart (Life palace 申) differs from 范振木's (Life palace 丑, 火星 and 天魁).
- 地空/地劫 positions match his table for all 12 時辰.

### Readings

The 10-year period 四化 already matched his readings of 論命實務一 point for point:
- **戊 period:** 疊祿 in 疾厄 and 化忌 in 福德.
- **丁 period:** 巨門忌 on the Wealth palace.
- **丙 period:** 疊忌 on 廉貞 in 疾厄, and 疊祿 on 天同.
- **乙 period:** 太陰忌 on the Travel palace.

His natal readings used four techniques the app lacked. These were added:

| Technique | Example in his cases | Added as |
|---|---|---|
| 夾 on any palace | 紫府夾官祿, 昌曲夾田宅, 火鈴夾福德 | Palace-card notes for helpful pairs (紫府, 日月, 左右, 昌曲, 魁鉞) and harmful pairs (火鈴) |
| 空劫 make a palace weak (同宮, 夾, 拱, 對照) | 空劫拱疾厄; 李小龍's Body palace 被空劫夾 | A palace-card note; it also lowers that palace's tone by one step |
| 日月反背 named whenever a luminary is out of its hours | 太陽 in 戌 for a 戌時 birth: 「主虛，好看而已」 | 日月藏輝 now always fires, as Softened when lucky stars are present |
| 移根換葉 | 「日月辰戌位坐命，出國運都很強」 | New structure |

With these, every feature he names in 論命實務一, 李小龍 and 吳火獅 now appears in the app's output. The three cases and the 空劫 table are regression tests in `tests/fjm.test.ts`. 論命實務一 is anonymous in the source.

### 天馬 is placed by month in 范振木's charts

論命實務十 gives no birth data, so its chart was found by searching 1965 (the subject is 42 in 2006) for every published palace. Three days in lunar 1965 冬月, 巳時, match every claim except one: he puts 天馬 in 疾厄 (寅), while our chart had it in 亥.

The difference is the placement rule:
- **The 全書** places 天馬 by the birth-year branch: 「安天馬星訣 論本生年支」. 巳年 gives 亥, which is what iztro does.
- **范振木** places it by the lunar birth month (月馬): 冬月 (a 子 month) gives 寅.

論命實務一 confirms this independently. He writes that in the 丙申 period 天同化雙祿 has 「對宮有天馬」. That needs 天馬 in 寅, which is the month rule (七月 → 寅). The year rule would put it in 申 itself.

Advanced settings now offer **天馬 placement: by birth year (全書, default) / by birth month (占驗派)**. With the month setting, 論命實務十 matches his description in every palace.

## kunde.org.tw and 倪海廈 天紀 notes (2026-11-09)

### kunde.org.tw 「淑真的廉貞故事」

The case is 陰女, 農曆68年5月26日辰時, printed as a full chart with brightness.

**Placement.** Our chart agrees with every star and every brightness on the printout. It also agrees on 火六局, 命主 祿存, 身主 天相, the Body palace in 財帛, the 己 四化 and the period order. There are three cosmetic differences:
- iztro adds 年解, 天德 and 月德, which the printout omits.
- The printout marks 祿存 as 廟; iztro gives 祿存 no brightness.
- The printout marks 旬空 in both void palaces; iztro marks only the one matching the year's yin or yang.

**Palace tone.** The article rates each palace good, mixed or bad, judging mainly by the palace's own stars. Our old tone counted only the 三方四正. Against the old tone, 6 of 12 matched, and the Health palace (bright 機巨, no malefics in it) came out the opposite.

The tone now weighs the palace itself first:
- its own lucky stars and 祿/權/科 help;
- its malefics hurt;
- a birth 化忌 in it counts heavily;
- the 三方四正 counts a quarter;
- 空劫 weakens it.

I chose this weighting against the 20 palace ratings from kunde and 范振木's 論命實務一. It matches 10 exactly and never contradicts a rating. The old method also matched 10 but contradicted 3. A test keeps this calibration.

### 倪海廈 天紀 episode 11 notes (finalhopes.com)

These are a student's notes from 倪海廈's 天紀 lectures. Three cases give the year, gender, 局, 紫微 position and Life palace, but no day or time.

**Placement.** Each case was searched for in its year:
- **民國37 (1948):** two lunar 冬月 未時 charts match every stated feature: Life palace 巳 with 太陽 and 祿存, 夫妻 with 天同 and 文昌, 子女 with 七殺 and 天馬.
- **民國54 (1965):** 24 charts match. All of them also carry the other stated features: 化科 in 遷移, 化忌 in 子女, 化祿 in 僕役, and 陀羅 in a 寅 疾厄.
- **民國83 (1994):** 48 charts match the structure. All of them have 廉破 in the Life palace and 化科 on 武曲 in 官祿, as stated. 昌曲 in the Life palace and 右弼 in 父母 never occur together, which suggests the 「曲昌入命」 line is a general aside rather than part of this case.

Where his rules overlap ours, they agree:
- **身宮 placement.** In 財帛 he reads private business or trade; in 官祿, office; in 遷移, a life away from home.
- **廉貪 or 廉破 in 夫妻.** He reads separation; the 全書 卷二 夫妻 lines agree.

Added from his notes: what a birth-year transformation in the Career palace suggests about the kind of work. 化科 points to teaching or research, 化權 to public office or management, and 化祿 to work that handles money. This is consistent with the 全書's natures of 科 (主掌文墨) and 權 (掌判生殺).

Not adopted, because they are specific to his school or predict death or injury, which the app avoids:
- 左輔 or 右弼 alone in a palace means isolation;
- 化科 with 化忌 together means a butcher;
- a malefic alone in a 10-year period means a fatal period;
- the feng shui directions he pairs with marriage timing.

### 倪海廈 天紀 episodes 10, 12–15 (finalhopes.com blog/78–83)

These notes cover 18 more cases. The checker took each case's stated year, gender, 局, 紫微 position and Life palace, listed every lunar chart that fits, and counted how many of those charts carry each claim in the notes.

**Most claims reproduce.** In 15 of the 18 cases, every claim holds in at least one matching chart, and most hold in all of them. Claims that hold in only some charts depend on the birth day or hour, which the notes don't give. In the other three cases, one claim each never occurs:
- **12-3:** 武曲 in 父母.
- **13-2:** 太陽化忌 next to 紅鸞. A 甲 year has 太陽化忌, but never in the same palace as 紅鸞 for this chart shape.
- **14-3:** 火星 陷 in 遷移. This is a brightness-table difference (see below).

These look like slips in the student's notes, or a different brightness table, rather than a different placement method.

**12-2 has a typo.** No 金四局 chart fits it, but 土五局 charts reproduce all of its claims: 巨門 and 太陽 in the Life palace, 化忌 in 兄弟, and only 化科 in the Life palace's 三方四正.

**「武官星」 means 七殺.** The notes use this name in 13-1, where the Life palace holds 七殺.

**倪's 庚 and 壬 tables differ from ours.**
- **14-2 (庚 1960).** His 「太陰化忌」 occurs in none of the 39 matching charts under the common table (庚 陽武陰同). It occurs in all 39 under 庚 陽武同陰 (天同化科, 太陰化忌). So he uses that table.
- **14-3 (壬 1942).** His 夫妻 化科 next to 太陽 and 太陰 only occurs when 左輔 takes 壬 化科, as in the common table (4 of the 52 matching charts; it needs 左輔 in 夫妻). He does not use the 全書's 天府.
- **火星 brightness.** His 遷移 火星 陷 in 14-3 follows a different brightness table. The app keeps iztro's.

**The 全書's own 四化 verse.** Checking this led back to 全書 卷二 (安祿權科忌四星變化訣): 「壬梁紫府武宿是」. So the 全書 gives 壬 天府化科, not 左輔. The app's default was mislabelled "Common table (全書)". It is now "Common modern table".

Changes from this check:
- Two new 四化 presets:
  - **全書:** 壬 天府化科, otherwise as common.
  - **天紀 (倪海廈):** 庚 陽武同陰.
- Tests in `tests/sihua.test.ts` reproduce cases 14-2 and 14-3.

### 范振木 論命實務十一

This case gives no birth data. Searching the 丁 years found charts matching every published palace: lunar 二月 at 亥時, with 1967 fitting his narrative. In that chart the Body palace sits in an empty 夫妻 with 截路, and the periods run 甲辰 → 癸卯 → 壬寅 → 癸丑. Together with 論命實務十, both of his no-birth-data cases reproduce exactly.

## Files shared in iztro discussion #205 (2026-11-09)

[iztro discussion #205](https://github.com/SylarLong/iztro/discussions/205) links about 20 PDFs.

**Not used.** Most are scans of modern books that are still in copyright, shared without the publishers' permission:
- 蔡明宏, 張開卷, 紫雲, 陸斌兆/王亭之, 大德山人, 令東來, 徐曾生, 陸在田, 朱雲山 and 許銓仁;
- the 天翼 course notes.

These were not downloaded or used.

**Downloaded.** Seven files that looked like shared notes, web articles or classical text were downloaded outside the repository, to `~/Development/ziwei-sources/`.

| File | What it is | Use |
|---|---|---|
| 紫微斗數全書 (南北山人 簡體版) | A different edition of the 全書, with 羅洪先's preface | Cross-check of our Wikisource text |
| 天紀--紫微斗數聽課筆記 (2022) | Students' notes on 倪海廈's 天紀 lectures 2–15 | Cases and rules, paraphrased |
| 劉金府 象數心學紫微斗數札記 | Notes on 劉金府's 象數 teaching | Checked for its 四化 table only |
| 紫微斗數的創作原理 (謝昕潤) | Web article on 十八飛星 and 四化 theory | Theory only |
| 紫微斗數集成全書 (yibooks.net) | Modern mainland compilation | Checked for its 四化 table only |
| 紫微斗數古法 內部講義 (2015–16) | A study group's 宮氣 course | Different method; not used |
| 紫微斗數星性 母本 | Star descriptions compiled from chinazwds.com | Not used (copyright unclear) |

### Findings

- **The 全書 textual problem is in the text, not the transcription.** The second edition has the same 財蔭夾印 「天相守命，武，梁來夾」 and 財印夾祿 「祿存守命，天梁，天相來夾」 as Wikisource. Its 君臣慶會, 月生滄海, 日月照壁, 生不逢時 and 極居卯酉 definitions also match ours word for word. So the swapped reading the app uses fixes a fault in the 全書 tradition itself.
- **四化 tables.** 劉金府 and the 集成全書 both use the common modern table: 庚 陽武陰同, 壬 梁紫左武, 戊 貪陰右機. 劉金府 explicitly defends 庚 太陰化科 against case examples. This supports keeping it as the default.
- **倪海廈's two dated cases reproduce exactly.** Lecture 9 gives full birth data for two cases. Both match every palace he describes, and the tests are in `tests/ni.test.ts`.
  - 命例實批2 (1955-03-07 申時, 陰女): every palace he names matches.
  - 命例實批4 (1958-06-27, 陽男): only 亥時 fits his 局, 命 and 紫微. That chart then matches all his natal points and all four decades.
- **倪 reads year events from the 小限.** In 命例實批2 he says that at 37 sui (1991) 「流年運在遷移」. The 1991 year palace (未) is the Life palace, but the 小限 at 37 is 丑, the 遷移 palace. The app doesn't use 小限 yet.
- **倪's stance on remedies (lecture 2).** He says remedies aren't charms or bought feng-shui objects, but changes of place and intention. He puts it as fate, place and human effort each counting a third, so place plus effort outweighs fate. This matches the conduct-based approach of the app's advice notes.
