// readers
const readIndex = require('./reader/readIndex');
const readESInit = require('./reader/readESInit');
const readModule = require('./reader/readModule');
const readNodeModules = require('./reader/readNodeModules');
const readStyle = require('./reader/readStyle');
const readVueComponent = require('./reader/readVueComponent');
const readUrl = require('./reader/readUrl');
const {
  CONFIGS,
} = require('../config');

const testRules = [
  // inject custom rules
  ...(CONFIGS.rules ? CONFIGS.rules : []),
  // default rules that should not be overwriten
  {
    test: '/',
    loader: readIndex,
  },
  {
    test: /^\/@url/,
    loader: readUrl,
  },
  {
    test: /^\/esinit$/,
    loader: readESInit,
  },
  {
    test: /^\/@modules/,
    loader: readNodeModules,
  },
  {
    test: /\.s?css$/,
    loader: readStyle,
  },
  {
    test: /\.vue/,
    loader: readVueComponent,
  },
];

/**
 * Import logics
 * @param {*} req 
 * @param {*} res 
 */
async function importFile(req, res, next) {
  const { url } = req;
  for (let i=0;i<testRules.length;i++) {
    const { test: rule, loader } = testRules[i];
    // match string
    if (typeof rule === 'string' && url === rule) {
      return await loader(req, res, next);
    }
    // match regexp
    if (typeof rule === 'object' && rule.test(url)) {
      return await loader(req, res, next);
    }
  }
  if (!/[^.]\.{1}[\w+\.]/.test(url) || /\.js$/.test(url)) {
    // default use .js file
    return await readModule(req, res, next);
  }
}

async function importMiddleware(req, res, next) {
  let data;
  // handle file
  data = await importFile(req, res, next);
  // return content
  if (data) {
    res.end(data);
  } else {
    // pass to native browser
    next();
  }
}

module.exports = importMiddleware;
