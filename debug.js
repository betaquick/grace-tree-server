'use strict';

const logger = require('debug');
const { sendMessage } = require('./app/controllers/util/controller-util');
const NODE_ENV = process.env.NODE_ENV || 'development';

/*
 How to use...

 const { debug, error } = require('./debug')('service_name');
 error('Sample Error Message', { stackTrace: error.stack });
 debug('Sample Debug Message');

*/

const Proxify = (logger, group) => new Proxy(logger, {
  get(target, propKey) {
    const type = propKey.toString();
    if (type === 'error' && NODE_ENV === 'production') {
      // todo <@radiumrasheed> also log to debug...
      return (message, error) =>
        (async () => await sendMessage(
          ':beetle:' + ' `' + group + ':error` ' + `_${message}_ \n`
          + '```' + (error.stack || error.message || error) + '```'
        ).catch())();
    } else {
      return target(group + ':' + type);
    }
  }
});

module.exports = group => Proxify(logger, group);
