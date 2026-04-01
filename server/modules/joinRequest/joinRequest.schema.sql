CREATE TABLE IF NOT EXISTS join_requests (
  request_id BIGINT NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(36) NOT NULL,
  group_id INT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decision_reason VARCHAR(255) NULL,
  decision_by VARCHAR(20) NULL,
  decision_date DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (request_id),
  KEY idx_join_requests_group_status (group_id, status),
  KEY idx_join_requests_student_status (student_id, status),
  KEY idx_join_requests_student_group_status (student_id, group_id, status),
  CONSTRAINT fk_join_requests_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_join_requests_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_join_requests_decision_admin
    FOREIGN KEY (decision_by)
    REFERENCES admins(admin_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

