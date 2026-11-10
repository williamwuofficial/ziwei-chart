// Methods & sources page: static text in English (the page markup) or Chinese (the #about-zh
// template), the language switch, and live counts from the rule data.

import './style.css';
import { ALL_PATTERNS } from './analysis/rules/patterns';
import { isZh } from './i18n/lang';
import { applyStatic, setupLang } from './ui/langSwitch';

const root = document.getElementById('about')!;
const en = root.innerHTML;
const zh = document.querySelector<HTMLTemplateElement>('#about-zh')?.innerHTML ?? en;

function render(): void {
  root.innerHTML = isZh() ? zh : en;
  const count = document.getElementById('pattern-count');
  if (count) {
    const n = (k: string) => ALL_PATTERNS.filter((r) => r.kind === k).length;
    count.textContent = isZh()
      ? `全部${ALL_PATTERNS.length}個（吉格${n('auspicious')}個、凶格${n('adverse')}個、星系結構${n('structure')}個）`
      : `all ${ALL_PATTERNS.length} (${n('auspicious')} auspicious, ${n('adverse')} challenging, ${n('structure')} star structures)`;
  }
  // Convert the new text for Simplified.
  applyStatic();
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

setupLang(render);
render();
