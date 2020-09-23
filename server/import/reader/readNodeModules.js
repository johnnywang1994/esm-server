const fs = require('fs');
const { transform } = require('lebab');
const {
  __MODULE,
  CONFIGS,
  resolveModules,
} = require('../../config');
const {
  fileExists,
  rewriteImport,
  handleModulePath,
} = require('../utils');

/**
 * Import Modules from node_modules
 * @param {*} req 
 * @param {*} res 
 */
function readNodeModules({ url }, res) {
  res.set('Content-Type', 'application/javascript');
  const prefix = resolveModules(url.replace(__MODULE, ''));
  const filePath = handleModulePath(prefix);
  if (fileExists(filePath)) {
    let data = fs.readFileSync(filePath, 'utf-8');
    // auto es5 => es6 by lebab
    if (CONFIGS.autoTransform) {
      data = transform(data, ['commonjs']).code;
    }
    // node_modules dep import
    return rewriteImport(data);
  }
}

module.exports = readNodeModules;
