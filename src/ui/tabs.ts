// The tab bar under the chart. Each reading section carries data-panel="<key>"; only the selected one
// shows. The choice is remembered per browser, and printing shows every panel (see style.css).

import type { Script } from '../engine/chart';
import { isZh } from '../i18n/lang';
import { toScript } from './zhText';

export const TABS: { key: string; en: string; zh: string; full: string }[] = [
  { key: 'overview', en: 'Overview', zh: '命宮', full: '命宮總論' },
  { key: 'decades', en: '10-year periods', zh: '大限', full: '十年大限' },
  { key: 'palaces', en: 'Palaces', zh: '十二宮', full: '十二宮' },
  { key: 'patterns', en: 'Patterns', zh: '格局', full: '格局' },
  { key: 'bazi', en: 'Four Pillars', zh: '八字', full: '八字' },
  { key: 'compat', en: 'Compatibility', zh: '合婚', full: '合婚' },
];

const STORE = 'ziwei-chart:tab';
let current = (() => {
  try {
    return localStorage.getItem(STORE) ?? 'overview';
  } catch {
    return 'overview';
  }
})();

/** Draw the tab bar and show the selected panel. Call again after the panels are re-rendered. */
export function setupTabs(nav: HTMLElement, script: Script): void {
  const panels = () => [...document.querySelectorAll<HTMLElement>('[data-panel]')];
  const available = TABS.filter((t) => panels().some((p) => p.dataset.panel === t.key));
  if (!available.some((t) => t.key === current)) current = available[0]?.key ?? 'overview';

  const buttons = available.map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.id = `tab-${t.key}`;
    b.setAttribute('aria-controls', `panel-${t.key}`);
    const zh = document.createElement('span');
    zh.className = 'zh';
    zh.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
    zh.textContent = toScript(isZh() ? t.full : t.zh, script);
    if (isZh()) b.append(zh);
    else b.append(t.en, ' ', zh);
    b.addEventListener('click', () => select(t.key, true));
    b.addEventListener('keydown', (e) => {
      const k = available.findIndex((x) => x.key === t.key);
      const to = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? available.length - 1 : -2;
      if (to === -2) return;
      e.preventDefault();
      const next = available[(to + available.length) % available.length];
      select(next.key, false);
      nav.querySelector<HTMLElement>(`#tab-${next.key}`)?.focus();
    });
    return b;
  });
  nav.setAttribute('role', 'tablist');
  nav.replaceChildren(...buttons);

  function select(key: string, scroll: boolean): void {
    current = key;
    try {
      localStorage.setItem(STORE, key);
    } catch {
      /* not remembered */
    }
    for (const b of buttons) {
      const on = b.id === `tab-${key}`;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      // On narrow screens the bar scrolls sideways: keep the selected tab visible.
      if (on && (b.offsetLeft < nav.scrollLeft || b.offsetLeft + b.offsetWidth > nav.scrollLeft + nav.clientWidth))
        nav.scrollLeft = b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2;
    }
    for (const p of panels()) {
      p.id = `panel-${p.dataset.panel}`;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', `tab-${p.dataset.panel}`);
      p.hidden = p.dataset.panel !== key;
    }
    // A card holding several panels (the analysis card) hides when none of them is showing.
    for (const card of document.querySelectorAll<HTMLElement>('[data-panels]'))
      card.hidden = ![...card.querySelectorAll<HTMLElement>('[data-panel]')].some((p) => !p.hidden);
    // Keep the bar in view without jumping when it is already at the top.
    if (scroll && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: 'start' });
  }
  select(current, false);
}

/** Switch tab from elsewhere (e.g. a link inside another panel). */
export function showTab(key: string): void {
  document.getElementById(`tab-${key}`)?.click();
}
