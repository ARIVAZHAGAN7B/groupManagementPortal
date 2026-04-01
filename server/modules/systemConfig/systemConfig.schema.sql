CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO system_settings (setting_key, setting_value)
VALUES
  ('min_group_members', '9'),
  ('max_group_members', '11'),
  ('incubation_duration_days', '1'),
  ('allow_student_group_creation', 'false'),
  ('require_leadership_for_activation', 'true'),
  ('enforce_change_day_for_leave', 'true')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

CREATE TABLE IF NOT EXISTS holidays (
  holiday_id INT NOT NULL AUTO_INCREMENT,
  holiday_date DATE NOT NULL,
  holiday_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (holiday_id),
  UNIQUE KEY uq_holidays_date (holiday_date),
  KEY idx_holidays_name (holiday_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

