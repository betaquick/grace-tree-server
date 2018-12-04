'use strict';

// Update with your config settings.
require('dotenv').config({ path: __dirname + '/../.env' });

module.exports = {
  getKnexInstance() {
    if (process.env.SITE === 'production') {
      return this.production;
    }
    if (process.env.SITE === 'test') {
      return this.test;
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
    seeds: {
      directory: './seeds/dev'
    }
  },
  test: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      database: 'test_grace_tree_db',
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    },
    pool: {
      min: 1,
      max: 5
    },
    seeds: {
      directory: './seeds/dev'
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
      max: 5
    },
    seeds: {
      directory: './seeds/prod'
    }
  }
};
