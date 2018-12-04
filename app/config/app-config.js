'use strict';

const debug = require('debug')('application:app-config:debug');

const express = require('express');
const application = express();
const bodyParser = require('body-parser');
const routes = require('./routes');
const cors = require('cors');

function configureSystem(application) {
  configureApplication(application);
  configureRoutes(application);
  return application;
}

function configureApplication(application) {
  application.use(bodyParser.json());
  application.use(bodyParser.urlencoded({ extended: true }));
  application.use(cors());
  application.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.type('application/json');
    next();
  });
}

function configureRoutes(application) {
  application.use('/api/v1/', routes);

  application.use(function(req, res) {
    res.status(404).json({
      status: 404,
      error: true,
      message: 'error 404 - Route not found'
    });
  });

  application.use(function(err, req, res, next) {
    debug('Setting up environment for: ' + req.app.get('env'));
    res.locals.message = err.message;
    res.locals.error = err;
    // render the error page
    res.status(err.status || 500).json({
      status: 500,
      error: true,
      message: 'Error in application, passed down to error handler',
      body: `${err}`
    });
    // res.send('error');
  });
}

module.exports = configureSystem.bind(this, application);
