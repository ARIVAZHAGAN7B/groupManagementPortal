USE test;

CREATE TABLE IF NOT EXISTS teams (
  team_id INT NOT NULL AUTO_INCREMENT,
  event_id INT NULL,
  team_code VARCHAR(50) NOT NULL,
  team_name VARCHAR(120) NOT NULL,
  team_type ENUM('TEAM','HUB','SECTION','EVENT') NOT NULL DEFAULT 'TEAM',
  status ENUM('ACTIVE','INACTIVE','FROZEN','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  description TEXT NULL,
  created_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id),
  UNIQUE KEY uq_teams_code (team_code),
  KEY idx_teams_status (status),
  KEY idx_teams_type_status (team_type, status),
  KEY idx_teams_event_status (event_id, status),
  CONSTRAINT fk_teams_event
    FOREIGN KEY (event_id)
    REFERENCES events(event_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS team_membership (
  team_membership_id BIGINT NOT NULL AUTO_INCREMENT,
  team_id INT NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  status ENUM('ACTIVE','LEFT') NOT NULL DEFAULT 'ACTIVE',
  join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leave_date DATETIME NULL DEFAULT NULL,
  assigned_by VARCHAR(36) NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (team_membership_id),
  KEY idx_team_membership_team_status (team_id, status),
  KEY idx_team_membership_student_status (student_id, status),
  KEY idx_team_membership_role_status (role, status),
  CONSTRAINT fk_team_membership_team
    FOREIGN KEY (team_id)
    REFERENCES teams(team_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_team_membership_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Existing teams table migration (if already created before event support):
-- ALTER TABLE teams
--   ADD COLUMN event_id INT NULL AFTER team_id,
--   ADD KEY idx_teams_event_status (event_id, status),
--   ADD CONSTRAINT fk_teams_event
--     FOREIGN KEY (event_id) REFERENCES events(event_id)
--     ON UPDATE CASCADE ON DELETE SET NULL;
