const fs = require('fs');
const path = require('path');
const LRUCache = require('lru-cache');
const { io } = require('../app');
const {
  __MODULE,
  CONFIGS,
  resolveRoot,
} = require('../config');
// import path checks
const checkVuePath = require('./path/vue');
const checkReactPath = require('./path/react');

const VueCache = new LRUCache({
  max: 65535,
});
const watchedFileMap = new Set(); // cache watched file's name

// watch config file
if (CONFIGS.hmr) {
  watchFile(resolveRoot('./es.config'));
}

// watch file change
function watchFile(p, localP) {
  if (!CONFIGS.hmr) return;
  if (watchedFileMap.has(p)) return;
  watchedFileMap.add(p);
  fs.watchFile(p, {
    interval: CONFIGS.hmr.interval || 2000,
  }, () => {
    if (p.includes('.vue')) {
      VueCache.del(localP);
    }
    io.emit('update');
  });
}

// check if file exist
function fileExists(path) {
  try  {
    return fs.statSync(path).isFile();
  }
  catch (e) {
    if (e.code == 'ENOENT') { // no such file or directory. File really does not exist
      console.log("File does not exist.");
      return false;
    }
    console.log("Exception fs.statSync (" + path + "): " + e);
    throw e; // something else went wrong, we don't have rights, ...
  }
}

// rewrite matched path to /@modules/
function rewriteImport(content, filePath){
  return content.replace(/from ['"]([^'"]+)['"]/g, function(s0, s1){
    // . ../ /
    if (s1[0] !== '.' && s1[1] !== '/'){
      return `from '${__MODULE + s1}'`;
    } else if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(s1)){
      const base = path.posix.dirname(filePath);
      return `from '/@url?path=${path.resolve(base, s1)}';`;
    } else {
      return s0;
    }
  });
}

// handle import file path
function handleModulePath(prefix) {
  const pkg = require(prefix + '/package.json');
  let modulePath;
  if (pkg) {
    const isVuePath = checkVuePath(pkg);
    const isReactPath = checkReactPath(pkg);
    if (isVuePath) { modulePath = isVuePath; }
    if (isReactPath) { modulePath = isReactPath; }
    if (typeof CONFIGS.checkModulePath === 'function') {
      const customPath = CONFIGS.checkModulePath(pkg);
      if (customPath) modulePath = customPath;
    }
    return path.resolve(prefix, modulePath || pkg.module || pkg.main);
  }
}

module.exports = {
  VueCache,
  fileExists,
  watchFile,
  rewriteImport,
  handleModulePath,
};
