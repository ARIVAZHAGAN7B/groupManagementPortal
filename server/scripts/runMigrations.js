const knex = require("knex");
const knexConfig = require("../knexfile");

const runMigrations = async () => {
  const db = knex(knexConfig);

  try {
    const [batchNo, migrations] = await db.migrate.latest();

    if (migrations.length === 0) {
      console.log("Database migrations already up to date.");
      return;
    }

    console.log(`Database migrations batch ${batchNo} applied: ${migrations.join(", ")}`);
  } finally {
    await db.destroy();
  }
};

if (require.main === module) {
  runMigrations().catch((error) => {
    console.error("Database migration failed:", error?.message || error);
    process.exit(1);
  });
}

module.exports = {
  runMigrations
};
