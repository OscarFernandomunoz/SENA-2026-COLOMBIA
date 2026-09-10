import tseslint from 'typescript-eslint';

import { nodeEnvironment } from './eslint/environments.js';
import ignores from './eslint/ignores.js';
import presets from './eslint/presets.js';
import { typescriptRules } from './eslint/rules.js';

export default tseslint.config(
  ignores,
  ...presets,
  nodeEnvironment,
  typescriptRules
);
