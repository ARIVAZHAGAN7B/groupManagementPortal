CREATE TABLE IF NOT EXISTS sgroup (
  group_id INT NOT NULL AUTO_INCREMENT,
  group_code VARCHAR(50) NOT NULL,
  group_name VARCHAR(150) NOT NULL,
  tier ENUM('D','C','B','A') NOT NULL DEFAULT 'D',
  status ENUM('ACTIVE','INACTIVE','FROZEN','ARCHIVED') NOT NULL DEFAULT 'INACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id),
  UNIQUE KEY uq_sgroup_code (group_code),
  KEY idx_sgroup_status (status),
  KEY idx_sgroup_tier_status (tier, status),
  KEY idx_sgroup_name_status (group_name, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

