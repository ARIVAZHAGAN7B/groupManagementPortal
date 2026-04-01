CREATE TABLE IF NOT EXISTS memberships (
  membership_id INT NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(36) NOT NULL,
  group_id INT NOT NULL,
  role ENUM('CAPTAIN','VICE_CAPTAIN','STRATEGIST','MANAGER','MEMBER') NOT NULL DEFAULT 'MEMBER',
  member_rank_override TINYINT NULL DEFAULT NULL,
  status ENUM('ACTIVE','LEFT') NOT NULL DEFAULT 'ACTIVE',
  join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leave_date DATETIME NULL DEFAULT NULL,
  incubation_end_date DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (membership_id),
  KEY idx_memberships_student_status (student_id, status, join_date),
  KEY idx_memberships_group_status (group_id, status, join_date),
  KEY idx_memberships_group_role_status (group_id, role, status),
  KEY idx_memberships_student_group_status (student_id, group_id, status),
  KEY idx_memberships_group_status_role_id (group_id, status, role, membership_id),
  CONSTRAINT fk_memberships_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_memberships_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS group_rank_rules (
  rule_id BIGINT NOT NULL AUTO_INCREMENT,
  rule_code VARCHAR(32) NOT NULL,
  rule_name VARCHAR(100) NOT NULL,
  scope_type VARCHAR(32) NOT NULL DEFAULT 'INDIVIDUAL',
  rank_4_min_value INT NOT NULL,
  rank_3_min_value INT NOT NULL,
  rank_2_min_value INT NOT NULL,
  rank_1_min_value INT NOT NULL,
  score_weight DECIMAL(6,2) NOT NULL DEFAULT 1.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (rule_id),
  UNIQUE KEY uq_group_rank_rules_code (rule_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO group_rank_rules (
  rule_code,
  rule_name,
  scope_type,
  rank_4_min_value,
  rank_3_min_value,
  rank_2_min_value,
  rank_1_min_value,
  score_weight,
  is_active
)
VALUES
  ('LOYALTY', 'Loyalty', 'INDIVIDUAL', 8, 12, 16, 20, 1.00, 1),
  ('CONTRIBUTION', 'Contribution', 'INDIVIDUAL', 5000, 8000, 12000, 16000, 1.00, 1),
  ('RELIABILITY', 'Reliability', 'INDIVIDUAL', 5, 10, 20, 30, 1.00, 1)
ON DUPLICATE KEY UPDATE
  rule_name = VALUES(rule_name),
  scope_type = VALUES(scope_type),
  rank_4_min_value = VALUES(rank_4_min_value),
  rank_3_min_value = VALUES(rank_3_min_value),
  rank_2_min_value = VALUES(rank_2_min_value),
  rank_1_min_value = VALUES(rank_1_min_value),
  score_weight = VALUES(score_weight),
  is_active = VALUES(is_active);

CREATE TABLE IF NOT EXISTS group_rank_rule_overrides (
  group_rank_rule_override_id BIGINT NOT NULL AUTO_INCREMENT,
  group_id INT NOT NULL,
  rule_code VARCHAR(32) NOT NULL,
  rank_4_min_value INT NOT NULL,
  rank_3_min_value INT NOT NULL,
  rank_2_min_value INT NOT NULL,
  rank_1_min_value INT NOT NULL,
  score_weight DECIMAL(6,2) NOT NULL DEFAULT 1.00,
  updated_by_membership_id INT NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (group_rank_rule_override_id),
  UNIQUE KEY uniq_group_rank_rule_override (group_id, rule_code),
  CONSTRAINT fk_group_rank_rule_override_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_group_rank_rule_override_membership
    FOREIGN KEY (updated_by_membership_id)
    REFERENCES memberships(membership_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS group_rank (
  group_rank_id BIGINT NOT NULL AUTO_INCREMENT,
  review_phase_id VARCHAR(36) NOT NULL,
  review_cycle_number INT NOT NULL,
  group_id INT NOT NULL,
  membership_id INT NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  membership_role VARCHAR(30) NOT NULL,
  loyalty_phase_count INT NOT NULL DEFAULT 0,
  loyalty_rank TINYINT NOT NULL,
  loyalty_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  contribution_points INT NOT NULL DEFAULT 0,
  contribution_rank TINYINT NOT NULL,
  contribution_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  reliability_eligible_phase_count INT NOT NULL DEFAULT 0,
  reliability_rank TINYINT NOT NULL,
  reliability_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  overall_rank TINYINT NOT NULL,
  previous_overall_rank TINYINT NULL DEFAULT NULL,
  rank_movement VARCHAR(20) NOT NULL DEFAULT 'NEW',
  evaluation_basis VARCHAR(50) NOT NULL DEFAULT 'PHASE_REVIEW',
  reviewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_rank_id),
  UNIQUE KEY uniq_group_rank_review_membership (review_phase_id, membership_id),
  KEY idx_group_rank_group_cycle (group_id, review_cycle_number, overall_rank),
  KEY idx_group_rank_membership_reviewed (membership_id, reviewed_at),
  CONSTRAINT fk_group_rank_phase
    FOREIGN KEY (review_phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_group_rank_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_group_rank_membership
    FOREIGN KEY (membership_id)
    REFERENCES memberships(membership_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_group_rank_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

