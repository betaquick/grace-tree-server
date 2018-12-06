'use strict';

module.exports = {
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

    return res.status(err.code).json({
      status: err.code,
      error: true,
      message: 'System Error: ' + message,
      body: err.message || err
    });
  }
};
