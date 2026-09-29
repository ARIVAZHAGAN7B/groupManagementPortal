CREATE TABLE IF NOT EXISTS sgroup (
  group_id INT NOT NULL AUTO_INCREMENT,
  group_code VARCHAR(50) NOT NULL,
  group_name VARCHAR(150) NOT NULL,
  tier ENUM('D','C','B','A') NOT NULL DEFAULT 'D',
  status ENUM('ACTIVE','INACTIVE','FROZEN','ARCHIVED') NOT NULL DEFAULT 'INACTIVE',
  accepting_applications TINYINT(1) NOT NULL DEFAULT 1,
  joining_conditions VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id),
  UNIQUE KEY uq_sgroup_code (group_code),
  KEY idx_sgroup_status (status),
  KEY idx_sgroup_tier_status (tier, status),
  KEY idx_sgroup_accepting_status (accepting_applications, status),
  KEY idx_sgroup_name_status (group_name, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @sgroup_schema := DATABASE();

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @sgroup_schema AND TABLE_NAME = 'sgroup' AND COLUMN_NAME = 'accepting_applications'
  ),
  'SELECT 1',
  'ALTER TABLE sgroup ADD COLUMN accepting_applications TINYINT(1) NOT NULL DEFAULT 1 AFTER status'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @sgroup_schema AND TABLE_NAME = 'sgroup' AND COLUMN_NAME = 'joining_conditions'
  ),
  'SELECT 1',
  'ALTER TABLE sgroup ADD COLUMN joining_conditions VARCHAR(255) NULL AFTER accepting_applications'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @sgroup_schema AND TABLE_NAME = 'sgroup' AND INDEX_NAME = 'idx_sgroup_accepting_status'
  ),
  'SELECT 1',
  'ALTER TABLE sgroup ADD KEY idx_sgroup_accepting_status (accepting_applications, status)'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

