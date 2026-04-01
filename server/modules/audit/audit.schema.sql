CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id BIGINT NOT NULL AUTO_INCREMENT,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(120) NULL,
  actor_user_id VARCHAR(64) NULL,
  actor_role VARCHAR(60) NULL,
  reason_code VARCHAR(120) NULL,
  details_json LONGTEXT NULL,
  ip_address VARCHAR(128) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id),
  KEY idx_audit_created_at (created_at),
  KEY idx_audit_action (action),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_actor (actor_user_id, actor_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

