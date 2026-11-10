// The 繁 / 简 / EN switch in the site header, shared by every page, and the static page text.
//
// Static text in the HTML carries its Chinese in data attributes, written in Traditional:
//   data-zh="…"            replaces the element's innerHTML in a Chinese mode
//   data-zh-placeholder, data-zh-title, data-zh-aria-label, data-zh-content   replace attributes
// The English stays in the markup as written. In Simplified, every Chinese character in the static
// parts of the page is then converted.

import { detectLang, getLang, htmlLang, isZh, scriptOf, setLang, storeLang, type Lang } from '../i18n/lang';
import { toScript } from './zhText';

const ATTRS = ['placeholder', 'title', 'aria-label', 'content'] as const;
/** Parts of the pages that are written in the HTML rather than drawn by code. */
const STATIC_ROOTS = 'head, .site-header, #birth-form, .chart-head, .decades > .label, .legend, .site-footer, #about';

const enHtml = new WeakMap<Element, string>();
const enAttr = new WeakMap<Element, Partial<Record<(typeof ATTRS)[number], string | null>>>();
const tradText = new WeakMap<Text, string>();

/** Put the page's static text into the current language. */
export function applyStatic(): void {
  const zh = isZh();
  for (const el of document.querySelectorAll<HTMLElement>('[data-zh]')) {
    if (!enHtml.has(el)) enHtml.set(el, el.innerHTML);
    el.innerHTML = zh ? el.dataset.zh! : enHtml.get(el)!;
  }
  for (const a of ATTRS)
    for (const el of document.querySelectorAll<HTMLElement>(`[data-zh-${a}]`)) {
      const saved = enAttr.get(el) ?? {};
      if (!(a in saved)) saved[a] = el.getAttribute(a);
      enAttr.set(el, saved);
      const v = zh ? el.getAttribute(`data-zh-${a}`) : saved[a];
      if (v === null || v === undefined) el.removeAttribute(a);
      else el.setAttribute(a, v);
    }
  // Simplified: convert the Chinese in the static parts, keeping each text node's Traditional
  // original so switching back is lossless.
  const script = scriptOf();
  for (const root of document.querySelectorAll(STATIC_ROOTS)) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      if (!/[㐀-鿿]/.test(n.nodeValue ?? '')) continue;
      if (!tradText.has(n)) tradText.set(n, n.nodeValue!);
      n.nodeValue = toScript(tradText.get(n)!, script);
    }
  }
  // Attributes with Chinese (tooltips, the page description).
  for (const a of ATTRS)
    for (const el of document.querySelectorAll<HTMLElement>(`[${a}]`)) {
      const v = el.getAttribute(a);
      if (!v || !/[㐀-鿿]/.test(v)) continue;
      const key = `data-trad-${a}`;
      if (!el.hasAttribute(key)) el.setAttribute(key, v);
      el.setAttribute(a, toScript(el.getAttribute(key)!, script));
    }
  document.documentElement.lang = htmlLang();
  document.documentElement.dataset.script = script;
  document.documentElement.dataset.lang = getLang();
  for (const b of document.querySelectorAll<HTMLButtonElement>('.langs button[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === getLang()));
}

/**
 * Set the language from storage (or the browser), translate the static text, and call `onChange`
 * after every switch so the page can redraw what its code renders.
 */
export function setupLang(onChange: () => void): void {
  setLang(detectLang());
  applyStatic();
  for (const b of document.querySelectorAll<HTMLButtonElement>('.langs button[data-lang]'))
    b.addEventListener('click', () => {
      const l = b.dataset.lang as Lang;
      if (l === getLang()) return;
      setLang(l);
      storeLang(l);
      applyStatic();
      onChange();
    });
}
