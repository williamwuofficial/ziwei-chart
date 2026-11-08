import { astro } from 'iztro';

// Phase 0 sanity check: prove the chart engine bundles and runs in the browser.
const out = document.getElementById('engine-check');
try {
  const chart = astro.bySolar('2000-1-1', 0, 'female', true, 'zh-TW');
  const ming = chart.palaces.find((p) => p.name === '命宮');
  const stars = ming?.majorStars.map((s) => s.name).join('、') || '（空宮）';
  if (out) out.textContent = `Chart engine OK: sample chart 命宮 ${ming?.heavenlyStem}${ming?.earthlyBranch}, ${stars}, ${chart.fiveElementsClass}.`;
} catch (err) {
  if (out) out.textContent = `Chart engine failed to load: ${String(err)}`;
}
