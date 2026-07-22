CREATE TABLE IF NOT EXISTS on_duty_requests (
  od_request_id BIGINT NOT NULL AUTO_INCREMENT,
  event_id INT NOT NULL,
  round_id BIGINT NOT NULL,
  team_id INT NOT NULL,
  requested_by_student_id VARCHAR(36) NOT NULL,
  requested_from_date DATE NOT NULL,
  requested_to_date DATE NOT NULL,
  requested_day_count INT NOT NULL,
  shortlist_proof_path VARCHAR(500) NULL,
  shortlist_proof_name VARCHAR(255) NULL,
  shortlist_proof_type VARCHAR(120) NULL,
  shortlist_proof_uploaded_at DATETIME NULL,
  faculty_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  hod_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  admin_status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  faculty_notes VARCHAR(255) NULL,
  hod_notes VARCHAR(255) NULL,
  admin_notes TEXT NULL,
  reviewed_by_user_id VARCHAR(36) NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (od_request_id),
  UNIQUE KEY uq_on_duty_requests_round_team (round_id, team_id),
  KEY idx_on_duty_requests_event (event_id),
  KEY idx_on_duty_requests_team (team_id),
  KEY idx_on_duty_requests_requester (requested_by_student_id),
  KEY idx_on_duty_requests_admin_status (admin_status),
  CONSTRAINT fk_on_duty_requests_event
    FOREIGN KEY (event_id)
    REFERENCES events(event_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_on_duty_requests_round
    FOREIGN KEY (round_id)
    REFERENCES event_rounds(round_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_on_duty_requests_team
    FOREIGN KEY (team_id)
    REFERENCES teams(team_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_on_duty_requests_student
    FOREIGN KEY (requested_by_student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
