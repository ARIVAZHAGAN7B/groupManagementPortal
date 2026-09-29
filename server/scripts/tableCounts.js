const db = require('../config/db');

async function checkCounts() {
  const [tables] = await db.query(
    "SELECT TABLE_NAME as name FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
  );
  const counts = [];
  for (const { name } of tables) {
    const [[{ cnt }]] = await db.query(`SELECT count(*) as cnt FROM \`${name}\``);
    counts.push({ Table: name, Rows: cnt });
  }
  console.table(counts);
  const totalRows = counts.reduce((acc, c) => acc + c.Rows, 0);
  console.log(`Total Tables: ${counts.length}, Total Seeded Rows: ${totalRows}`);
  await db.end();
}

checkCounts().catch(console.error);
