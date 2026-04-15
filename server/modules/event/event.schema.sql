CREATE TABLE IF NOT EXISTS events (
  event_id INT NOT NULL AUTO_INCREMENT,
  event_code VARCHAR(50) NOT NULL,
  event_name VARCHAR(150) NOT NULL,
  event_organizer VARCHAR(255) NULL,
  event_category VARCHAR(120) NULL,
  location VARCHAR(255) NULL,
  event_level VARCHAR(120) NULL,
  state VARCHAR(120) NULL,
  country VARCHAR(120) NULL,
  within_bit BOOLEAN NOT NULL DEFAULT FALSE,
  related_to_special_lab BOOLEAN NOT NULL DEFAULT FALSE,
  department VARCHAR(120) NULL,
  competition_name VARCHAR(255) NULL,
  total_level_of_competition VARCHAR(120) NULL,
  registration_link VARCHAR(500) NULL,
  selected_resources TEXT NULL,
  maximum_count INT NULL,
  applied_count INT NULL,
  apply_by_student BOOLEAN NOT NULL DEFAULT TRUE,
  registration_mode ENUM('TEAM','INDIVIDUAL') NOT NULL DEFAULT 'TEAM',
  start_date DATE NULL,
  end_date DATE NULL,
  registration_start_date DATE NULL,
  registration_end_date DATE NULL,
  min_members INT NULL,
  max_members INT NULL,
  status ENUM('ACTIVE','CLOSED','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  eligible_for_rewards BOOLEAN NOT NULL DEFAULT FALSE,
  winner_rewards TEXT NULL,
  reward_allocation TEXT NULL,
  description TEXT NULL,
  created_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  UNIQUE KEY uq_events_code (event_code),
  KEY idx_events_status (status),
  KEY idx_events_dates (start_date, end_date),
  KEY idx_events_registration_dates (registration_start_date, registration_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS event_rounds (
  round_id BIGINT NOT NULL AUTO_INCREMENT,
  event_id INT NOT NULL,
  round_order INT NOT NULL,
  round_name VARCHAR(150) NOT NULL,
  round_date DATE NULL,
  round_end_date DATE NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  location VARCHAR(255) NULL,
  description TEXT NULL,
  round_mode ENUM('ONLINE','OFFLINE') NOT NULL DEFAULT 'ONLINE',
  status ENUM('SCHEDULED','ONGOING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (round_id),
  UNIQUE KEY uq_event_rounds_event_order (event_id, round_order),
  KEY idx_event_rounds_event (event_id),
  CONSTRAINT fk_event_rounds_event
    FOREIGN KEY (event_id)
    REFERENCES events(event_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @events_schema := DATABASE();

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'event_rounds' AND COLUMN_NAME = 'round_end_date'
  ),
  'SELECT 1',
  'ALTER TABLE event_rounds ADD COLUMN round_end_date DATE NULL AFTER round_date'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'event_rounds' AND COLUMN_NAME = 'round_mode'
  ),
  'SELECT 1',
  'ALTER TABLE event_rounds ADD COLUMN round_mode ENUM(''ONLINE'',''OFFLINE'') NOT NULL DEFAULT ''ONLINE'' AFTER description'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @events_schema := DATABASE();

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'event_organizer'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN event_organizer VARCHAR(255) NULL AFTER event_name'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'event_category'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN event_category VARCHAR(120) NULL AFTER event_organizer'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'event_level'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN event_level VARCHAR(120) NULL AFTER location'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'state'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN state VARCHAR(120) NULL AFTER event_level'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'country'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN country VARCHAR(120) NULL AFTER state'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'within_bit'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN within_bit BOOLEAN NOT NULL DEFAULT FALSE AFTER country'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'related_to_special_lab'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN related_to_special_lab BOOLEAN NOT NULL DEFAULT FALSE AFTER within_bit'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'department'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN department VARCHAR(120) NULL AFTER related_to_special_lab'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'competition_name'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN competition_name VARCHAR(255) NULL AFTER department'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'total_level_of_competition'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN total_level_of_competition VARCHAR(120) NULL AFTER competition_name'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'selected_resources'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN selected_resources TEXT NULL AFTER registration_link'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'maximum_count'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN maximum_count INT NULL AFTER selected_resources'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'applied_count'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN applied_count INT NULL AFTER maximum_count'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'apply_by_student'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN apply_by_student BOOLEAN NOT NULL DEFAULT TRUE AFTER applied_count'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'registration_mode'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN registration_mode ENUM(''TEAM'',''INDIVIDUAL'') NOT NULL DEFAULT ''TEAM'' AFTER apply_by_student'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'eligible_for_rewards'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN eligible_for_rewards BOOLEAN NOT NULL DEFAULT FALSE AFTER status'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'winner_rewards'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN winner_rewards TEXT NULL AFTER eligible_for_rewards'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @events_schema AND TABLE_NAME = 'events' AND COLUMN_NAME = 'reward_allocation'
  ),
  'SELECT 1',
  'ALTER TABLE events ADD COLUMN reward_allocation TEXT NULL AFTER winner_rewards'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- If teams table already exists from previous setup, run this migration manually:
-- ALTER TABLE teams
--   ADD COLUMN event_id INT NULL AFTER team_id,
--   ADD KEY idx_teams_event_status (event_id, status),
--   ADD CONSTRAINT fk_teams_event
--     FOREIGN KEY (event_id) REFERENCES events(event_id)
--     ON UPDATE CASCADE ON DELETE SET NULL;

