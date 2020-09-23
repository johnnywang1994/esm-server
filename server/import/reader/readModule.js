const fs = require('fs');
const { CONFIGS, resolveRoot } = require('../../config');
const {
  watchFile,
  fileExists,
  rewriteImport
} = require('../utils');
let babelCore;

/**
 * Import Local Module
 * @param {*} req 
 * @param {*} res 
 */
function readModule({ url }, res) {
  res.set('Content-Type', 'application/javascript');
  const filePath = resolveRoot(
    // use .js by default
    (/[^.]\.{1}[\w+\.]/.test(url) ? url : `${url}.js`).slice(1)
  );
  if (fileExists(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    watchFile(filePath);
    // only compile user module for jsx
    if (CONFIGS.jsx) {
      babelCore = babelCore || require('@babel/core');
      let { code } = babelCore.transform(data, {
        plugins: ["@babel/plugin-transform-react-jsx"],
      });
      return rewriteImport(code, url);
    }
    return rewriteImport(data, url);
  }
}

module.exports = readModule;
