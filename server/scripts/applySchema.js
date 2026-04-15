const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
const env = require("../config/env");
const SCHEMA_FILES = require("./schemaFiles");

const readSchemaSql = async (relativePath) => {
  const absolutePath = path.resolve(__dirname, "..", "..", relativePath);
  return fs.readFile(absolutePath, "utf8");
};

const applySchema = async () => {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    multipleStatements: true
  });

  try {
    for (const relativePath of SCHEMA_FILES) {
      const sql = (await readSchemaSql(relativePath)).trim();
      if (!sql) continue;

      console.log(`Applying ${relativePath} ...`);
      await connection.query(sql);
    }

    console.log(`Schema applied successfully to database "${env.dbName}".`);
  } finally {
    await connection.end();
  }
};

applySchema().catch((error) => {
  console.error("Schema apply failed:", error?.message || error);
  process.exit(1);
});
