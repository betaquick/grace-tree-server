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
    if (propKey === 'error') {
      return (...args) => {
        let message;
        [message, ...args] = args;

        if (NODE_ENV === 'production') {
          (async () => await sendMessage(
            ':warning:' + ' `' + group + ':error` ' + `_${message}_ \n`
            + '```' + JSON.stringify(args) + '```'
          ))();
        }
        return target(group + ':' + 'error');
      };
    } else {
      return target(group + ':' + type);
    }
  }
});

module.exports = group => Proxify(logger, group);
