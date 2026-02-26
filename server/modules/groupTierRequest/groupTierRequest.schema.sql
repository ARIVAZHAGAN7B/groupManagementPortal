USE test;

-- Manual schema for group tier promotion/demotion approval workflow (DB-managed, not executed by backend).
-- Match the column types to your existing tables before adding FKs.
-- In many setups here:
--   students.student_id -> VARCHAR(36)
--   admins.admin_id     -> INT or VARCHAR (check your schema)

CREATE TABLE IF NOT EXISTS group_tier_change_requests (
  tier_change_request_id BIGINT NOT NULL AUTO_INCREMENT,
  group_id INT NOT NULL,
  current_tier ENUM('D','C','B','A') NOT NULL,
  requested_tier ENUM('D','C','B','A') NOT NULL,
  request_type ENUM('PROMOTION','DEMOTION') NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  requested_by_user_role ENUM('CAPTAIN','ADMIN','SYSTEM_ADMIN') NOT NULL,
  requested_by_student_id VARCHAR(36) NULL,
  requested_by_admin_id INT NULL,
  request_reason VARCHAR(255) NULL,
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decision_by_admin_id INT NULL,
  decision_reason VARCHAR(255) NULL,
  decision_date DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tier_change_request_id),
  KEY idx_gtcr_group_status (group_id, status),
  KEY idx_gtcr_request_type_status (request_type, status),
  KEY idx_gtcr_requester_student (requested_by_student_id, status),
  KEY idx_gtcr_requester_admin (requested_by_admin_id, status),
  CONSTRAINT fk_gtcr_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_gtcr_requested_by_student
    FOREIGN KEY (requested_by_student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_gtcr_requested_by_admin
    FOREIGN KEY (requested_by_admin_id)
    REFERENCES admins(admin_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_gtcr_decision_admin
    FOREIGN KEY (decision_by_admin_id)
    REFERENCES admins(admin_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_gtcr_tier_change_non_equal
    CHECK (current_tier <> requested_tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- If your table already exists, run ALTER TABLE after fixing orphan rows/type mismatches.

