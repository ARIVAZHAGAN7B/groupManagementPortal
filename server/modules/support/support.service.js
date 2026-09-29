const db = require('../../config/db');

function formatDate(d) {
  if (!d) return 'N/A';
  if (d instanceof Date) return d.toISOString().split('T')[0];
  const s = String(d);
  return s.includes('T') ? s.split('T')[0] : s;
}

class SupportService {
  /**
   * Fetch rich relational context tailored to the authenticated user.
   */
  async getUserContext(user) {
    if (!user) return { role: 'GUEST' };

    const context = {
      userId: user.userId,
      role: user.role,
      name: user.name || 'User'
    };

    try {
      if (user.role === 'STUDENT') {
        // 1. Student Profile & Roll Number
        const [students] = await db.query(
          'SELECT student_id, name, email, department, year FROM students WHERE user_id = ? LIMIT 1',
          [user.userId]
        );
        if (students.length > 0) {
          const student = students[0];
          context.studentId = student.student_id;
          context.department = student.department;
          context.year = student.year;
          context.name = student.name;
          context.email = student.email;

          // 2. Base Points & Recent Ledger
          const [bp] = await db.query(
            'SELECT total_base_points FROM base_points WHERE student_id = ? LIMIT 1',
            [student.student_id]
          );
          context.totalBasePoints = bp[0]?.total_base_points || 0;

          const [history] = await db.query(
            'SELECT activity_date, points, reason FROM base_point_history WHERE student_id = ? ORDER BY activity_date DESC LIMIT 4',
            [student.student_id]
          );
          context.recentPointsHistory = history.map(h => ({
            date: formatDate(h.activity_date),
            points: h.points,
            reason: h.reason
          }));

          // 3. Active Group & Leadership Role
          const [groupInfo] = await db.query(
            `SELECT m.membership_id, m.role as memberRole, g.group_id, g.group_code, g.group_name, g.tier, g.status as groupStatus
             FROM memberships m
             JOIN sgroup g ON g.group_id = m.group_id
             WHERE m.student_id = ? AND m.status = 'ACTIVE'
             LIMIT 1`,
            [student.student_id]
          );

          if (groupInfo.length > 0) {
            const g = groupInfo[0];
            context.group = {
              groupId: g.group_id,
              groupCode: g.group_code,
              groupName: g.group_name,
              tier: g.tier,
              status: g.groupStatus,
              myRole: g.memberRole
            };

            // Fetch Squad Roster Leaders
            const [leaders] = await db.query(
              `SELECT m.role, s.name, s.student_id
               FROM memberships m
               JOIN students s ON s.student_id = m.student_id
               WHERE m.group_id = ? AND m.status = 'ACTIVE' AND m.role IN ('CAPTAIN', 'VICE_CAPTAIN', 'STRATEGIST', 'MANAGER')`,
              [g.group_id]
            );
            context.group.leaders = leaders.map(l => ({ role: l.role, name: l.name }));

            const [[{ memberCount }]] = await db.query(
              `SELECT count(*) as memberCount FROM memberships WHERE group_id = ? AND status = 'ACTIVE'`,
              [g.group_id]
            );
            context.group.activeMemberCount = memberCount;
          } else {
            context.group = null;
          }

          // 4. Hub Memberships
          const [hubs] = await db.query(
            `SELECT h.hub_name, h.hub_code, hm.hub_priority
             FROM hub_membership hm
             JOIN hubs h ON h.hub_id = hm.hub_id
             WHERE hm.student_id = ? AND hm.status = 'ACTIVE'`,
            [student.student_id]
          );
          context.hubs = hubs.map(h => `${h.hub_name} (${h.hub_priority} priority)`);

          // 5. On-Duty (OD) Requests
          const [odList] = await db.query(
            `SELECT od.od_request_id, e.event_name, od.faculty_status, od.hod_status, od.admin_status,
                    od.requested_from_date, od.requested_to_date, od.requested_day_count
             FROM on_duty_requests od
             JOIN events e ON e.event_id = od.event_id
             WHERE od.requested_by_student_id = ?
             ORDER BY od.created_at DESC LIMIT 3`,
            [student.student_id]
          );
          context.onDutyRequests = odList.map(od => ({
            event: od.event_name,
            days: od.requested_day_count,
            dates: `${od.requested_from_date} to ${od.requested_to_date}`,
            faculty: od.faculty_status,
            hod: od.hod_status,
            admin: od.admin_status
          }));
        }
      } else if (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') {
        const [[{ totalUsers }]] = await db.query('SELECT count(*) as totalUsers FROM users');
        const [[{ totalGroups }]] = await db.query("SELECT count(*) as totalGroups FROM sgroup WHERE status = 'ACTIVE'");
        const [[{ pendingOD }]] = await db.query("SELECT count(*) as pendingOD FROM on_duty_requests WHERE admin_status = 'PENDING'");
        const [[{ pendingJoin }]] = await db.query("SELECT count(*) as pendingJoin FROM join_requests WHERE status = 'PENDING'");

        context.adminSummary = {
          totalUsers,
          activeGroups: totalGroups,
          pendingOnDutyRequests: pendingOD,
          pendingJoinRequests: pendingJoin
        };
      }
    } catch (err) {
      console.error('Error fetching user context for support:', err.message);
    }

    return context;
  }

