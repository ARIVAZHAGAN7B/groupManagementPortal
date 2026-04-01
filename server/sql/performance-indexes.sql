-- Performance indexes for existing databases.
-- Apply these after the base tables already exist.

ALTER TABLE sgroup
  ADD KEY idx_sgroup_name_status (group_name, status);

ALTER TABLE memberships
  ADD KEY idx_memberships_student_group_status (student_id, group_id, status),
  ADD KEY idx_memberships_group_status_role_id (group_id, status, role, membership_id);

ALTER TABLE teams
  ADD KEY idx_teams_type_event_status (team_type, event_id, status);

ALTER TABLE team_membership
  ADD KEY idx_team_membership_student_team_status (student_id, team_id, status);

ALTER TABLE individual_eligibility
  ADD KEY idx_individual_eligibility_phase_student_status (phase_id, student_id, is_eligible);

ALTER TABLE group_eligibility
  ADD KEY idx_group_eligibility_phase_group_status (phase_id, group_id, is_eligible);

ALTER TABLE individual_eligibility_points
  ADD KEY idx_individual_points_student_multiplier (student_id, is_eligible, multiplier);

ALTER TABLE group_eligibility_points
  ADD KEY idx_group_points_group_multiplier (group_id, is_eligible, multiplier);

ALTER TABLE group_points
  ADD KEY idx_group_points_group_membership_created (group_id, membership_id, created_at);

ALTER TABLE users
  ADD UNIQUE KEY uq_users_email (email),
  ADD KEY idx_users_status (status),
  ADD KEY idx_users_role_status (role, status);

ALTER TABLE students
  ADD UNIQUE KEY uq_students_user_id (user_id),
  ADD KEY idx_students_email (email),
  ADD KEY idx_students_department_year (department, year);

ALTER TABLE admins
  ADD UNIQUE KEY uq_admins_user_id (user_id),
  ADD KEY idx_admins_role (role);
