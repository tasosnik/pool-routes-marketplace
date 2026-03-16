const path = require('path');
require('dotenv').config();

const commonConfig = {
  client: 'postgresql',
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/migrations'
  },
  seeds: {
    directory: './src/seeds'
  }
};

module.exports = {
  development: {
    ...commonConfig,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'poolroute',
      password: process.env.DB_PASSWORD || 'development',
      database: process.env.DB_NAME || 'poolroute_dev'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  test: {
    ...commonConfig,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'poolroute',
      password: process.env.DB_PASSWORD || 'development',
      database: process.env.DB_TEST_NAME || 'poolroute_test'
    }
  },

  production: {
    ...commonConfig,
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 20
    }
  }
};