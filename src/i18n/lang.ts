// Display language: Traditional Chinese, Simplified Chinese or English.
//
// The analysis is written in English with ⟨中文⟩ term markers. For the Chinese modes every
// sentence also has a Chinese version, written once in Traditional; the renderer converts it to
// Simplified (ui/zhText.ts). Two ways in:
//  - L(en, zh): a sentence built in code, with both versions side by side.
//  - tr(en): a fixed English string from the rule data, looked up in the zh dictionary
//    (i18n/zh/). A test checks the dictionary covers every such string.

import type { Script } from '../engine/chart';
import { ZH } from './zh';

export type Lang = 'zh-TW' | 'zh-CN' | 'en';
export const LANGS: Lang[] = ['zh-TW', 'zh-CN', 'en'];

let current: Lang = 'en';

export const getLang = (): Lang => current;
export const setLang = (l: Lang): void => {
  current = l;
};
export const isZh = (): boolean => current !== 'en';
/** The Chinese script for chart labels and terms (English mode uses Traditional terms). */
export const scriptOf = (l: Lang = current): Script => (l === 'zh-CN' ? 'zh-CN' : 'zh-TW');

/** Pick the English or (Traditional) Chinese version of a sentence. */
export const L = (en: string, zh: string): string => (current === 'en' ? en : zh);

/** English strings looked up while in a Chinese mode that the dictionary lacks (for tests). */
export const MISSING = new Set<string>();

/** Translate a fixed English string from the rule data. Falls back to the English. */
export function tr(en: string): string;
export function tr(en: string | undefined): string | undefined;
export function tr(en: string | undefined): string | undefined {
  // Already Chinese (a sentence built with L), or nothing to translate.
  if (en === undefined || current === 'en' || !/[A-Za-z]/.test(en)) return en;
  const zh = ZH[en];
  if (zh !== undefined) return zh;
  MISSING.add(en);
  return en;
}

/** List items joined the way each language does it. */
export const join = (xs: string[]): string => xs.join(current === 'en' ? ', ' : '、');

// ── Stored choice ───────────────────────────────────────────────────────────────

const KEY = 'ziwei-chart:lang';
const LAST_INPUT = 'ziwei-chart:last-input';

/**
 * The saved language, else a guess. Someone who already used the app (a saved chart, from before
 * the switch existed) keeps English; a new visitor gets their browser's language.
 */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'zh-TW' || saved === 'zh-CN' || saved === 'en') return saved;
    if (localStorage.getItem(LAST_INPUT)) return 'en';
  } catch {
    /* storage blocked: guess */
  }
  const nav = (globalThis.navigator?.languages?.[0] ?? globalThis.navigator?.language ?? '').toLowerCase();
  if (/^zh-(cn|sg|hans)/.test(nav)) return 'zh-CN';
  if (nav.startsWith('zh')) return 'zh-TW';
  return 'en';
}

export function storeLang(l: Lang): void {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* the choice lasts for this page view */
  }
}

/** The <html lang> value for a language. */
export const htmlLang = (l: Lang = current): string => (l === 'en' ? 'en' : l === 'zh-CN' ? 'zh-Hans' : 'zh-Hant');
