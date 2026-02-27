USE test;

CREATE TABLE IF NOT EXISTS team_target (
  team_target_id BIGINT NOT NULL AUTO_INCREMENT,
  team_id INT NOT NULL,
  target_member_count INT NOT NULL,
  notes VARCHAR(255) NULL,
  updated_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (team_target_id),
  UNIQUE KEY uq_team_target_team_id (team_id),
  KEY idx_team_target_member_count (target_member_count),
  CONSTRAINT fk_team_target_team
    FOREIGN KEY (team_id)
    REFERENCES teams(team_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
