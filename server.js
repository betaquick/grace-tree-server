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
  const keyPaths = {
    key: `${process.env.KEY_PATH}/privkey.pem`,
    cert: `${process.env.KEY_PATH}/cert.pem`,
    ca: `${process.env.KEY_PATH}/chain.pem`,
  }


  /**
   * 
   * @param {Record<string, string>} filePathMap
   * @returns {Record<string, Buffer>} 
   */
  function getBuffersFromFilePathMap(filePathMap) {
    const bufferMap = {}

    for (const path in filePathMap) {
      if (Object.hasOwnProperty.call(filePathMap, path)) {
        bufferMap[path] = fs.readFileSync(filePathMap[path]);
      }
    }

    return bufferMap;
  }

  const keyBuffers = getBuffersFromFilePathMap(keyPaths);
  const ONE_SECOND_IN_MS = 1e3;
  server = createServer(keyBuffers, Object.values(keyPaths), app , 30 * ONE_SECOND_IN_MS);
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
