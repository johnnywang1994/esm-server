const fs = require('fs');
const sass = require('node-sass');
const { resolveRoot } = require('../../config');
const {
  watchFile,
  fileExists,
} = require('../utils');

/**
 * Import Styles
 * @param {*} param0 
 * @param {*} res 
 */
function readStyle({ url }, res) {
  res.set('Content-Type', 'application/javascript');
  const filePath = resolveRoot(url.slice(1));
  if (fileExists(filePath)) {
    let data = fs.readFileSync(filePath, 'utf-8');
    watchFile(filePath);
    data = sass.renderSync({ data }).css.toString().replace(/\n/g, '').replace(/\s{2,}/g, ' ');
    let code = `const cssText = "${data}";`;
    code += '\nconst head = document.head;';
    code += '\nconst style = document.createElement("style");';
    code += '\nstyle.setAttribute("type", "text/css");';
    code += '\nstyle.innerHTML = cssText;';
    code += '\nhead.insertBefore(style, head.querySelector("style"));';
    code += '\nexport default cssText;';
    return code;
  }
}

module.exports = readStyle;