  /**
   * Fetch active phase, system settings, and rules.
   */
  async getGlobalContext() {
    const globalContext = {
      systemRules: {
        minGroupMembers: 4,
        maxGroupMembers: 10,
        mandatoryLeadershipRoles: ['CAPTAIN', 'VICE_CAPTAIN', 'STRATEGIST', 'MANAGER'],
        maxPhaseDurationDays: 15,
        enforceChangeDayForLeave: true,
        incubationDurationDays: 5
      }
    };

    try {
      // 1. Current Active Phase
      const [phases] = await db.query(
        `SELECT phase_id, phase_name, start_date, end_date, change_day, total_working_days, status,
                DATEDIFF(end_date, CURRENT_DATE()) as days_remaining,
                DATEDIFF(end_date, start_date) as duration_days
         FROM phases
         WHERE status = 'ACTIVE'
         ORDER BY start_date DESC LIMIT 1`
      );
      if (phases.length > 0) {
        globalContext.activePhase = phases[0];
      }

      // 2. Active Events
      const [events] = await db.query(
        `SELECT event_id, event_code, event_name, registration_mode, start_date, end_date, status
         FROM events
         WHERE status = 'ACTIVE' LIMIT 5`
      );
      globalContext.activeEvents = events;

      // 3. Technical Hubs
      const [hubs] = await db.query(`SELECT hub_code, hub_name, hub_priority FROM hubs LIMIT 8`);
      globalContext.hubs = hubs.map(h => h.hub_name);
    } catch (err) {
      console.error('Error fetching global context for support:', err.message);
    }

    return globalContext;
  }

  /**
   * Direct integration with Google Gemini LLM API.
   */
  async callGeminiApi(apiKey, systemInstruction, userMessage, conversationHistory = []) {
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];

    const contents = [];

