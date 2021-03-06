'use strict';

// Update with your config settings.
require('dotenv').config({ path: __dirname + '/../.env' });
const { sendMessage } = require('./../app/controllers/util/controller-util');

module.exports = {
  getKnexInstance() {
    if (process.env.SITE === 'production') {
      return this.production;
    }
    return this.development;
  },
  development: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      database: 'grace_tree_db',
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    },
    pool: {
      min: 1,
      max: 1
    },
    acquireConnectionTimeout: 6000000, // API calls * 48xx exceed timeout & will result in errors otherwise
    seeds: {
      directory: './seeds/dev'
    },
    log: {
      warn(message) {
        (async () => await sendMessage(message))();
      },
      error(message) {
        (async () => await sendMessage(message))();
      }
    }
  },
  production: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      database: 'grace_tree_db',
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    },
    pool: {
      min: 1,
      max: 1
    },
    seeds: {
      directory: './seeds/prod'
    }
  }
};
