'use strict';

/**
 * Module dependencies.
 */
require('dotenv').config();

const app = require('./app/config/app-config')();
const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');
const http = require('http');
const https = require('https');
const fs = require('fs');

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
let serverInstance;
if (process.env.SITE === 'production') {
  serverInstance = https.createServer({
    key: fs.readFileSync(`${process.env.KEY_PATH}/privkey.pem`),
    cert: fs.readFileSync(`${process.env.KEY_PATH}/cert.pem`),
    ca: fs.readFileSync(`${process.env.KEY_PATH}/chain.pem`)
  }, app);
} else {
  serverInstance = http.createServer(app);
}
const server = serverInstance;

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
