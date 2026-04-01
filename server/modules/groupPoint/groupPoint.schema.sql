CREATE TABLE IF NOT EXISTS group_points (
  group_point_id BIGINT NOT NULL AUTO_INCREMENT,
  student_id VARCHAR(36) NOT NULL,
  group_id INT NOT NULL,
  membership_id INT NOT NULL,
  points INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_point_id),
  KEY idx_group_points_student (student_id, created_at),
  KEY idx_group_points_group (group_id, created_at),
  KEY idx_group_points_membership (membership_id, created_at),
  KEY idx_group_points_group_membership_created (group_id, membership_id, created_at),
  CONSTRAINT fk_group_points_student
    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_group_points_group
    FOREIGN KEY (group_id)
    REFERENCES sgroup(group_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_group_points_membership
    FOREIGN KEY (membership_id)
    REFERENCES memberships(membership_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