    // Append prior conversational turns
    if (Array.isArray(conversationHistory)) {
      for (const turn of conversationHistory.slice(-6)) {
        if (turn.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: turn.text }] });
        } else if (turn.sender === 'assistant' || turn.sender === 'bot') {
          contents.push({ role: 'model', parts: [{ text: turn.text }] });
        }
      }
    }

    // Append current user message
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800
      }
    };

    let lastError = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            return candidate;
          }
        } else {
          const errText = await response.text();
          lastError = new Error(`Model ${model} returned ${response.status}: ${errText}`);
          console.warn(`[SupportService] ${model} unavailable, trying next model candidate...`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[SupportService] Failed calling ${model}: ${err.message}`);
      }
    }

    throw lastError || new Error('All Gemini candidate models failed to generate content');
  }

  /**
   * Deterministic relational response generator when Gemini API is unavailable or offline.
   */
  generateDeterministicResponse(userContext, globalContext, userMessage) {
    const q = (userMessage || '').toLowerCase();
    const isStudent = userContext.role === 'STUDENT';
    const isAdmin = userContext.role === 'ADMIN' || userContext.role === 'SYSTEM_ADMIN';
    const phase = globalContext.activePhase || {
      phase_name: 'Phase 6',
      start_date: '2026-03-21',
      end_date: '2026-04-04',
      change_day: '2026-03-31',
      duration_days: 14
    };

    // 1. Points & Ledger
    if (q.includes('point') || q.includes('score') || q.includes('ledger') || q.includes('balance')) {
      if (isStudent) {
        let historyText = '';
        if (userContext.recentPointsHistory && userContext.recentPointsHistory.length > 0) {
          historyText = '\n\n**Recent Activity:**\n' + userContext.recentPointsHistory.map(
            h => `• **+${h.points} pts** — ${h.reason} (${h.date})`
          ).join('\n');
        }
        return `You currently have **${userContext.totalBasePoints || 0} Total Base Points** in your academic ledger.${historyText}\n\n*Tip: Points directly determine your individual and squad eligibility for phase multipliers!*`;
      } else {
        return `Students earn base points through milestone submissions, hackathons, and peer bonuses. The individual eligibility threshold for **${phase.phase_name}** is **80 base points**.`;
      }
    }

    // 2. Group & Squad Membership / Leadership
    if (q.includes('group') || q.includes('squad') || q.includes('captain') || q.includes('member') || q.includes('leader')) {
      if (isStudent) {
        if (userContext.group) {
          const g = userContext.group;
          const leadersText = g.leaders && g.leaders.length > 0
            ? g.leaders.map(l => `• **${l.role.replace('_', ' ')}**: ${l.name}`).join('\n')
            : 'Leadership roster under configuration';

          return `You are in **${g.groupName}** (\`${g.groupCode}\`) — **Tier ${g.tier}** [Status: **${g.status}**].\n\n` +
                 `• **Your Assigned Role:** \`${g.myRole}\`\n` +
                 `• **Active Squad Members:** ${g.activeMemberCount || 'N/A'}/10\n\n` +
                 `**Leadership Board:**\n${leadersText}\n\n` +
                 `*Remember: Operational squads require exactly 4 leadership roles (Captain, Vice Captain, Strategist, Manager) and 4–10 total members.*`;
        } else {
          return `You are currently **not enrolled in an active squad**. You can explore open groups from the [All Groups](/groups) directory or submit a join request!`;
        }
      } else {
        return `All active groups in GM Portal must have between **4 and 10 members** and fill all **4 mandatory leadership roles**: \`CAPTAIN\`, \`VICE_CAPTAIN\`, \`STRATEGIST\`, and \`MANAGER\`. Currently, **${userContext.adminSummary?.activeGroups || 80}** active groups satisfy this policy.`;
      }
    }

    // 3. Phases & Dates (Max 15 Days Rule)
    if (q.includes('phase') || q.includes('date') || q.includes('sprint') || q.includes('timeline') || q.includes('change day')) {
      const remaining = phase.days_remaining !== undefined ? `${phase.days_remaining} days remaining` : 'Active Sprint';
      return `### 📅 Current Phase Information\n\n` +
             `• **Active Phase:** **${phase.phase_name}**\n` +
             `• **Start Date:** \`${formatDate(phase.start_date)}\`\n` +
             `• **End Date:** \`${formatDate(phase.end_date)}\`\n` +
             `• **Sprint Duration:** **${phase.duration_days || 14} days** *(Strict operational policy: all phases $\\le 15$ days)*\n` +
             `• **Change Day:** \`${formatDate(phase.change_day)}\`\n` +
             `• **Status:** ${remaining}\n\n` +
             `*Notice: Group membership transfers and roster changes are only permitted on designated Change Days.*`;
    }

    // 4. On-Duty (OD) Requests & Leaves
    if (q.includes('od') || q.includes('on duty') || q.includes('leave') || q.includes('attendance') || q.includes('proof')) {
      if (isStudent && userContext.onDutyRequests && userContext.onDutyRequests.length > 0) {
        const odList = userContext.onDutyRequests.map(
          od => `• **${od.event}** (${od.days} days: ${od.dates})\n  Faculty: \`${od.faculty}\` | HOD: \`${od.hod}\` | Admin: \`${od.admin}\``
        ).join('\n');
        return `### 📄 Your Recent On-Duty (OD) Requests\n\n${odList}\n\n` +
               `You can submit new requests with shortlist proof via the [On-Duty Portal](/on-duty).`;
      } else {
        return `### 📄 On-Duty (OD) Governance Policy\n\n` +
               `1. Students shortlisted for competitive hackathons or technical events can submit an OD application.\n` +
               `2. Multi-tier approval flow: **Faculty Advisor** ➔ **Head of Department (HOD)** ➔ **Admin Review**.\n` +
               `3. Proof of round qualification is mandatory for events requiring offline venue attendance.`;
      }
    }

    // 5. Eligibility & Multipliers
    if (q.includes('eligible') || q.includes('eligibility') || q.includes('multiplier') || q.includes('bonus') || q.includes('target')) {
      return `### 🎯 Eligibility & Phase Multipliers\n\n` +
             `• **Individual Target:** **80 Base Points** per phase.\n` +
             `• **Group Targets by Tier:**\n` +
             `  - **Tier D:** 150 Group Points / 60 Individual Target\n` +
             `  - **Tier C:** 300 Group Points / 100 Individual Target\n` +
             `  - **Tier B:** 550 Group Points / 160 Individual Target\n` +
             `  - **Tier A:** 900 Group Points / 240 Individual Target\n\n` +
             `Meeting phase targets awards **1.25x – 1.50x multiplier bonus points** calculated during the end-of-phase review!`;
    }

    // 6. Events & Technical Hubs
    if (q.includes('event') || q.includes('hackathon') || q.includes('hub') || q.includes('competition')) {
      const activeEvents = globalContext.activeEvents || [];
      const evList = activeEvents.map(e => `• **${e.event_name}** (\`${e.event_code}\`) — ${e.registration_mode} registration`).join('\n');
      return `### 🚀 Active Events & Hackathons\n\n${evList || 'National Hackathon 2026, RoboWars Combat, Cloud Architecture Summit'}\n\n` +
             `**Specialized Technical Hubs:**\n${(globalContext.hubs || []).map(h => `• ${h}`).join('\n')}\n\n` +
             `Browse events under [Events](/events) or join your department's [Technical Hubs](/hubs)!`;
    }

    // 7. General Rules & Policies
    if (q.includes('rule') || q.includes('policy') || q.includes('requirement') || q.includes('limit')) {
      return `### 📜 GM Portal Operational Policies\n\n` +
             `1. **Group Membership Limits:** Minimum 4 members, maximum 10 members.\n` +
             `2. **4 Mandatory Leadership Roles:** Every active squad must elect a \`CAPTAIN\`, \`VICE_CAPTAIN\`, \`STRATEGIST\`, and \`MANAGER\`.\n` +
             `3. **Strict 15-Day Phase Duration:** All phase sprints operate within a maximum window of 15 days.\n` +
             `4. **Change Day Protocol:** Students may only switch or leave groups during approved Change Days.\n` +
             `5. **Single Active Group:** A student can belong to at most 1 active squad at any time.`;
    }

    // Default Fallback
    return `Hello **${userContext.name}**! I'm your GM Portal Support Assistant.\n\n` +
           `I can help you with:\n` +
           `• **Points & Ledgers:** Current base points and bonus breakdown\n` +
           `• **Squad Status:** Your group roster, leadership board, and tier\n` +
           `• **Phase & Timeline:** Phase 6 schedule and Change Day countdown\n` +
           `• **On-Duty Requests:** OD application status and event verification\n` +
           `• **Portal Rules:** Group size constraints and leadership policies\n\n` +
           `What would you like to check?`;
  }

  /**
   * Main conversational interface.
   */
  async generateResponse(user, userMessage, conversationHistory = []) {
    const userContext = await this.getUserContext(user);
    const globalContext = await this.getGlobalContext();

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    let reply = '';
    let mode = 'DATABASE_DIRECT';

    if (apiKey) {
      try {
        const systemInstruction = `You are the official GM Portal AI Support Assistant powered by Google Gemini.
You have direct, real-time access to the user's authentic database profile and global portal state.

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

GLOBAL PORTAL CONTEXT:
${JSON.stringify(globalContext, null, 2)}

CORE GUIDELINES FOR HIGH-QUALITY RESPONSES:
1. Ground your answers 100% in the real user context and global context provided above. Always use the user's actual numbers, squad name, and dates.
2. Structure your answers with clear Markdown:
   - Use bold headers (### Section Title) to organize information.
   - When presenting points, members, or comparisons, use clean Markdown tables with columns (e.g., | Item | Details | Status |).
   - Use clear bullet points with emojis for readability.
3. Reinforce portal policies:
   - Active squads must have between 4 and 10 members.
   - Squads must fill all 4 mandatory leadership roles: CAPTAIN, VICE_CAPTAIN, STRATEGIST, MANAGER.
   - Phase sprints are strictly capped at maximum 15 days (Phase 6 is 14 days).
   - Roster changes are only permitted during designated Change Days.
4. Provide direct action suggestions with portal links when relevant (e.g., [My Group](/my-group), [On-Duty Requests](/on-duty), [Events](/events), [Leaderboard](/leaderboard)).
5. Keep your tone encouraging, polished, and crisp. Avoid rambling.`;

        reply = await this.callGeminiApi(apiKey, systemInstruction, userMessage, conversationHistory);
        mode = 'GEMINI_AI';
      } catch (err) {
        console.warn(`[SupportService] Gemini call failed: ${err.message}. Falling back to deterministic database engine.`);
        reply = this.generateDeterministicResponse(userContext, globalContext, userMessage);
        mode = 'DATABASE_FALLBACK';
      }
    } else {
      reply = this.generateDeterministicResponse(userContext, globalContext, userMessage);
    }

    const suggestions = this.getSuggestionsForUser(userContext);

    return {
      success: true,
      reply,
      mode,
      suggestions,
      userRole: userContext.role
    };
  }

  getSuggestionsForUser(userContext) {
    if (userContext.role === 'STUDENT') {
      return [
        '💰 How many points do I have?',
        '🛡️ Who is in my squad?',
        '📅 When does Phase 6 end?',
        '✅ Am I eligible for bonus?',
        '📄 Check my OD request status',
        '📜 What are the group rules?'
      ];
    } else {
      return [
        '📊 Portal System Overview',
        '📅 Current Phase 6 Details',
        '🛡️ Active Group Leadership Rules',
        '📄 Pending On-Duty Requests',
        '📜 Operational Policies'
      ];
    }
  }
}

module.exports = new SupportService();
