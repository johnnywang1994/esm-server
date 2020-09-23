const express = require('express');
const { app, listen } = require('./app');
const importMiddleware = require('./import');
const { resolveRoot } = require('./config');

const port = process.env.PORT || 8080;
app.set('port', port);

// import middleware
app.use(importMiddleware);
app.use('/src', express.static(resolveRoot('./src')));

listen(port);
