const db = require("../config/db");

const INDEX_DEFINITIONS = [
  {
    tableName: "Sgroup",
    indexName: "idx_sgroup_name_status",
    ddl: "ALTER TABLE Sgroup ADD KEY idx_sgroup_name_status (group_name, status)"
  },
  {
    tableName: "memberships",
    indexName: "idx_memberships_student_group_status",
    ddl: "ALTER TABLE memberships ADD KEY idx_memberships_student_group_status (student_id, group_id, status)"
  },
  {
    tableName: "memberships",
    indexName: "idx_memberships_group_status_role_id",
    ddl: "ALTER TABLE memberships ADD KEY idx_memberships_group_status_role_id (group_id, status, role, membership_id)"
  },
  {
    tableName: "teams",
    indexName: "idx_teams_type_event_status",
    ddl: "ALTER TABLE teams ADD KEY idx_teams_type_event_status (team_type, event_id, status)"
  },
  {
    tableName: "team_membership",
    indexName: "idx_team_membership_student_team_status",
    ddl: "ALTER TABLE team_membership ADD KEY idx_team_membership_student_team_status (student_id, team_id, status)"
  },
  {
    tableName: "individual_eligibility",
    indexName: "idx_individual_eligibility_phase_student_status",
    ddl: "ALTER TABLE individual_eligibility ADD KEY idx_individual_eligibility_phase_student_status (phase_id, student_id, is_eligible)"
  },
  {
    tableName: "group_eligibility",
    indexName: "idx_group_eligibility_phase_group_status",
    ddl: "ALTER TABLE group_eligibility ADD KEY idx_group_eligibility_phase_group_status (phase_id, group_id, is_eligible)"
  },
  {
    tableName: "individual_eligibility_points",
    indexName: "idx_individual_points_student_multiplier",
    ddl: "ALTER TABLE individual_eligibility_points ADD KEY idx_individual_points_student_multiplier (student_id, is_eligible, multiplier)"
  },
  {
    tableName: "group_eligibility_points",
    indexName: "idx_group_points_group_multiplier",
    ddl: "ALTER TABLE group_eligibility_points ADD KEY idx_group_points_group_multiplier (group_id, is_eligible, multiplier)"
  },
  {
    tableName: "group_points",
    indexName: "idx_group_points_group_membership_created",
    ddl: "ALTER TABLE group_points ADD KEY idx_group_points_group_membership_created (group_id, membership_id, created_at)"
  },
  {
    tableName: "users",
    indexName: "uq_users_email",
    ddl: "ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)"
  },
  {
    tableName: "users",
    indexName: "idx_users_status",
    ddl: "ALTER TABLE users ADD KEY idx_users_status (status)"
  },
  {
    tableName: "users",
    indexName: "idx_users_role_status",
    ddl: "ALTER TABLE users ADD KEY idx_users_role_status (role, status)"
  },
  {
    tableName: "students",
    indexName: "uq_students_user_id",
    ddl: "ALTER TABLE students ADD UNIQUE KEY uq_students_user_id (user_id)"
  },
  {
    tableName: "students",
    indexName: "idx_students_email",
    ddl: "ALTER TABLE students ADD KEY idx_students_email (email)"
  },
  {
    tableName: "students",
    indexName: "idx_students_department_year",
    ddl: "ALTER TABLE students ADD KEY idx_students_department_year (department, year)"
  },
  {
    tableName: "admins",
    indexName: "uq_admins_user_id",
    ddl: "ALTER TABLE admins ADD UNIQUE KEY uq_admins_user_id (user_id)"
  },
  {
    tableName: "admins",
    indexName: "idx_admins_role",
    ddl: "ALTER TABLE admins ADD KEY idx_admins_role (role)"
  }
];

const indexExists = async (tableName, indexName) => {
  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND index_name = ?
     LIMIT 1`,
    [tableName, indexName]
  );

  return rows.length > 0;
};

const applyPerformanceIndexes = async () => {
  const applied = [];
  const skipped = [];

  for (const definition of INDEX_DEFINITIONS) {
    const exists = await indexExists(definition.tableName, definition.indexName);
    if (exists) {
      skipped.push(definition.indexName);
      continue;
    }

    await db.query(definition.ddl);
    applied.push(definition.indexName);
    console.log(`Applied ${definition.indexName}`);
  }

  console.log(`Applied ${applied.length} index(es).`);
  console.log(`Skipped ${skipped.length} existing index(es).`);
};

applyPerformanceIndexes()
  .catch((error) => {
    console.error("Failed to apply performance indexes:", error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
