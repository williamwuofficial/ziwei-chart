import type { Brightness, ChartM, Mut, PalaceM, PalaceName } from './model';

// Star groups used across the classical rules.
export const LUCKY6 = ['左輔', '右弼', '文昌', '文曲', '天魁', '天鉞'] as const; // 六吉
export const SHA4 = ['擎羊', '陀羅', '火星', '鈴星'] as const; // 四煞
export const KONGJIE = ['地空', '地劫'] as const; // 空劫
export const MAJOR14 = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍',
] as const;

const BRIGHT: Brightness[] = ['廟', '旺'];
const FALLEN: Brightness[] = ['陷', '不'];

/** Index helpers. iztro palace index 0 = 寅. */
export const opp = (i: number) => (i + 6) % 12;
export const trines = (i: number): [number, number] => [(i + 4) % 12, (i + 8) % 12];
/** 三方四正: the palace, its two trines and the opposite palace. */
export const sfsz = (i: number) => [i, ...trines(i), opp(i)];
/** The two neighbouring palaces (for 夾 flanking patterns). */
export const neighbours = (i: number): [number, number] => [(i + 11) % 12, (i + 1) % 12];
/** 暗合 (六合) partner: branch pairs 寅亥 卯戌 辰酉 巳申 午未 子丑 all sum to 9 (mod 12) in iztro order. */
export const anhe = (i: number) => (21 - i) % 12;

/** Queries over one chart. Every successful check can be described for the "Why?" panel. */
export class Ctx {
  readonly ming: number;
  readonly body: number;
  /** `ming` overrides the Life palace, to read a 大限 palace as if it were the 命宮. */
  constructor(readonly c: ChartM, opts: { ming?: number } = {}) {
    this.ming = opts.ming ?? c.palaces.findIndex((p) => p.name === '命宮');
    this.body = c.palaces.findIndex((p) => p.isBody);
  }

  p(i: number): PalaceM {
    return this.c.palaces[i];
  }
  byName(name: PalaceName): number {
    return this.c.palaces.findIndex((p) => p.name === name);
  }
  /** All star names in a palace: main, minor and miscellaneous. */
  stars(i: number): string[] {
    const p = this.p(i);
    return [...p.major.map((s) => s.name), ...p.minor.map((s) => s.name), ...p.adjective];
  }
  has(i: number, ...names: string[]): boolean {
    const s = this.stars(i);
    return names.every((n) => s.includes(n));
  }
  hasAny(i: number, names: readonly string[]): string[] {
    const s = this.stars(i);
    return names.filter((n) => s.includes(n));
  }
  /** Only the 14 main stars. */
  majors(i: number): string[] {
    return this.p(i).major.map((s) => s.name);
  }
  noMain(i: number): boolean {
    return this.p(i).major.length === 0;
  }
  /** Main stars are exactly these (order-insensitive). */
  majorsAre(i: number, ...names: string[]): boolean {
    const m = this.majors(i);
    return m.length === names.length && names.every((n) => m.includes(n));
  }
  /** Palace index holding the star, or −1. */
  find(name: string): number {
    return this.c.palaces.findIndex((p) => this.stars(p.index).includes(name));
  }
  at(i: number, ...branches: string[]): boolean {
    return branches.includes(this.p(i).branch);
  }
  brightness(i: number, star: string): Brightness | undefined {
    const p = this.p(i);
    return [...p.major, ...p.minor].find((s) => s.name === star)?.brightness;
  }
  bright(i: number, star: string): boolean {
    const b = this.brightness(i, star);
    return !!b && BRIGHT.includes(b);
  }
  fallen(i: number, star: string): boolean {
    const b = this.brightness(i, star);
    return !!b && FALLEN.includes(b);
  }
  /** Birth-year transformations sitting in a palace, as [star, mutagen]. */
  muts(i: number): [string, Mut][] {
    const p = this.p(i);
    return [...p.major, ...p.minor].filter((s) => s.mutagen).map((s) => [s.name, s.mutagen!]);
  }
  hasMut(i: number, m: Mut): boolean {
    return this.muts(i).some(([, k]) => k === m);
  }
  /** Palace index holding the birth-year transformation, or −1. */
  findMut(m: Mut): number {
    return this.c.palaces.findIndex((p) => this.hasMut(p.index, m));
  }
  inSet(set: number[], ...names: string[]): boolean {
    return names.every((n) => set.some((i) => this.has(i, n)));
  }

  /** Lucky support across palaces: 六吉, 祿存 and the 祿/權/科 transformations. */
  support(set: number[]): string[] {
    const out: string[] = [];
    for (const i of set) {
      for (const n of this.hasAny(i, [...LUCKY6, '祿存'])) out.push(n);
      for (const [s, m] of this.muts(i)) if (m !== '忌') out.push(`${s}化${m}`);
    }
    return [...new Set(out)];
  }
  /** Malefic influences across palaces: 四煞, 空劫 and 化忌. */
  malefic(set: number[], opts: { except?: readonly string[] } = {}): string[] {
    const out: string[] = [];
    for (const i of set) {
      for (const n of this.hasAny(i, [...SHA4, ...KONGJIE])) if (!opts.except?.includes(n)) out.push(n);
      for (const [s, m] of this.muts(i)) if (m === '忌') out.push(`${s}化忌`);
    }
    return [...new Set(out)];
  }

  /** Day birth: 卯 to 申 hours (iztro index 3–8). */
  get dayBirth(): boolean {
    return this.c.timeIndex >= 3 && this.c.timeIndex <= 8;
  }
  yearStemIs(...stems: string[]): boolean {
    return stems.includes(this.c.yearStem);
  }

  /** "命宮 (子)" style label, with ⟨⟩ term markers for the renderer. */
  label(i: number): string {
    const p = this.p(i);
    return `⟨${p.name}⟩ (${p.branch})`;
  }
}
