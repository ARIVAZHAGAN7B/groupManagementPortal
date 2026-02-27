USE test;

-- Manual schema for phase-wise tier decisions derived from eligibility
-- (user naming requested: team_change_tier)
-- DB-managed only; backend does not auto-create this table.

CREATE TABLE IF NOT EXISTS team_change_tier (
  team_change_tier_id BIGINT NOT NULL AUTO_INCREMENT,
  phase_id VARCHAR(36) NOT NULL,
  group_id INT NOT NULL,
  previous_phase_id VARCHAR(36) NULL,
  current_tier ENUM('D','C','B','A') NOT NULL,
  recommended_tier ENUM('D','C','B','A') NOT NULL,
  change_action ENUM('PROMOTE','DEMOTE','SAME') NOT NULL,
  last_phase_eligible TINYINT(1) NULL,
  previous_phase_eligible TINYINT(1) NULL,
  rule_code VARCHAR(64) NOT NULL,
  approved_by_admin_id varchar(20) NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (team_change_tier_id),
  UNIQUE KEY uniq_tct_phase_group (phase_id, group_id),
  KEY idx_tct_phase_action (phase_id, change_action),
  KEY idx_tct_group (group_id),
  KEY idx_tct_admin (approved_by_admin_id),
  CONSTRAINT fk_tct_phase
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_tct_previous_phase
    FOREIGN KEY (previous_phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_tct_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_tct_admin
    FOREIGN KEY (approved_by_admin_id)
    REFERENCES admins(admin_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

