const fs = require('fs');
const { watchFile, fileExists } = require('../utils');

/**
 * Read entry file
 * @param {*} req 
 * @param {*} res 
 */
function readIndex(req, res) {
  res.set('Content-Type', 'text/html');
  const filePath = './index.html';
  if (fileExists(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    watchFile(filePath);
    let code = '<script crossorigin src="https://cdn.socket.io/socket.io-2.3.0.js"></script>';
    code += `\n<script type="module" src="/esinit"></script>`;
    code += '\n<script ';
    // set process for browser
    return data.replace('<script ', code);
  }
}

module.exports = readIndex;
