const { CONFIGS } = require('../../config');

/**
 * Init ES settings
 */
function readESInit(req, res) {
  res.set('Content-Type', 'application/javascript');
  let code = 'window.process = {env:{ NODE_ENV: "dev"}};';
  if (CONFIGS.hmr) {
    code += '\nconst socket = io();';
    code += '\nsocket.on("init", (msg) => console.log(msg));';
    code += '\nsocket.on("update", () => window.location.reload());';
  }
  return code;
}

module.exports = readESInit;
