import type { Ctx } from '../predicates';

/**
 * Where a rule comes from. `verse` is a classical line (經云 / 賦), public domain, quoted in Chinese.
 * `basis` says in English what the rule's conditions are based on.
 */
export interface Source {
  /** Original classical text, quoted in Chinese (public domain). */
  verse?: string;
  /** Work the verse comes from, when verified against its text (scripts/verify-sources.mjs). */
  work?: '紫微斗數全書' | '紫微斗數' | '三命通會' | '滴天髓' | '淵海子平';
  /** Section of that work, e.g. 斗數骨髓賦. */
  section?: string;
  basis: string;
}

export interface Match {
  /** Facts that made the rule fire, in English with ⟨中文⟩ term markers. */
  evidence: string[];
  /** Palaces to highlight. */
  palaces: number[];
  /** Optional extra sentence for a sub-variant (e.g. the weaker 申 form of 巨日同宮). */
  variant?: string;
}

export interface PatternRule {
  id: string;
  zh: string;
  en: string;
  kind: 'auspicious' | 'adverse' | 'structure';
  sources: Source[];
  /** Returns undefined when the core structure is absent. */
  match(x: Ctx): Match | undefined;
  /** Palaces checked for support and malefics. Default: 三方四正 of 命宮. */
  scope?(x: Ctx): number[];
  /** Malefic stars that do not break this pattern (e.g. 火星 for 火貪). */
  tolerates?: readonly string[];
  /** Core meaning, written as a tendency. */
  text: string;
}

export type PatternStatus = 'formed' | 'flawed' | 'bare' | 'broken' | 'present' | 'mitigated';
