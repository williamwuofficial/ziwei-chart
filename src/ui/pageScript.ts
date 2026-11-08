// Script switch (繁 / 简) for the reference pages. Shares the chart page's stored setting, so
// a reader who chose Simplified for their chart sees Simplified here too, and vice versa.

import type { Script } from '../engine/chart';

const STORAGE_KEY = 'ziwei-chart:last-input';
const OWN_KEY = 'ziwei-chart:script';

function stored(): Script {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')?.settings?.script ?? localStorage.getItem(OWN_KEY);
    return s === 'zh-CN' ? 'zh-CN' : 'zh-TW';
  } catch {
    return 'zh-TW';
  }
}

function store(script: Script): void {
  try {
    localStorage.setItem(OWN_KEY, script);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const prev = JSON.parse(raw);
    if (prev?.settings) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, settings: { ...prev.settings, script } }));
  } catch {
    /* storage unavailable: the choice lasts for this page view */
  }
}

/** Render with the stored script, and re-render when the header's script select changes. */
export function setupScriptToggle(render: (script: Script) => void): void {
  const select = document.querySelector<HTMLSelectElement>('#page-script');
  const script = stored();
  if (select) {
    select.value = script;
    select.addEventListener('change', () => {
      const s = select.value === 'zh-CN' ? 'zh-CN' : 'zh-TW';
      store(s);
      document.documentElement.dataset.script = s;
      render(s);
    });
  }
  document.documentElement.dataset.script = script;
  render(script);
}
