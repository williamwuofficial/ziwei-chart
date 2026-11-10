// Chinese (Traditional) versions of the fixed English strings in the rule data, keyed by the
// English. Split by area; tests/i18n.test.ts checks every string the analysis uses is here.

import patterns from './patterns';
import stars from './stars';
import juan2 from './juan2';
import misc from './misc';
import bazi from './bazi';
import compat from './compat';

export const ZH: Record<string, string> = { ...patterns, ...stars, ...juan2, ...misc, ...bazi, ...compat };
