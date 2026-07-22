CREATE TABLE IF NOT EXISTS hubs (
  hub_id INT NOT NULL AUTO_INCREMENT,
  hub_code VARCHAR(50) NOT NULL,
  hub_name VARCHAR(150) NOT NULL,
  hub_priority ENUM('PROMINENT','MEDIUM','LOW') NOT NULL,
  status ENUM('ACTIVE','INACTIVE','FROZEN','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  description VARCHAR(255) NULL,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (hub_id),
  UNIQUE KEY uq_hubs_code (hub_code),
  KEY idx_hubs_priority_status (hub_priority, status),
  KEY idx_hubs_status_name (status, hub_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS hub_membership (
  hub_membership_id INT NOT NULL AUTO_INCREMENT,
  hub_id INT NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  status ENUM('ACTIVE','LEFT') NOT NULL DEFAULT 'ACTIVE',
  join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leave_date DATETIME NULL,
  assigned_by VARCHAR(36) NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (hub_membership_id),
  KEY idx_hub_membership_hub_status (hub_id, status),
  KEY idx_hub_membership_student_status (student_id, status),
  CONSTRAINT fk_hub_membership_hub
    FOREIGN KEY (hub_id) REFERENCES hubs(hub_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hub_membership_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS event_hub_access (
  event_id INT NOT NULL,
  hub_id INT NOT NULL,
  PRIMARY KEY (event_id, hub_id),
  KEY idx_event_hub_access_hub (hub_id),
  CONSTRAINT fk_event_hub_access_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_event_hub_access_hub
    FOREIGN KEY (hub_id) REFERENCES hubs(hub_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
