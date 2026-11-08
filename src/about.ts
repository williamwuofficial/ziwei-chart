// Methods & sources page: static text, plus the 繁/简 switch and live counts from the rule data.

import './style.css';
import type { Script } from './engine/chart';
import { ALL_PATTERNS } from './analysis/rules/patterns';
import { toScript } from './ui/zhText';
import { setupScriptToggle } from './ui/pageScript';

const count = document.getElementById('pattern-count');
if (count) {
  const n = (k: string) => ALL_PATTERNS.filter((r) => r.kind === k).length;
  count.textContent = `all ${ALL_PATTERNS.length} (${n('auspicious')} auspicious, ${n('adverse')} challenging, ${n('structure')} star structures)`;
}

// Keep each text node's Traditional original so switching back and forth is lossless.
const root = document.getElementById('about')!;
const nodes: [Text, string][] = [];
const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/[㐀-鿿]/.test(n.nodeValue ?? '')) nodes.push([n as Text, n.nodeValue!]);

setupScriptToggle((script: Script) => {
  for (const [node, trad] of nodes) node.nodeValue = toScript(trad, script);
  root.lang = 'en';
});
