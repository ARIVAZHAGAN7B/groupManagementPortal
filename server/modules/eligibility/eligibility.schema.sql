USE test;

CREATE TABLE IF NOT EXISTS base_points (
  student_id VARCHAR(36) PRIMARY KEY,
  total_base_points INT NOT NULL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_base_student_id
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS base_point_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  activity_date DATE NOT NULL,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_date (student_id, activity_date),
  CONSTRAINT fk_history_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS individual_eligibility (
  eligibility_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  phase_id VARCHAR(36) NOT NULL,
  this_phase_base_points INT NOT NULL,
  is_eligible BOOLEAN NOT NULL,
  reason_code VARCHAR(50),
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_student_phase (student_id, phase_id),
  CONSTRAINT fk_individual_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_individual_phase_id
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS group_eligibility (
  eligibility_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  phase_id VARCHAR(36) NOT NULL,
  this_phase_group_points INT NOT NULL,
  is_eligible BOOLEAN NOT NULL,
  reason_code VARCHAR(50),
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_group_phase (group_id, phase_id),
  CONSTRAINT fk_eligible_group_id
    FOREIGN KEY (group_id)
    REFERENCES Sgroup(group_id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_group_phase_id
    FOREIGN KEY (phase_id)
    REFERENCES phases(phase_id)
    ON UPDATE CASCADE
);
