-- Platform admin team (database-backed, complements PLATFORM_ADMIN_EMAILS env var)
CREATE TABLE IF NOT EXISTS platform_admin_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  invited_by VARCHAR(255),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  status VARCHAR(40) NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS platform_admin_members_status_idx ON platform_admin_members (status);

-- Admin audit security enhancements
ALTER TABLE admin_audit_events ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE admin_audit_events ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE admin_audit_events ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);
ALTER TABLE admin_audit_events ADD COLUMN IF NOT EXISTS event_hash VARCHAR(64);
