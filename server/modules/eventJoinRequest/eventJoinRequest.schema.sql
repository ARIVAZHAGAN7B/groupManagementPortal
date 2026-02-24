USE test;

CREATE TABLE IF NOT EXISTS event_join_request (
  event_request_id BIGINT NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(36) NOT NULL,
  team_id INT NOT NULL,
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  decision_by_user_id VARCHAR(36) NULL,
  decision_by_role ENUM('CAPTAIN','ADMIN','SYSTEM_ADMIN') NULL,
  decision_reason VARCHAR(255) NULL,
  decision_date DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (event_request_id),
  KEY idx_event_join_request_team_status (team_id, status),
  KEY idx_event_join_request_student_status (student_id, status),
  KEY idx_event_join_request_student_team_status (student_id, team_id, status),
  CONSTRAINT fk_event_join_request_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_event_join_request_team
    FOREIGN KEY (team_id)
    REFERENCES teams(team_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
