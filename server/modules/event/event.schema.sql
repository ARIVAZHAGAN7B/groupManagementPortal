USE test;

CREATE TABLE IF NOT EXISTS events (
  event_id INT NOT NULL AUTO_INCREMENT,
  event_code VARCHAR(50) NOT NULL,
  event_name VARCHAR(150) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('ACTIVE','CLOSED','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  description TEXT NULL,
  created_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  UNIQUE KEY uq_events_code (event_code),
  KEY idx_events_status (status),
  KEY idx_events_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- If teams table already exists from previous setup, run this migration manually:
-- ALTER TABLE teams
--   ADD COLUMN event_id INT NULL AFTER team_id,
--   ADD KEY idx_teams_event_status (event_id, status),
--   ADD CONSTRAINT fk_teams_event
--     FOREIGN KEY (event_id) REFERENCES events(event_id)
--     ON UPDATE CASCADE ON DELETE SET NULL;
