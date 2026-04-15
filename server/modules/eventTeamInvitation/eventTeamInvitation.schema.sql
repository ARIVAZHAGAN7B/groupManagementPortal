CREATE TABLE IF NOT EXISTS event_team_invitations (
  invitation_id BIGINT NOT NULL AUTO_INCREMENT,
  event_id INT NOT NULL,
  team_id INT NOT NULL,
  inviter_student_id VARCHAR(36) NOT NULL,
  invitee_student_id VARCHAR(36) NOT NULL,
  proposed_role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  status ENUM('PENDING','ACCEPTED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL DEFAULT NULL,
  response_note VARCHAR(255) NULL,
  PRIMARY KEY (invitation_id),
  KEY idx_event_team_invitations_invitee_status (invitee_student_id, status),
  KEY idx_event_team_invitations_team_status (team_id, status),
  KEY idx_event_team_invitations_event_status (event_id, status),
  CONSTRAINT fk_event_team_invitations_event
    FOREIGN KEY (event_id)
    REFERENCES events(event_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_event_team_invitations_team
    FOREIGN KEY (team_id)
    REFERENCES teams(team_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_event_team_invitations_inviter
    FOREIGN KEY (inviter_student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_event_team_invitations_invitee
    FOREIGN KEY (invitee_student_id)
    REFERENCES students(student_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
