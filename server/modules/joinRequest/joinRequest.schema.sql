CREATE TABLE IF NOT EXISTS join_requests (
  request_id BIGINT NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(36) NOT NULL,
  group_id INT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decision_reason VARCHAR(255) NULL,
  decision_by VARCHAR(20) NULL,
  decision_by_user_id VARCHAR(36) NULL,
  decision_by_role VARCHAR(50) NULL,
  approved_role VARCHAR(50) NULL,
  decision_date DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (request_id),
  KEY idx_join_requests_group_status (group_id, status),
  KEY idx_join_requests_student_status (student_id, status),
  KEY idx_join_requests_student_group_status (student_id, group_id, status),
  KEY idx_join_requests_decision_user (decision_by_user_id, decision_by_role),
  CONSTRAINT fk_join_requests_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_join_requests_group
    FOREIGN KEY (group_id)
    REFERENCES sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_join_requests_decision_admin
    FOREIGN KEY (decision_by)
    REFERENCES admins(admin_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @join_requests_schema := DATABASE();

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @join_requests_schema AND TABLE_NAME = 'join_requests' AND COLUMN_NAME = 'decision_by_user_id'
  ),
  'SELECT 1',
  'ALTER TABLE join_requests ADD COLUMN decision_by_user_id VARCHAR(36) NULL AFTER decision_by'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @join_requests_schema AND TABLE_NAME = 'join_requests' AND COLUMN_NAME = 'decision_by_role'
  ),
  'SELECT 1',
  'ALTER TABLE join_requests ADD COLUMN decision_by_role VARCHAR(50) NULL AFTER decision_by_user_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @join_requests_schema AND TABLE_NAME = 'join_requests' AND COLUMN_NAME = 'approved_role'
  ),
  'SELECT 1',
  'ALTER TABLE join_requests ADD COLUMN approved_role VARCHAR(50) NULL AFTER decision_by_role'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @join_requests_schema AND TABLE_NAME = 'join_requests' AND INDEX_NAME = 'idx_join_requests_decision_user'
  ),
  'SELECT 1',
  'ALTER TABLE join_requests ADD KEY idx_join_requests_decision_user (decision_by_user_id, decision_by_role)'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

