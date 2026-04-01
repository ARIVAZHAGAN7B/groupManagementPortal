CREATE TABLE IF NOT EXISTS phases (
  phase_id VARCHAR(36) NOT NULL,
  phase_name VARCHAR(150) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_working_days INT NOT NULL,
  change_day_number INT NOT NULL,
  change_day DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  status ENUM('ACTIVE','INACTIVE','COMPLETED') NOT NULL DEFAULT 'INACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (phase_id),
  KEY idx_phases_status_window (status, start_date, end_date),
  KEY idx_phases_start (start_date, start_time),
  KEY idx_phases_end (end_date, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS phase_targets (
  id BIGINT NOT NULL AUTO_INCREMENT,
  phase_id VARCHAR(36) NOT NULL,
  tier ENUM('D','C','B','A') NOT NULL,
  group_target INT NOT NULL,
  individual_target INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_phase_targets_phase_tier (phase_id, tier),
  KEY idx_phase_targets_phase (phase_id),
  CONSTRAINT fk_phase_targets_phase
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS individual_phase_target (
  id BIGINT NOT NULL AUTO_INCREMENT,
  phase_id VARCHAR(36) NOT NULL,
  target INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_individual_phase_target_phase (phase_id),
  CONSTRAINT fk_individual_phase_target_phase
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS phase_end_jobs (
  job_id BIGINT NOT NULL AUTO_INCREMENT,
  phase_id VARCHAR(36) NOT NULL,
  run_at DATETIME NOT NULL,
  status ENUM('PENDING','RUNNING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  locked_by VARCHAR(120) NULL,
  locked_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (job_id),
  UNIQUE KEY uniq_phase_end_jobs_phase (phase_id),
  KEY idx_phase_end_jobs_status_run_at (status, run_at),
  CONSTRAINT fk_phase_end_jobs_phase
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

