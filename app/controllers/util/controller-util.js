'use strict';
const debug = require('debug')('grace-tree:util:debug');
const crypto = require('crypto');
const { promisify } = require('util');

const randomBytesAsync = promisify(crypto.randomBytes);
const throwError = (code, message) => {
  debug(message);
  let err = new Error(message);
  err.code = code;
  throw err;
};


const { IncomingWebhook, IncomingWebhookResult } = require('@slack/webhook');

// Read a url from the environment variables
const url = process.env.SLACK_WEBHOOK_URL;

// Initialize
const webhook = url ? new IncomingWebhook(url) : null;

module.exports = {
  randomBytesAsync,
  throwError,

  handleSuccess(res, message, object) {
    return res
      .status(200)
      .json({ status: 200, error: false, message, body: object });
  },

  handleError(err, res, message, errorFunc) {
    errorFunc('Error: ', err.code, message);
    if (err.name === 'ValidationError') {
      return res.status(422).json({
        status: 422,
        error: true,
        message: 'Validation Error: ' + err.message,
        body: err
      });
    }

    // make sure its a valid HTTP Status Code...
    err.code = typeof err.code === 'number' && err.code > 100 && err.code < 600 ? err.code : 500;

    let body = err.message || err;
    let msg = 'System Error: ' + message;

    if (err.code === 500) {
      msg = 'Oops! Something went wrong';
      body = 'Oops! Something went wrong';
    }

    return res.status(err.code).json({
      status: err.code,
      error: true,
      message: msg,
      body
    });
  },


  /**
   * Send message to slack
   *
   * @param {string} message
   * @param {'warning' | 'danger' | 'good' | string} type
   * @return {Promise<IncomingWebhookResult>}
   */
  sendMessage(message, type) {
    if (!process.env.SLACK_WEBHOOK_URL || !webhook) {
      console.log('No Webhook URL provided, logging to console instead...');
      console.log(message);

      return Promise.resolve();
    }

    return webhook.send({
      text: 'GraceTree Database Alert',
      attachments: [
        {
          color: type,
          text: message
        }
      ]
    });
  }
};
