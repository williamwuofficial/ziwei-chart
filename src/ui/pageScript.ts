// The Learn and Methods pages: render with the stored language, and again on every switch.

import type { Script } from '../engine/chart';
import { scriptOf } from '../i18n/lang';
import { setupLang } from './langSwitch';

export function setupScriptToggle(render: (script: Script) => void): void {
  setupLang(() => render(scriptOf()));
  render(scriptOf());
}
