const path = require("path");
const env = require("./config/env");

module.exports = {
  client: "mysql2",
  connection: {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    multipleStatements: true
  },
  pool: {
    min: 0,
    max: env.dbConnectionLimit
  },
  migrations: {
    directory: path.resolve(__dirname, "migrations"),
    tableName: "knex_migrations"
  }
};
