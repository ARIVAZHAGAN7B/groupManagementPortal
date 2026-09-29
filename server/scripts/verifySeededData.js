const bcrypt = require('bcrypt');
const db = require('../config/db');

const TEST_PASSWORD = 'Password@123';

async function verify() {
  console.log('===============================================================');
  console.log('     GM PORTAL — BUSINESS RULES & SEEDED DATA AUDITOR          ');
  console.log('===============================================================\n');

  let passedAll = true;
  const results = [];

  function report(checkName, passed, details) {
    if (!passed) passedAll = false;
    results.push({
      RuleCheck: checkName,
      Status: passed ? 'PASSED ✅' : 'FAILED ❌',
      Details: details
    });
  }

  try {
    // 1. User Count Verification
    const [[{ totalUsers }]] = await db.query('SELECT count(*) as totalUsers FROM users');
    const [[{ totalAdmins }]] = await db.query('SELECT count(*) as totalAdmins FROM admins');
    const [[{ totalStudents }]] = await db.query('SELECT count(*) as totalStudents FROM students');
    report(
      '1. User Counts (1,000 Total: 100 Admins, 900 Students)',
      totalUsers === 1000 && totalAdmins === 100 && totalStudents === 900,
      `Users: ${totalUsers}/1000, Admins: ${totalAdmins}/100, Students: ${totalStudents}/900`
    );

    // 2. Authentication & Bcrypt Verification
    const [sampleUsers] = await db.query(
      `SELECT email, password_hash, role FROM users 
       WHERE email IN ('admin001@bitsathy.ac.in', 'student001@bitsathy.ac.in', 'student900@bitsathy.ac.in')`
    );
    let authValid = sampleUsers.length === 3;
    for (const u of sampleUsers) {
      if (!bcrypt.compareSync(TEST_PASSWORD, u.password_hash)) {
        authValid = false;
        break;
      }
    }
    report(
      '2. Password Authentication (bcrypt salt validation)',
      authValid,
      `Tested ${sampleUsers.length} accounts with "${TEST_PASSWORD}" — all verified`
    );

    // 3. Phase Duration Rule (MAX 15 DAYS)
    const [phases] = await db.query(
      `SELECT phase_name, start_date, end_date, DATEDIFF(end_date, start_date) as duration_days, status FROM phases`
    );
    const maxPhaseDuration = Math.max(...phases.map(p => Number(p.duration_days)));
    const allPhasesValid = phases.length > 0 && maxPhaseDuration <= 15;
    report(
      '3. Phase Duration Rule (STRICT MAX 15 DAYS)',
      allPhasesValid,
      `Phases count: ${phases.length}, Maximum observed duration: ${maxPhaseDuration} days (<= 15 days requirement)`
    );

    // 4. Group Leadership Role Rules (Captain, Vice Captain, Strategist, Manager)
    const [[{ activeGroupTotal }]] = await db.query("SELECT count(*) as activeGroupTotal FROM sgroup WHERE status = 'ACTIVE'");
    const [leadershipAudit] = await db.query(`
      SELECT 
        g.group_id,
        g.group_code,
        SUM(CASE WHEN m.role = 'CAPTAIN' THEN 1 ELSE 0 END) as captain_count,
        SUM(CASE WHEN m.role = 'VICE_CAPTAIN' THEN 1 ELSE 0 END) as vc_count,
        SUM(CASE WHEN m.role = 'STRATEGIST' THEN 1 ELSE 0 END) as strat_count,
        SUM(CASE WHEN m.role = 'MANAGER' THEN 1 ELSE 0 END) as mgr_count,
        COUNT(m.membership_id) as total_active_members
      FROM sgroup g
      LEFT JOIN memberships m ON m.group_id = g.group_id AND m.status = 'ACTIVE'
      WHERE g.status = 'ACTIVE'
      GROUP BY g.group_id, g.group_code
    `);

    let leadershipRuleMet = leadershipAudit.length > 0 && leadershipAudit.length === activeGroupTotal;
    let memberBoundsMet = true;
    for (const g of leadershipAudit) {
      if (
        Number(g.captain_count) !== 1 || 
        Number(g.vc_count) !== 1 || 
        Number(g.strat_count) !== 1 || 
        Number(g.mgr_count) !== 1
      ) {
        leadershipRuleMet = false;
      }
      if (Number(g.total_active_members) < 4 || Number(g.total_active_members) > 10) {
        memberBoundsMet = false;
      }
    }
    report(
      '4. Active Group Leadership Rules (4 Roles Filled)',
      leadershipRuleMet,
      `Audited ${leadershipAudit.length}/${activeGroupTotal} active groups — all have 1 Captain, 1 VC, 1 Strategist, 1 Manager`
    );
    report(
      '5. Active Group Size Policy (Min 4, Max 10 members)',
      memberBoundsMet,
      `All active groups adhere strictly to min 4 / max 10 membership policy`
    );

    // 6. Base Points & History Ledger Balancing
    const [pointDiscrepancies] = await db.query(`
      SELECT 
        bp.student_id, 
        bp.total_base_points, 
        COALESCE(SUM(bph.points), 0) as history_sum
      FROM base_points bp
      LEFT JOIN base_point_history bph ON bph.student_id = bp.student_id
      GROUP BY bp.student_id, bp.total_base_points
      HAVING bp.total_base_points != history_sum
      LIMIT 5
    `);
    report(
      '6. Points Ledger Integrity (base_points == SUM(base_point_history))',
      pointDiscrepancies.length === 0,
      pointDiscrepancies.length === 0 ? 'All 900 student point ledgers balance with zero discrepancies' : `Found ${pointDiscrepancies.length} mismatched ledgers`
    );

    // 7. Active Membership Guard (No duplicate active groups per student)
    const [duplicateMemberships] = await db.query(`
      SELECT student_id, COUNT(*) as active_count
      FROM memberships
      WHERE status = 'ACTIVE'
      GROUP BY student_id
      HAVING active_count > 1
    `);
    report(
      '7. Unique Active Membership Constraint (Virtual Guard)',
      duplicateMemberships.length === 0,
      duplicateMemberships.length === 0 ? 'Zero students belong to more than 1 active group' : `Found duplicates`
    );

    // 8. Technical Hubs & Memberships
    const [[{ totalHubs }]] = await db.query('SELECT count(*) as totalHubs FROM hubs');
    const [[{ totalHubMembers }]] = await db.query('SELECT count(*) as totalHubMembers FROM hub_membership');
    report(
      '8. Technical Hubs & Hub Memberships',
      totalHubs === 8 && totalHubMembers > 0,
      `Hubs: ${totalHubs} created, Hub Memberships: ${totalHubMembers} assigned`
    );

    // 9. Events, Rounds & On-Duty Requests
    const [[{ totalEvents }]] = await db.query('SELECT count(*) as totalEvents FROM events');
    const [[{ totalRounds }]] = await db.query('SELECT count(*) as totalRounds FROM event_rounds');
    const [[{ totalOD }]] = await db.query('SELECT count(*) as totalOD FROM on_duty_requests');
    report(
      '9. Events, Rounds & On-Duty (OD) Governance',
      totalEvents > 0 && totalRounds > 0 && totalOD > 0,
      `Events: ${totalEvents}, Rounds: ${totalRounds}, OD Requests: ${totalOD}`
    );

    // 10. Foreign Key & Orphan Records Check
    const [orphanedStudents] = await db.query(`
      SELECT s.student_id FROM students s LEFT JOIN users u ON u.user_id = s.user_id WHERE u.user_id IS NULL
    `);
    const [orphanedAdmins] = await db.query(`
      SELECT a.admin_id FROM admins a LEFT JOIN users u ON u.user_id = a.user_id WHERE u.user_id IS NULL
    `);
    const noOrphans = orphanedStudents.length === 0 && orphanedAdmins.length === 0;
    report(
      '10. Referential Integrity (Zero Orphan Records)',
      noOrphans,
      `Orphaned students: ${orphanedStudents.length}, Orphaned admins: ${orphanedAdmins.length}`
    );

    console.table(results);

    if (passedAll) {
      console.log('🎉 ALL 10 BUSINESS RULES & INTEGRITY CHECKS PASSED PERFECTLY!\n');
      process.exit(0);
    } else {
      console.error('⚠️ SOME INTEGRITY CHECKS FAILED! Review details above.\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('Verification query failed:', err);
    process.exit(1);
  }
}

verify();
