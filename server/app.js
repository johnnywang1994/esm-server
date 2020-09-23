const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { CONFIGS, resolveRoot } = require('./config');

// static files
app.use(express.static(resolveRoot(CONFIGS.static || './public')));

// hot reload watch
io.on('connection', (socket) => {
  socket.emit('init',{ msg: 'ES module hot-reload on watching...' });
});

function listen(port) {
  http.listen(port, () => {
    console.log('Server on port: ' + port);
  });
};

module.exports = { app, io, listen };
