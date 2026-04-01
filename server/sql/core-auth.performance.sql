-- Performance indexes for shared auth/profile tables that are referenced by many modules.
-- These tables are not owned by a single module schema file in this repository.
-- Review existing keys before applying on a live database.

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
