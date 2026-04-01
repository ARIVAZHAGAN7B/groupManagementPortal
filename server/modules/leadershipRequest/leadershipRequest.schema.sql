CREATE TABLE IF NOT EXISTS leadership_role_requests (
  leadership_request_id BIGINT NOT NULL AUTO_INCREMENT,
  membership_id INT NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  group_id INT NOT NULL,
  requested_role ENUM('CAPTAIN','VICE_CAPTAIN','STRATEGIST','MANAGER') NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  request_reason VARCHAR(255) NULL,
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decision_by_admin_id VARCHAR(20) NULL,
  decision_reason VARCHAR(255) NULL,
  decision_date DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (leadership_request_id),
  KEY idx_lrr_group_status (group_id, status),
  KEY idx_lrr_student_status (student_id, status),
  KEY idx_lrr_membership_status (membership_id, status),
  CONSTRAINT fk_lrr_membership
    FOREIGN KEY (membership_id)
    REFERENCES memberships(membership_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_lrr_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_lrr_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_lrr_decision_admin
    FOREIGN KEY (decision_by_admin_id)
    REFERENCES admins(admin_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

