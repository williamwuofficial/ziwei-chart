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
