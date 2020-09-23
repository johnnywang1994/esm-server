const path = require('path');

function readUrl({ query }, res) {
  res.set('Content-Type', 'application/javascript');
  return `export default '${query.path}';`;
}

module.exports = readUrl;
