'use strict';

/**
 * Module dependencies.
 */
require('dotenv').config();

const app = require('./app/config/app-config')();
const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');
const http = require('http');
const fs = require('fs');
const { createServer } = require('@betaquick/https-cert-watcher');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');
debug('Starting server with port: ' + port);
app.set('port', port);

/**
 * Create HTTP server.
 */
debug('Starting server...');
/**
 * @type {import('http').Server || import('https').Server}
 */
let server;
if (process.env.SITE === 'production') {
  const path = require('path');
  const baseKeyPath = process.env.KEY_PATH;
  const filesToWatch = ['privkey.pem', 'cert.pem', 'chain.pem'].map(relativePath => path.join(baseKeyPath, relativePath));
  const ONE_SECOND_IN_MS = 1e3;

  function serverOptsFactory() {
    return {
      key: fs.readFileSync(path.join(baseKeyPath, 'privkey.pem')),
      cert: fs.readFileSync(path.join(baseKeyPath, 'cert.pem')),
      ca: fs.readFileSync(path.join(baseKeyPath, 'chain.pem'))
    }
  }
  server = createServer(serverOptsFactory, filesToWatch, app , 30 * ONE_SECOND_IN_MS);
} else {
  server = http.createServer(app);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(err) {
  error('Error - server failed to start: ' + err.message);
  if (err.syscall !== 'listen') {
    throw err;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (err.code) {
    case 'EACCES':
      error(bind + ' requires elevated privileges');
      console.err(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      error(bind + ' requires elevated privileges');
      console.err(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw err;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
