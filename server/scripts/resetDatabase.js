const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
const env = require("../config/env");
const SCHEMA_FILES = require("./schemaFiles");

const PROTECTED_DB_NAMES = new Set(["production", "prod"]);

const readSchemaSql = async (relativePath) => {
  const absolutePath = path.resolve(__dirname, "..", "..", relativePath);
  return fs.readFile(absolutePath, "utf8");
};

const escapeIdentifier = (value) => "`" + String(value).replace(/`/g, "``") + "`";

const assertResetAllowed = () => {
  const allowProductionReset = String(process.env.ALLOW_PRODUCTION_DB_RESET || "")
    .trim()
    .toLowerCase();
  const isProductionNodeEnv = env.nodeEnv.toLowerCase() === "production";
  const isProtectedDbName = PROTECTED_DB_NAMES.has(env.dbName.toLowerCase());

  if ((isProductionNodeEnv || isProtectedDbName) && allowProductionReset !== "true") {
    throw new Error(
      `Refusing to reset database "${env.dbName}" while NODE_ENV=${env.nodeEnv}. ` +
        "Set ALLOW_PRODUCTION_DB_RESET=true to override intentionally."
    );
  }
};

const fetchTableNames = async (connection) => {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME AS tableName
       FROM information_schema.tables
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME`,
    [env.dbName]
  );

  return rows.map((row) => row.tableName);
};

const fetchAutoIncrementTables = async (connection) => {
  const [rows] = await connection.query(
    `SELECT DISTINCT TABLE_NAME AS tableName
       FROM information_schema.columns
      WHERE TABLE_SCHEMA = ?
        AND EXTRA LIKE '%auto_increment%'`,
    [env.dbName]
  );

  return new Set(rows.map((row) => row.tableName));
};

const reapplySchema = async (connection) => {
  for (const relativePath of SCHEMA_FILES) {
    const sql = (await readSchemaSql(relativePath)).trim();
    if (!sql) continue;

    console.log(`Reapplying ${relativePath} ...`);
    await connection.query(sql);
  }
};

const resetDatabase = async () => {
  assertResetAllowed();

  const connection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    multipleStatements: true
  });

  let foreignKeyChecksDisabled = false;

  try {
    const tableNames = await fetchTableNames(connection);
    const autoIncrementTables = await fetchAutoIncrementTables(connection);

    if (tableNames.length > 0) {
      console.log(`Clearing ${tableNames.length} tables from database "${env.dbName}" ...`);

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      foreignKeyChecksDisabled = true;

      for (const tableName of tableNames) {
        console.log(`Clearing ${tableName} ...`);
        // DELETE is more reliable than TRUNCATE for foreign-key-heavy schemas.
        await connection.query(`DELETE FROM ${escapeIdentifier(tableName)}`);

        if (autoIncrementTables.has(tableName)) {
          await connection.query(`ALTER TABLE ${escapeIdentifier(tableName)} AUTO_INCREMENT = 1`);
        }
      }

      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      foreignKeyChecksDisabled = false;
    } else {
      console.log(`No existing tables found in database "${env.dbName}".`);
    }

    await reapplySchema(connection);

    console.log(`Database "${env.dbName}" reset successfully.`);
    console.log("Run `npm run admin:bootstrap` if you need a fresh admin user.");
  } finally {
    if (foreignKeyChecksDisabled) {
      try {
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      } catch (error) {
        console.error("Failed to restore FOREIGN_KEY_CHECKS:", error?.message || error);
      }
    }

    await connection.end();
  }
};

resetDatabase().catch((error) => {
  console.error("Database reset failed:", error?.message || error);
  process.exit(1);
});
