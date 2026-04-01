CREATE TABLE IF NOT EXISTS base_points (
  student_id VARCHAR(36) PRIMARY KEY,
  total_base_points INT NOT NULL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_base_student_id
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS base_point_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  activity_date DATE NOT NULL,
  activity_at DATETIME NULL,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_base_point_history_student_date (student_id, activity_date),
  INDEX idx_base_point_history_student_activity_at (student_id, activity_at),
  CONSTRAINT fk_history_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS individual_eligibility (
  eligibility_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  phase_id VARCHAR(36) NOT NULL,
  this_phase_base_points INT NOT NULL,
  is_eligible BOOLEAN NOT NULL,
  reason_code VARCHAR(50),
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_student_phase (student_id, phase_id),
  INDEX idx_individual_eligibility_phase_student_status (phase_id, student_id, is_eligible),
  CONSTRAINT fk_individual_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_individual_phase_id
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS group_eligibility (
  eligibility_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  phase_id VARCHAR(36) NOT NULL,
  this_phase_group_points INT NOT NULL,
  is_eligible BOOLEAN NOT NULL,
  reason_code VARCHAR(50),
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_group_phase (group_id, phase_id),
  INDEX idx_group_eligibility_phase_group_status (phase_id, group_id, is_eligible),
  CONSTRAINT fk_eligible_group_id
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_group_phase_id
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS individual_eligibility_points (
  point_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  phase_id VARCHAR(36) NOT NULL,
  source_base_points INT NOT NULL DEFAULT 0,
  multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.20,
  is_eligible BOOLEAN NOT NULL DEFAULT 0,
  awarded_points DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_individual_points_student_phase (student_id, phase_id),
  INDEX idx_individual_points_phase (phase_id),
  INDEX idx_individual_points_student_multiplier (student_id, is_eligible, multiplier),
  CONSTRAINT fk_individual_points_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_individual_points_phase
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS individual_eligibility_point_totals (
  student_id VARCHAR(36) PRIMARY KEY,
  total_points DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_individual_point_totals_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS group_eligibility_points (
  point_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  phase_id VARCHAR(36) NOT NULL,
  source_group_points INT NOT NULL DEFAULT 0,
  applied_tier VARCHAR(10) DEFAULT NULL,
  multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  is_eligible BOOLEAN NOT NULL DEFAULT 0,
  awarded_points DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_group_points_group_phase (group_id, phase_id),
  INDEX idx_group_points_phase (phase_id),
  INDEX idx_group_points_group_multiplier (group_id, is_eligible, multiplier),
  CONSTRAINT fk_group_eligibility_points_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_group_eligibility_points_phase
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS group_eligibility_point_totals (
  group_id INT PRIMARY KEY,
  total_points DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_point_totals_group
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

