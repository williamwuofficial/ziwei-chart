import type { Script } from '../engine/chart';
import { GLOSSARY } from '../i18n/glossary';
import T2S from '../i18n/t2s.json';

const t2s = T2S as Record<string, string>;
const CJK = /[㐀-鿿]+/g;
const MAX_TERM = Math.max(...Object.keys(GLOSSARY).map((k) => k.length));

/** Convert Traditional text to the display script. */
export function toScript(text: string, script: Script): string {
  if (script === 'zh-TW') return text;
  let out = '';
  for (const ch of text) out += t2s[ch] ?? ch;
  return out;
}

/** Glossary lookup that accepts either script. */
const S2T: Record<string, string> = Object.fromEntries(Object.entries(t2s).map(([t, s]) => [s, t]));
export function gloss(term: string) {
  const trad = [...term].map((ch) => S2T[ch] ?? ch).join('');
  return GLOSSARY[term] ?? GLOSSARY[trad];
}
export const tip = (term: string) => {
  const g = gloss(term);
  return g ? `${g.py} · ${g.en}` : undefined;
};

/**
 * Render analysis text: strips ⟨⟩ markers, converts Chinese runs to the display script, tags them
 * with a lang attribute, and adds pinyin + English tooltips for glossary terms (longest match).
 */
export function rich(text: string, script: Script): DocumentFragment {
  const frag = document.createDocumentFragment();
  const clean = text.replace(/[⟨⟩]/g, '');
  const lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
  let last = 0;
  for (const m of clean.matchAll(CJK)) {
    if (m.index! > last) frag.append(clean.slice(last, m.index));
    const run = m[0];
    // Single-character terms (廟, 得, 死…) only count when they stand alone, not inside a word.
    const termAt = (at: number, len: number) => (len > 1 || run.length === 1) && !!GLOSSARY[run.slice(at, at + len)];
    let i = 0;
    while (i < run.length) {
      let len = Math.min(MAX_TERM, run.length - i);
      while (len > 0 && !termAt(i, len)) len--;
      const span = document.createElement('span');
      span.lang = lang;
      if (len > 0) {
        const term = run.slice(i, i + len);
        span.className = 'term';
        span.textContent = toScript(term, script);
        span.title = tip(term)!;
        i += len;
      } else {
        // Group consecutive non-glossary characters into one span.
        let j = i + 1;
        while (j < run.length && ![...Array(Math.min(MAX_TERM, run.length - j))].some((_, k) => termAt(j, k + 1))) j++;
        span.textContent = toScript(run.slice(i, j), script);
        i = j;
      }
      frag.append(span);
    }
    last = m.index! + run.length;
  }
  if (last < clean.length) frag.append(clean.slice(last));
  return frag;
}
