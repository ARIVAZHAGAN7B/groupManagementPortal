const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const DEFAULT_PASSWORD = 'Password@123';
const BCRYPT_SALT_ROUNDS = 10;

// Departments for 900 students
const DEPARTMENTS = [
  'CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BME', 'BT', 'CSBS', 'FDT'
];

// Helper: Batch insert
async function batchInsert(conn, table, columns, rows, batchSize = 100) {
  if (rows.length === 0) return;
  const colSql = columns.map(c => `\`${c}\``).join(', ');
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const placeholders = chunk.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const values = chunk.flat();
    await conn.query(`INSERT INTO \`${table}\` (${colSql}) VALUES ${placeholders}`, values);
  }
}

async function cleanReset(conn) {
  console.log('--- 1. RESETTING DATABASE (CLEAN SLATE) ---');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await conn.query(`
    SELECT TABLE_NAME AS tableName 
    FROM information_schema.tables 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
  `);
  for (const { tableName } of tables) {
    await conn.query(`DELETE FROM \`${tableName}\``);
    await conn.query(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`).catch(() => {});
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log(`Cleared ${tables.length} tables to clean slate.`);
}

async function seed() {
  console.log('===============================================================');
  console.log('     GM PORTAL — 1,000 USERS & RELATIONAL DATABASE SEEDER      ');
  console.log('===============================================================\n');

  const isClean = !process.argv.includes('--no-clean');
  const conn = await db.getConnection();

  try {
    if (isClean) {
      await cleanReset(conn);
    }

    console.log('Hashing default password "' + DEFAULT_PASSWORD + '" once with bcrypt (10 rounds)...');
    const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS);
    console.log('Password hash generated.');

    await conn.beginTransaction();

    // 1. System Settings
    console.log('\n[Phase 1/14] Seeding system_settings & holidays...');
    const settings = [
      ['min_group_members', '4'],
      ['max_group_members', '10'],
      ['require_leadership_for_activation', 'true'],
      ['allow_student_group_creation', 'true'],
      ['incubation_duration_days', '5'],
      ['enforce_change_day_for_leave', 'true']
    ];
    for (const [k, v] of settings) {
      await conn.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [k, v, v]
      );
    }

    const holidays = [
      ['2026-01-01', 'New Year Day'],
      ['2026-01-14', 'Pongal Festival'],
      ['2026-01-15', 'Thiruvalluvar Day'],
      ['2026-01-26', 'Republic Day'],
      ['2026-03-30', 'College Annual Day']
    ];
    for (const [d, desc] of holidays) {
      await conn.query('INSERT IGNORE INTO holidays (holiday_date, description) VALUES (?, ?)', [d, desc]);
    }

    // 2. 1,000 Users (100 Admins + 900 Students)
    console.log('\n[Phase 2/14] Creating 1,000 Users (100 Admins, 900 Students)...');
    const userRows = [];
    const adminRows = [];
    const studentRows = [];

    // 100 Admins
    for (let i = 1; i <= 100; i++) {
      const padId = String(i).padStart(3, '0');
      const userId = uuidv4();
      const adminId = `ADM${padId}`;
      const email = `admin${padId}@bitsathy.ac.in`;
      const name = i <= 10 ? `System Admin ${i}` : `Faculty Admin ${i}`;
      const globalRole = i <= 10 ? 'SYSTEM_ADMIN' : 'ADMIN';
      const adminRole = i <= 10 ? 'SYSTEM_ADMIN' : 'FACULTY_ADMIN';

      userRows.push([userId, name, email, passwordHash, globalRole, 'ACTIVE']);
      adminRows.push([adminId, userId, name, email, adminRole]);
    }

    // 900 Students
    for (let i = 1; i <= 900; i++) {
      const padId = String(i).padStart(3, '0');
      const userId = uuidv4();
      const dept = DEPARTMENTS[i % DEPARTMENTS.length];
      const year = 1 + (i % 4);
      const batchYearPrefix = 26 - year; // 25, 24, 23, 22
      const deptCode = dept.substring(0, 2);
      const rollNumber = `7376${batchYearPrefix}1${deptCode}${padId}`;
      const email = `student${padId}@bitsathy.ac.in`;
      const name = `Student ${padId} (${dept})`;

      userRows.push([userId, name, email, passwordHash, 'STUDENT', 'ACTIVE']);
      studentRows.push([rollNumber, userId, name, email, dept, year]);
    }

    await batchInsert(conn, 'users', ['user_id', 'name', 'email', 'password_hash', 'role', 'status'], userRows);
    await batchInsert(conn, 'admins', ['admin_id', 'user_id', 'name', 'email', 'role'], adminRows);
    await batchInsert(conn, 'students', ['student_id', 'user_id', 'name', 'email', 'department', 'year'], studentRows);
    console.log(`Inserted ${userRows.length} users, ${adminRows.length} admins, and ${studentRows.length} students.`);

    // 3. Base Points & History
    console.log('\n[Phase 3/14] Seeding base_points & base_point_history for 900 students...');
    const basePointsRows = [];
    const basePointHistoryRows = [];

    for (let i = 0; i < studentRows.length; i++) {
      const studentId = studentRows[i][0];
      const p1 = 50 + (i % 8) * 30;
      const p2 = 40 + (i % 5) * 25;
      const p3 = (i % 2 === 0) ? (50 + (i % 10) * 40) : 0;
      const total = p1 + p2 + p3;

      basePointsRows.push([studentId, total]);
      basePointHistoryRows.push([studentId, '2026-01-10', '2026-01-10 10:00:00', p1, 'Project Milestone Phase 1']);
      basePointHistoryRows.push([studentId, '2026-02-12', '2026-02-12 14:30:00', p2, 'Coding Assessment & Hackathon']);
      if (p3 > 0) {
        basePointHistoryRows.push([studentId, '2026-03-05', '2026-03-05 16:15:00', p3, 'Peer Evaluation & Team Bonus']);
      }
    }
    await batchInsert(conn, 'base_points', ['student_id', 'total_base_points'], basePointsRows);
    await batchInsert(conn, 'base_point_history', ['student_id', 'activity_date', 'activity_at', 'points', 'reason'], basePointHistoryRows);
    console.log(`Seeded ${basePointsRows.length} base_points and ${basePointHistoryRows.length} history records.`);

    // 4. Groups (sgroup) - 100 groups across tiers D, C, B, A
    console.log('\n[Phase 4/14] Seeding 100 Groups across Tiers D, C, B, A...');
    const groupRows = [];
    for (let g = 1; g <= 100; g++) {
      const padG = String(g).padStart(3, '0');
      const groupCode = `GRP-${padG}`;
      let tier = 'D';
      if (g > 40 && g <= 70) tier = 'C';
      if (g > 70 && g <= 90) tier = 'B';
      if (g > 90) tier = 'A';

      let status = 'ACTIVE';
      let accepting = 1;
      let conditions = 'Open for all disciplined developers';
      if (g > 80 && g <= 90) {
        status = 'FROZEN';
        accepting = 0;
        conditions = 'Roster locked for evaluations';
      } else if (g > 90) {
        status = 'INACTIVE';
        accepting = 0;
        conditions = 'Requires minimum 300 base points';
      }

      const groupName = `Squad ${padG} [Tier ${tier}]`;
      groupRows.push([g, groupCode, groupName, tier, status, accepting, conditions]);
    }
    await batchInsert(conn, 'sgroup', ['group_id', 'group_code', 'group_name', 'tier', 'status', 'accepting_applications', 'joining_conditions'], groupRows);
    console.log(`Created ${groupRows.length} groups.`);

    // 5. Group Memberships with 4 Leadership Roles per Active Group
    console.log('\n[Phase 5/14] Seeding Memberships (4 Leadership roles per group + members)...');
    const membershipRows = [];
    let studentIndex = 0;

    // For the first 80 groups (Active), assign 1 Captain, 1 Vice Captain, 1 Strategist, 1 Manager + 2 to 4 Members
    for (let g = 1; g <= 80; g++) {
      const roles = ['CAPTAIN', 'VICE_CAPTAIN', 'STRATEGIST', 'MANAGER'];
      // Assign leaders
      for (const role of roles) {
        if (studentIndex >= studentRows.length) break;
        const studentId = studentRows[studentIndex][0];
        membershipRows.push([studentId, g, role, 'ACTIVE']);
        studentIndex++;
      }
      // Assign 2 to 3 regular members
      const regularCount = 2 + (g % 2); // 2 or 3
      for (let m = 0; m < regularCount; m++) {
        if (studentIndex >= studentRows.length) break;
        const studentId = studentRows[studentIndex][0];
        membershipRows.push([studentId, g, 'MEMBER', 'ACTIVE']);
        studentIndex++;
      }
    }

    // For groups 81-100 (Frozen & Inactive), assign remaining students or past memberships
    for (let g = 81; g <= 100; g++) {
      const count = 3 + (g % 3);
      for (let m = 0; m < count; m++) {
        if (studentIndex >= studentRows.length) break;
        const studentId = studentRows[studentIndex][0];
        const role = m === 0 ? 'CAPTAIN' : 'MEMBER';
        const status = g <= 90 ? 'ACTIVE' : 'LEFT';
        membershipRows.push([studentId, g, role, status]);
        studentIndex++;
      }
    }

    await batchInsert(conn, 'memberships', ['student_id', 'group_id', 'role', 'status'], membershipRows);

    // Fetch actual inserted membership IDs to ensure bulletproof foreign key matching
    const [allMems] = await conn.query('SELECT membership_id, student_id, group_id FROM memberships');
    const memMap = new Map();
    for (const row of allMems) {
      memMap.set(`${row.group_id}:${row.student_id}`, row.membership_id);
    }

    const groupPointRows = [];
    for (const mem of membershipRows) {
      const studentId = mem[0];
      const g = mem[1];
      const role = mem[2];
      const actualMemId = memMap.get(`${g}:${studentId}`);
      const points = role === 'MEMBER' ? (50 + (g * 3)) : (100 + (g * 5));
      groupPointRows.push([studentId, g, actualMemId, points]);
    }

    await batchInsert(conn, 'group_points', ['student_id', 'group_id', 'membership_id', 'points'], groupPointRows);
    console.log(`Created ${membershipRows.length} group memberships and ${groupPointRows.length} group_points.`);

    // 6. Hubs & Hub Memberships
    console.log('\n[Phase 6/14] Seeding 8 Technical Hubs & Hub Memberships...');
    const hubs = [
      [1, 'HUB-AI', 'AI & Machine Learning Hub', 'PROMINENT', 'ACTIVE', 'Generative AI, Computer Vision and LLM systems'],
      [2, 'HUB-CLOUD', 'Cloud Computing & DevOps Hub', 'PROMINENT', 'ACTIVE', 'AWS, Azure, Docker, Kubernetes, CI/CD pipelines'],
      [3, 'HUB-CYBER', 'Cybersecurity & Forensics Hub', 'MEDIUM', 'ACTIVE', 'Network defense, Ethical Hacking, CTF challenges'],
      [4, 'HUB-FULLSTACK', 'Full-Stack Development Hub', 'PROMINENT', 'ACTIVE', 'React, Next.js, Node.js, Distributed microservices'],
      [5, 'HUB-IOT', 'IoT & Embedded Systems Hub', 'MEDIUM', 'ACTIVE', 'Arduino, ESP32, Smart Sensors and Edge AI'],
      [6, 'HUB-ROBOTICS', 'Robotics & Automation Hub', 'MEDIUM', 'ACTIVE', 'Autonomous mobile robots and industrial automation'],
      [7, 'HUB-BLOCKCHAIN', 'Blockchain & Web3 Hub', 'LOW', 'ACTIVE', 'Smart contracts, Ethereum, Decentralized apps'],
      [8, 'HUB-DESIGN', 'UI/UX Design & Product Hub', 'LOW', 'ACTIVE', 'Design systems, Figma prototyping, Accessibility']
    ];
    await batchInsert(conn, 'hubs', ['hub_id', 'hub_code', 'hub_name', 'hub_priority', 'status', 'description'], hubs);

    const hubMembershipRows = [];
    for (let i = 0; i < 300; i++) {
      const studentId = studentRows[i][0];
      const hubId = 1 + (i % 8);
      const priority = i % 3 === 0 ? 'PROMINENT' : (i % 3 === 1 ? 'MEDIUM' : 'LOW');
      hubMembershipRows.push([hubId, studentId, priority, 'ACTIVE']);
    }
    await batchInsert(conn, 'hub_membership', ['hub_id', 'student_id', 'hub_priority', 'status'], hubMembershipRows);
    console.log(`Created 8 Hubs and ${hubMembershipRows.length} Hub Memberships.`);

    // 7. Teams, Team Memberships & Team Targets
    console.log('\n[Phase 7/14] Seeding Teams, Team Memberships & Targets...');
    const teamRows = [];
    const teamMemberRows = [];
    const teamTargetRows = [];
    for (let t = 1; t <= 30; t++) {
      const padT = String(t).padStart(3, '0');
      const teamCode = `TEAM-${padT}`;
      const teamName = `Innovation Squad ${padT}`;
      teamRows.push([t, null, null, teamCode, teamName, 'TEAM', 'ACTIVE', 'Hackathon & R&D Team', 2]);

      // Assign 3-4 members per team
      for (let m = 0; m < 3; m++) {
        const studentId = studentRows[(t * 3 + m) % studentRows.length][0];
        const role = m === 0 ? 'LEAD' : 'MEMBER';
        teamMemberRows.push([t, studentId, role, 'ACTIVE']);
      }
      teamTargetRows.push([t, 4, 'Standard hackathon squad target']);
    }
    await batchInsert(conn, 'teams', ['team_id', 'event_id', 'parent_team_id', 'team_code', 'team_name', 'team_type', 'status', 'description', 'rounds_cleared'], teamRows);
    await batchInsert(conn, 'team_membership', ['team_id', 'student_id', 'role', 'status'], teamMemberRows);
    await batchInsert(conn, 'team_target', ['team_id', 'target_member_count', 'notes'], teamTargetRows);
    console.log(`Created ${teamRows.length} Teams, ${teamMemberRows.length} Team Memberships, and ${teamTargetRows.length} Team Targets.`);

    // 8. Events & Rounds
    console.log('\n[Phase 8/14] Seeding Events, Rounds & Access Controls...');
    const eventRows = [
      [1, 'EVT-001', 'National Hackathon 2026', 'TEAM', '2026-03-10', '2026-03-12', '2026-02-01', '2026-03-05', 2, 4, 'ACTIVE', 1, 'National level hackathon for smart India'],
      [2, 'EVT-002', 'CodeSprint AI Challenge', 'INDIVIDUAL', '2026-02-15', '2026-02-16', '2026-01-10', '2026-02-10', 1, 1, 'CLOSED', 1, 'High-speed algorithmic problem solving'],
      [3, 'EVT-003', 'RoboWars Robotic Combat', 'TEAM', '2026-04-01', '2026-04-03', '2026-03-01', '2026-03-28', 3, 5, 'ACTIVE', 1, 'Hardware combat robotics championship'],
      [4, 'EVT-004', 'Cloud Architecture Summit', 'TEAM', '2026-04-15', '2026-04-16', '2026-03-15', '2026-04-10', 2, 4, 'ACTIVE', 0, 'Design fault-tolerant AWS architectures'],
      [5, 'EVT-005', 'Cyber CTF Invitational', 'TEAM', '2026-01-20', '2026-01-21', '2026-01-01', '2026-01-18', 2, 3, 'CLOSED', 1, 'Capture the Flag network exploitation']
    ];
    await batchInsert(conn, 'events', [
      'event_id', 'event_code', 'event_name', 'registration_mode', 'start_date', 'end_date', 'registration_start_date', 'registration_end_date', 'min_members', 'max_members', 'status', 'eligible_for_rewards', 'description'
    ], eventRows);

    const eventRoundsRows = [];
    let rId = 1;
    for (let eId = 1; eId <= 5; eId++) {
      eventRoundsRows.push([rId++, eId, 1, 'Round 1: Screening & Prelims', '2026-03-10', '2026-03-10', '09:00:00', '13:00:00', 'Lab 1', 'ONLINE', 0, 'COMPLETED']);
      eventRoundsRows.push([rId++, eId, 2, 'Round 2: Grand Finals', '2026-03-12', '2026-03-12', '10:00:00', '18:00:00', 'Auditorium', 'OFFLINE', 1, 'SCHEDULED']);
    }
    await batchInsert(conn, 'event_rounds', [
      'round_id', 'event_id', 'round_order', 'round_name', 'round_date', 'round_end_date', 'start_time', 'end_time', 'location', 'round_mode', 'od_proof_required', 'status'
    ], eventRoundsRows);

    // Event Hub Access
    const eventHubAccessRows = [
      [1, 1], [1, 2], [1, 4], // Hackathon open to AI, Cloud, FullStack
      [2, 1], [2, 4],         // CodeSprint open to AI, FullStack
      [3, 5], [3, 6],         // RoboWars open to IoT, Robotics
      [5, 3]                  // CTF open to Cybersecurity
    ];
    await batchInsert(conn, 'event_hub_access', ['event_id', 'hub_id'], eventHubAccessRows);
    console.log(`Created ${eventRows.length} Events, ${eventRoundsRows.length} Rounds, and Hub Access filters.`);

    // 9. Phases (STRICT MAX 15-DAY WINDOWS) & Targets
    console.log('\n[Phase 9/14] Seeding 6 Phases (STRICT MAX 15-DAY WINDOWS)...');
    const phaseList = [
      { id: uuidv4(), name: 'Phase 1', start: '2026-01-05', end: '2026-01-19', change: '2026-01-15', status: 'COMPLETED' }, // 14 days
      { id: uuidv4(), name: 'Phase 2', start: '2026-01-20', end: '2026-02-03', change: '2026-01-30', status: 'COMPLETED' }, // 14 days
      { id: uuidv4(), name: 'Phase 3', start: '2026-02-04', end: '2026-02-18', change: '2026-02-14', status: 'COMPLETED' }, // 14 days
      { id: uuidv4(), name: 'Phase 4', start: '2026-02-19', end: '2026-03-05', change: '2026-03-01', status: 'COMPLETED' }, // 14 days
      { id: uuidv4(), name: 'Phase 5', start: '2026-03-06', end: '2026-03-20', change: '2026-03-16', status: 'COMPLETED' }, // 14 days
      { id: uuidv4(), name: 'Phase 6', start: '2026-03-21', end: '2026-04-04', change: '2026-03-31', status: 'ACTIVE' }     // 14 days
    ];

    const phaseRows = [];
    const phaseTargetRows = [];
    const indTargetRows = [];

    for (const p of phaseList) {
      phaseRows.push([p.id, p.start, '09:00:00', p.end, '18:00:00', 10, 5, p.change, p.status, p.name]);
      // Phase Targets for Tiers D, C, B, A
      phaseTargetRows.push([p.id, 'D', 150, 60]);
      phaseTargetRows.push([p.id, 'C', 300, 100]);
      phaseTargetRows.push([p.id, 'B', 550, 160]);
      phaseTargetRows.push([p.id, 'A', 900, 240]);
      indTargetRows.push([p.id, 80]);
    }

    await batchInsert(conn, 'phases', [
      'phase_id', 'start_date', 'start_time', 'end_date', 'end_time', 'total_working_days', 'change_day_number', 'change_day', 'status', 'phase_name'
    ], phaseRows);
    await batchInsert(conn, 'phase_targets', ['phase_id', 'tier', 'group_target', 'individual_target'], phaseTargetRows);
    await batchInsert(conn, 'individual_phase_target', ['phase_id', 'target'], indTargetRows);

    const phaseEndJobRows = [];
    for (const p of phaseList) {
      const isPast = p.status === 'COMPLETED';
      phaseEndJobRows.push([
        p.id,
        `${p.end} 23:59:59`,
        isPast ? 'COMPLETED' : 'PENDING',
        isPast ? 1 : 0,
        isPast ? `${p.end} 23:59:59` : null
      ]);
    }
    await batchInsert(conn, 'phase_end_jobs', ['phase_id', 'run_at', 'status', 'attempts', 'completed_at'], phaseEndJobRows);
    console.log(`Created ${phaseRows.length} Phases (all <= 15 days), ${phaseTargetRows.length} Phase Targets, and Phase End Jobs.`);

    // 10. Eligibility & Evaluation Multipliers
    console.log('\n[Phase 10/14] Seeding Group & Individual Eligibility Evaluations...');
    const groupEligibilityRows = [];
    const indEligibilityRows = [];
    const gepRows = [];
    const iepRows = [];
    const groupBonusTotals = [];
    const indBonusTotals = [];

    // Evaluate for Phase 5 (Completed) and Phase 6 (Active)
    const evalPhases = [phaseList[4], phaseList[5]];
    for (const p of evalPhases) {
      // Evaluate first 50 groups
      for (let g = 1; g <= 50; g++) {
        const pts = 200 + (g * 15);
        const isEligible = pts >= 300 ? 1 : 0;
        const multiplier = isEligible ? 1.50 : 1.00;
        const awarded = isEligible ? (pts * 0.50) : 0;
        groupEligibilityRows.push([g, p.id, pts, isEligible, isEligible ? 'TARGET_MET' : 'SHORTFALL']);
        gepRows.push([g, p.id, pts, 'D', multiplier, isEligible, awarded]);
        if (p === phaseList[5]) {
          groupBonusTotals.push([g, awarded]);
        }
      }

      // Evaluate first 150 students
      for (let i = 0; i < 150; i++) {
        const sId = studentRows[i][0];
        const sPts = 70 + (i % 6) * 15;
        const isEligible = sPts >= 80 ? 1 : 0;
        const multiplier = isEligible ? 1.25 : 1.00;
        const awarded = isEligible ? (sPts * 0.25) : 0;
        indEligibilityRows.push([sId, p.id, sPts, isEligible, isEligible ? 'IND_TARGET_MET' : 'SHORTFALL']);
        iepRows.push([sId, p.id, sPts, multiplier, isEligible, awarded]);
        if (p === phaseList[5]) {
          indBonusTotals.push([sId, awarded]);
        }
      }
    }

    await batchInsert(conn, 'group_eligibility', ['group_id', 'phase_id', 'this_phase_group_points', 'is_eligible', 'reason_code'], groupEligibilityRows);
    await batchInsert(conn, 'individual_eligibility', ['student_id', 'phase_id', 'this_phase_base_points', 'is_eligible', 'reason_code'], indEligibilityRows);
    await batchInsert(conn, 'group_eligibility_points', ['group_id', 'phase_id', 'source_group_points', 'applied_tier', 'multiplier', 'is_eligible', 'awarded_points'], gepRows);
    await batchInsert(conn, 'individual_eligibility_points', ['student_id', 'phase_id', 'source_base_points', 'multiplier', 'is_eligible', 'awarded_points'], iepRows);
    await batchInsert(conn, 'group_eligibility_point_totals', ['group_id', 'total_points'], groupBonusTotals);
    await batchInsert(conn, 'individual_eligibility_point_totals', ['student_id', 'total_points'], indBonusTotals);

    // Group Rank Rules (Upsert to prevent duplicate entry error if schema already created default rules)
    const rankRuleRows = [
      ['LOYALTY', 'Loyalty', 'INDIVIDUAL', 8, 12, 16, 20, 1.00, 1],
      ['CONTRIBUTION', 'Contribution', 'INDIVIDUAL', 5000, 8000, 12000, 16000, 1.00, 1],
      ['RELIABILITY', 'Reliability', 'INDIVIDUAL', 5, 10, 20, 30, 1.00, 1]
    ];
    for (const rule of rankRuleRows) {
      await conn.query(`
        INSERT INTO \`group_rank_rules\` (
          \`rule_code\`, \`rule_name\`, \`scope_type\`, \`rank_4_min_value\`, \`rank_3_min_value\`, \`rank_2_min_value\`, \`rank_1_min_value\`, \`score_weight\`, \`is_active\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`rule_name\` = VALUES(\`rule_name\`),
          \`scope_type\` = VALUES(\`scope_type\`),
          \`rank_4_min_value\` = VALUES(\`rank_4_min_value\`),
          \`rank_3_min_value\` = VALUES(\`rank_3_min_value\`),
          \`rank_2_min_value\` = VALUES(\`rank_2_min_value\`),
          \`rank_1_min_value\` = VALUES(\`rank_1_min_value\`),
          \`score_weight\` = VALUES(\`score_weight\`),
          \`is_active\` = VALUES(\`is_active\`)
      `, rule);
    }

    // Group Rank Rule Overrides
    const firstMemId = allMems[0]?.membership_id || 1;
    const rankOverrideRows = [
      [1, 'LOYALTY', 10, 15, 20, 25, 1.20, firstMemId],
      [2, 'CONTRIBUTION', 6000, 9000, 13000, 17000, 1.10, firstMemId],
      [3, 'RELIABILITY', 6, 12, 22, 32, 1.05, firstMemId]
    ];
    await batchInsert(conn, 'group_rank_rule_overrides', [
      'group_id', 'rule_code', 'rank_4_min_value', 'rank_3_min_value', 'rank_2_min_value', 'rank_1_min_value', 'score_weight', 'updated_by_membership_id'
    ], rankOverrideRows);

    // Group Rank (Membership rankings in Phase 5)
    const groupRankRows = [];
    for (let m = 1; m <= 60; m++) {
      const mem = membershipRows[m - 1];
      const sId = mem[0];
      const gId = mem[1];
      const role = mem[2];
      const actualMemId = memMap.get(`${gId}:${sId}`) || m;
      const overallRank = 1 + (m % 4);
      groupRankRows.push([
        phaseList[4].id, // Phase 5
        1,
        gId,
        actualMemId,
        sId,
        role,
        5, 2, 85.00,
        12000, 1, 95.00,
        4, 2, 80.00,
        86.67,
        overallRank,
        overallRank === 1 ? null : overallRank + 1,
        'PROMOTED',
        'PHASE_REVIEW'
      ]);
    }
    await batchInsert(conn, 'group_rank', [
      'review_phase_id', 'review_cycle_number', 'group_id', 'membership_id', 'student_id',
      'membership_role', 'loyalty_phase_count', 'loyalty_rank', 'loyalty_score',
      'contribution_points', 'contribution_rank', 'contribution_score',
      'reliability_eligible_phase_count', 'reliability_rank', 'reliability_score',
      'total_score', 'overall_rank', 'previous_overall_rank', 'rank_movement', 'evaluation_basis'
    ], groupRankRows);

    // Team Change Tier records (Phase 5 transitions)
    const teamChangeTierRows = [];
    for (let g = 1; g <= 20; g++) {
      const curTier = g <= 10 ? 'D' : 'C';
      const recTier = g <= 10 ? 'C' : 'B';
      teamChangeTierRows.push([
        phaseList[4].id,
        g,
        phaseList[3].id,
        curTier,
        recTier,
        'PROMOTE',
        1,
        1,
        'TIER_THRESHOLD_MET',
        'ADM001'
      ]);
    }
    await batchInsert(conn, 'team_change_tier', [
      'phase_id', 'group_id', 'previous_phase_id', 'current_tier', 'recommended_tier',
      'change_action', 'last_phase_eligible', 'previous_phase_eligible', 'rule_code', 'approved_by_admin_id'
    ], teamChangeTierRows);

    console.log(`Evaluated ${groupEligibilityRows.length} group eligibilities, ${groupRankRows.length} member ranks, and ${teamChangeTierRows.length} tier transitions.`);

    // 11. Workflows: Join Requests & Leadership Requests
    console.log('\n[Phase 11/14] Seeding Join Requests & Leadership Role Requests...');
    const joinReqRows = [];
    const leadershipReqRows = [];
    const tierReqRows = [];

    // 50 Join Requests
    for (let j = 1; j <= 50; j++) {
      const sId = studentRows[700 + j][0];
      const gId = 1 + (j % 50);
      const status = j <= 20 ? 'PENDING' : (j <= 40 ? 'APPROVED' : 'REJECTED');
      joinReqRows.push([sId, gId, status, 'Interested in collaborating']);
    }

    // 25 Leadership Requests
    for (let l = 1; l <= 25; l++) {
      const mem = membershipRows[l - 1];
      const sId = mem[0];
      const gId = mem[1];
      const actualMemId = memMap.get(`${gId}:${sId}`) || l;
      const role = l % 2 === 0 ? 'CAPTAIN' : 'VICE_CAPTAIN';
      const status = l <= 10 ? 'PENDING' : (l <= 20 ? 'APPROVED' : 'REJECTED');
      leadershipReqRows.push([actualMemId, sId, gId, role, status, 'Demonstrated leadership during Phase 5']);
    }

    // 15 Group Tier Change Requests
    for (let tr = 1; tr <= 15; tr++) {
      const gId = tr;
      const status = tr <= 5 ? 'PENDING' : (tr <= 10 ? 'APPROVED' : 'REJECTED');
      tierReqRows.push([gId, 'D', 'C', 'PROMOTION', status, 'CAPTAIN', 'Exceeded milestone targets']);
    }

    await batchInsert(conn, 'join_requests', ['student_id', 'group_id', 'status', 'decision_reason'], joinReqRows);
    await batchInsert(conn, 'leadership_role_requests', ['membership_id', 'student_id', 'group_id', 'requested_role', 'status', 'request_reason'], leadershipReqRows);
    await batchInsert(conn, 'group_tier_change_requests', ['group_id', 'current_tier', 'requested_tier', 'request_type', 'status', 'requested_by_user_role', 'request_reason'], tierReqRows);
    console.log(`Seeded ${joinReqRows.length} Join Requests, ${leadershipReqRows.length} Leadership Requests, and ${tierReqRows.length} Tier Requests.`);

    // 12. On-Duty (OD) Requests & Event Registrations
    console.log('\n[Phase 12/14] Seeding On-Duty (OD) Requests & Event Invitations...');
    const odRows = [];
    const eventJoinReqRows = [];
    const eventTeamInvRows = [];

    for (let od = 1; od <= 25; od++) {
      const sId = studentRows[od][0];
      const tId = od; // Unique team_id per OD request ensures (round_id, team_id) uniqueness!
      const eId = 1 + (od % 5);
      const rId = (eId * 2) - 1; // Round 1
      const fStatus = od <= 10 ? 'APPROVED' : (od <= 18 ? 'PENDING' : 'REJECTED');
      const hStatus = fStatus === 'APPROVED' ? (od <= 7 ? 'APPROVED' : 'PENDING') : 'PENDING';
      const aStatus = hStatus === 'APPROVED' ? (od <= 4 ? 'APPROVED' : 'PENDING') : 'PENDING';

      odRows.push([
        eId, rId, tId, sId, '2026-03-10', '2026-03-12', 3,
        fStatus, hStatus, aStatus,
        'Shortlisted for Grand Finals', 'Official round confirmation proof'
      ]);

      eventJoinReqRows.push([sId, tId, 'APPROVED']);
      eventTeamInvRows.push([eId, tId, sId, studentRows[od + 50][0], 'ACCEPTED']);
    }

    await batchInsert(conn, 'on_duty_requests', [
      'event_id', 'round_id', 'team_id', 'requested_by_student_id', 'requested_from_date', 'requested_to_date', 'requested_day_count',
      'faculty_status', 'hod_status', 'admin_status', 'faculty_notes', 'admin_notes'
    ], odRows);
    await batchInsert(conn, 'event_join_request', ['student_id', 'team_id', 'status'], eventJoinReqRows);
    await batchInsert(conn, 'event_team_invitations', ['event_id', 'team_id', 'inviter_student_id', 'invitee_student_id', 'status'], eventTeamInvRows);
    console.log(`Seeded ${odRows.length} On-Duty Requests and Event Participation records.`);

    // 13. Audit Logs
    console.log('\n[Phase 13/14] Seeding Security & System Audit Logs...');
    const auditRows = [];
    const actions = [
      ['USER_LOGIN', 'users', 'SUCCESS', 'User logged in securely via JWT cookie'],
      ['PHASE_TARGET_SET', 'phases', 'SUCCESS', 'Admin configured phase targets'],
      ['GROUP_ACTIVATED', 'sgroup', 'SUCCESS', 'Group verified with 4 leadership roles and activated'],
      ['OD_APPROVED', 'on_duty_requests', 'SUCCESS', 'Admin approved state on-duty request'],
      ['BASE_POINTS_AWARDED', 'base_points', 'SUCCESS', 'Faculty awarded milestone points']
    ];
    for (let a = 1; a <= 100; a++) {
      const act = actions[a % actions.length];
      const adminId = adminRows[a % adminRows.length][1]; // user_id
      auditRows.push([act[0], act[1], String(a), adminId, 'ADMIN', act[2], JSON.stringify({ note: act[3] })]);
    }
    await batchInsert(conn, 'audit_logs', ['action', 'entity_type', 'entity_id', 'actor_user_id', 'actor_role', 'reason_code', 'details_json'], auditRows);

    // Activity Points Write Logs (Mimicked External Sync)
    const activitySyncRows = [];
    for (let s = 1; s <= 20; s++) {
      const sId = studentRows[s][0];
      const gId = 1 + (s % 20);
      activitySyncRows.push([
        'PHASE_POINTS_SYNC',
        `STUDENT:${sId}`,
        phaseList[4].id,
        sId,
        gId,
        JSON.stringify({ points: 150, syncBatch: s, mode: 'AUTOMATED_CRON' }),
        'MIMICKED_INTERNAL',
        'SYNCED',
        'ELIGIBILITY_ENGINE'
      ]);
    }
    await batchInsert(conn, 'activity_points_write_log', [
      'sync_type', 'entity_key', 'phase_id', 'student_id', 'group_id',
      'payload_json', 'connection_mode', 'status', 'source_module'
    ], activitySyncRows);

    console.log(`Created ${auditRows.length} audit logs and ${activitySyncRows.length} activity sync logs.`);

    // 14. Commit Transaction
    console.log('\n[Phase 14/14] Committing transaction...');
    await conn.commit();
    console.log('✅ ALL 14 PHASES COMPLETED AND COMMITTED SUCCESSFULLY!\n');

    process.exit(0);
  } catch (err) {
    await conn.rollback();
    console.error('❌ SEEDING TRANSACTION FAILED! Rolled back changes.', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

seed();
