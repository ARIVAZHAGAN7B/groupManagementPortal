const fs = require("fs/promises");
const path = require("path");

const SCHEMA_FILES = [
  "sql/core-auth.schema.sql",
  "modules/group/group.schema.sql",
  "modules/phase/phase.schema.sql",
  "modules/systemConfig/systemConfig.schema.sql",
  "modules/event/event.schema.sql",
  "modules/team/team.schema.sql",
  "modules/membership/membership.schema.sql",
  "modules/joinRequest/joinRequest.schema.sql",
  "modules/eventJoinRequest/eventJoinRequest.schema.sql",
  "modules/groupPoint/groupPoint.schema.sql",
  "modules/eligibility/eligibility.schema.sql",
  "modules/groupTierRequest/groupTierRequest.schema.sql",
  "modules/leadershipRequest/leadershipRequest.schema.sql",
  "modules/teamChangeTier/teamChangeTier.schema.sql",
  "modules/teamTarget/teamTarget.schema.sql",
  "modules/audit/audit.schema.sql"
];

const readSqlFile = async (relativePath) => {
  const absolutePath = path.resolve(__dirname, "..", relativePath);
  return fs.readFile(absolutePath, "utf8");
};

exports.up = async (knex) => {
  for (const relativePath of SCHEMA_FILES) {
    const sql = (await readSqlFile(relativePath)).trim();
    if (!sql) continue;

    console.log(`Migrating schema from ${relativePath}`);
    await knex.raw(sql);
  }
};

exports.down = async () => {
  throw new Error("Initial schema migration cannot be rolled back automatically.");
};

exports.config = {
  transaction: false
};
