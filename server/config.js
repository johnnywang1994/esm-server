const path = require('path');
const __ROOT = process.cwd();
const __NODE_MODULES = 'node_modules';
const __MODULE = '/@modules/';
const CONFIGS = require(resolveRoot('./es.config'));

// resolve path from root
function resolveRoot(p) { return path.resolve(__ROOT, p); }

// resolve path from node_modules
function resolveModules(p) { return path.resolve(__ROOT, __NODE_MODULES, p); }

module.exports = {
  __ROOT,
  __MODULE,
  CONFIGS,
  resolveRoot,
  resolveModules,
};
