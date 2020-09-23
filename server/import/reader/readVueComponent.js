const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const hash_sum = require('hash-sum');
const {
  resolveRoot,
  resolveModules,
} = require('../../config');
const {
  VueCache,
  watchFile,
  fileExists,
  rewriteImport,
} = require('../utils');

let Vue2Compiler;
let Vue2CompilerUtils;
let Vue3CompilerSfc;

// check Vue's version from node_modules
function checkVueVersion() {
  const prefix = resolveModules('./vue');
  const pkg = require(prefix + '/package.json');
  if (pkg.version.startsWith('2.')) {
    return 2;
  } else if (pkg.version.startsWith('3.')) {
    return 3;
  }
}

function rewriteVueAssets(content, url) {
  const rewrite = function(s0, s1){
    // . ../ /
    const base = path.posix.dirname(url);
    const p = path.resolve(base, s1);
    if (s1[0] === '/' || s1.startsWith('http')){
      return s0;
    } else {
      return `"src":"${p}"`;
    }
  };
  return content.replace(/['"]?src['"]?\:{1}\s?['"]([^'"]+)['"]/g, rewrite);
}

function getVueFilePath(url) {
  return url.split('?')[0];
}

function vueStyle(content, preprocess) {
  let code = '';
  if (preprocess === 'scss') {
    content = sass.renderSync({ data: content }).css.toString().replace(/\n/g, '').replace(/\s{2,}/g, ' ');
  }
  code += `const css = "${content}";`;
  if (content) {
    code += '\nconst __style = document.createElement("style");';
    code += '\n__style.setAttribute("type", "text/css");';
    code += `\n__style.innerHTML = "${content}";`;
    code += '\ndocument.head.appendChild(__style);';
  }
  code += '\nexport default css;';
  return code;
}

/**
 * Compile for Vue2
 */
function compileVue2({ data, query, url }) {
  let filePath = getVueFilePath(url);
  const descriptor = parseVue2SFC(filePath, data);
  // normal
  if (!query.type) {
    const { code } = compileVue2SFCMain(descriptor, filePath);
    return code;
  }
  if (query.type === 'template') {
    const { code } = compileVue2Template(
      descriptor.template,
      filePath,
      descriptor.styles.some((s) => s.scoped),
    );
    return code;
  }
  // style
  if (query.type === 'style') {
    const index = Number(query.index);
    const styleRaw = descriptor.styles[index];
    const data = styleRaw.content.replace(/\n/g, '');
    const style = compileVue2Style(data, filePath, styleRaw.scoped, index);
    return vueStyle(
      style.replace(/\n/g, ''),
      styleRaw.attrs.lang,
    );
  }
}

function parseVue2SFC(filePath, data) {
  let cached = VueCache.get(filePath);
  if (cached && cached.descriptor) {
    return cached.descriptor;
  }
  if (!Vue2Compiler) {
    Vue2Compiler = require('vue-template-compiler');
    Vue2CompilerUtils = require('@vue/component-compiler-utils');
  }
  const { parse } = Vue2CompilerUtils;
  const descriptor = parse({
    source: data,
    filename: filePath,
    compiler: Vue2Compiler,
    needMap: true,
  });
  cached = cached || { styles: [] };
  cached.descriptor = descriptor;
  VueCache.set(filePath, cached);
  return descriptor;
}

function compileVue2SFCMain(descriptor, filePath) {
  let cached = VueCache.get(filePath);
  if (cached && cached.script) {
    return cached.script;
  }
  const id = hash_sum(filePath);
  let code;
  let script = descriptor.script.content;
  // code
  if (script) {
    code = rewriteImport(
      script.replace('export default ', 'const __script = '),
      filePath,
    );
  }
  let hasScoped = false;
  // styles
  if (descriptor.styles) {
    descriptor.styles.forEach((s, i) => {
      code += `\nimport "${filePath}?type=style&index=${i}";`;
      if (s.scoped) hasScoped = true;
    });
    if (hasScoped) {
      code += `\n__script._scopeId = "data-v-${id}";`;
    }
  }
  code += `\nimport { __render as render } from "${filePath}?type=template"`;
  code += '\n__script.render = render;';
  code += '\nexport default __script;';
  // result
  const result = {
    code,
  };
  cached = cached || { styles: [] };
  cached.script = result;
  return result;
}

function compileVue2Template(template, filePath, scoped) {
  let cached = VueCache.get(filePath);
  if (cached && cached.template) {
    return cached.template;
  }
  const { compileTemplate } = Vue2CompilerUtils;
  const id = hash_sum(filePath);
  const compiled = compileTemplate({
    source: template.content,
    filename: filePath,
    compiler: Vue2Compiler,
    compilerOptions: {
      scopeId: scoped ? `data-v-${id}` : null,
    },
    transformAssetUrls: false,
  });
  // result
  const result = {
    ...compiled,
    code: rewriteVueAssets(compiled.code, filePath) + `\nexport const __render = ${
      compiled.ast.static ? 'staticRenderFns[0]' : 'render'
    };`,
  };
  cached = cached || { styles: [] };
  cached.template = result;
  VueCache.set(filePath, cached);
  return result;
}

function compileVue2Style(style, filePath, scoped, index) {
  let cached = VueCache.get(filePath);
  if (cached && cached.styles && cached.styles[index]) {
    return cached.styles[index];
  }
  const { compileStyle } = Vue2CompilerUtils;
  const id = hash_sum(filePath);
  const { code } = compileStyle({
    source: style,
    id: `data-v-${id}`,
    scoped,
    trim: true,
  });
  const result = code;
  cached = cached || { styles: [] };
  cached.styles[index] = result;
  VueCache.set(filePath, cached);
  return result;
}

/**
 * Compile for Vue-next
 * @param {*} param0 
 */
async function compileVue3({ data, query, url }) {
  let filePath = getVueFilePath(url);
  const descriptor = parseSFC(filePath, data);
  // normal
  if (!query.type) {
    const { code } = compileSFCMain(descriptor, filePath);
    return code;
  }
  // template
  if (query.type === 'template') {
    const cached = VueCache.get(filePath);
    const bindingMetadata = cached && cached.script && cached.script.bindings;
    const { code } = compileSFCTemplate(
      descriptor.template,
      filePath,
      descriptor.styles.some((s) => s.scoped),
      bindingMetadata,
    );
    return code;
  }
  // style
  if (query.type === 'style') {
    const index = Number(query.index);
    const styleRaw = descriptor.styles[index];
    const data = styleRaw.content.replace(/\n/g, '');
    const style = await compileSFCStyle(data, filePath, styleRaw.scoped, index);
    return vueStyle(
      style.replace(/\n/g, ''),
      styleRaw.attrs.lang,
    );
  }
}

function parseSFC(filePath, data) {
  let cached = VueCache.get(filePath);
  if (cached && cached.descriptor) {
    return cached.descriptor;
  }
  if (!Vue3CompilerSfc) {
    Vue3CompilerSfc = require('@vue/compiler-sfc');
  }
  const { parse } = Vue3CompilerSfc;
  const { descriptor } = parse(data, {
    filename: filePath,
    sourceMap: true
  });
  cached = cached || { styles: [], customs: [] };
  cached.descriptor = descriptor;
  VueCache.set(filePath, cached);
  return descriptor;
}

function compileSFCMain(descriptor, filePath) {
  let cached = VueCache.get(filePath);
  if (cached && cached.script) {
    return cached.script;
  }
  const id = hash_sum(filePath);
  let code = '';
  let content = '', map;
  let script = descriptor.script;
  if (descriptor.script || descriptor.scriptSetup) {
    script = Vue3CompilerSfc.compileScript(descriptor);
  }
  if (script) {
    content = script.content;
    map = script.map;
  }
  code += rewriteImport(
    content.replace('export default ', 'const __script = '),
    filePath,
  );
  let hasScoped = false;
  // styles
  if (descriptor.styles) {
    descriptor.styles.forEach((s, i) => {
      code += `\nimport "${filePath}?type=style&index=${i}";`;
      if (s.scoped) hasScoped = true;
    });
    if (hasScoped) {
      code += `\n__script.__scopeId = "data-v-${id}";`;
    }
  }
  // template
  if (descriptor.template) {
    code += `\nimport { render as __render } from '${filePath}?type=template';`;
    code += '\n__script.render = __render;';
  }
  code += '\nexport default __script;';
  // result
  const result = {
    code,
    map,
    bindings: script ? script.bindings : null,
  };
  cached = cached || { styles: [], customs: [] };
  cached.script = result;
  VueCache.set(filePath, cached);
  return result;
}

function compileSFCTemplate(template, filePath, scoped, bindings) {
  let cached = VueCache.get(filePath);
  if (cached && cached.template) {
    return cached.template;
  }
  const { compileTemplate } = Vue3CompilerSfc;
  const id = hash_sum(filePath);
  const { code, map } = compileTemplate({
    source: template.content,
    filename: filePath,
    inMap: template.map,
    transformAssetUrls: {
      base: path.posix.dirname(filePath),
    },
    compilerOptions: {
      scopeId: scoped ? `data-v-${id}` : null,
      bindingMetadata: bindings,
    }
  });
  // result
  const result = {
    code: rewriteImport(code, filePath),
    map,
  };
  cached = cached || { styles: [], customs: [] };
  cached.template = result;
  VueCache.set(filePath, cached);
  return result;
}

async function compileSFCStyle(style, filePath, scoped, index) {
  let cached = VueCache.get(filePath);
  if (cached && cached.styles && cached.styles[index]) {
    return cached.styles[index];
  }
  const { compileStyleAsync } = Vue3CompilerSfc;
  const id = hash_sum(filePath);
  const { code } = await compileStyleAsync({
    source: style,
    id: `data-v-${id}`,
    scoped,
  });
  const result = code;
  cached = cached || { styles: [], customs: [] };
  cached.styles[index] = result;
  VueCache.set(filePath, cached);
  return result;
}

/**
 * Import Vue Single File
 * @param {*} req
 * @param {*} res 
 */
function readVueComponent({ url, query }, res, next) {
  res.set('Content-Type', 'application/javascript');
  const filePath = resolveRoot(url.split('?')[0].slice(1));
  if (!fileExists(filePath)) return false;
  const data = fs.readFileSync(filePath, 'utf-8');
  watchFile(filePath, url.split('?')[0]);
  
  // compile
  let code;
  if (checkVueVersion() === 2) {
    code = compileVue2({ data, query, url });
  } else if (checkVueVersion() === 3) {
    code = compileVue3({ data, query, url });
  }
  return code;
}

module.exports = readVueComponent;
