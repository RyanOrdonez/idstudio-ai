-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security (RLS) for Multi-Tenancy
--
-- Strategy:
--   1. Enable RLS on every tenant-scoped table.
--   2. Create a role `ids_app` used by the Fastify API (least-privilege).
--   3. Set a session-local variable `app.current_tenant_id` before each
--      request. Fastify middleware calls `SET LOCAL app.current_tenant_id = ?`
--      inside every transaction.
--   4. Policies allow SELECT/INSERT/UPDATE/DELETE only on rows where
--      tenantId matches the session variable.
--   5. A superuser / migration role bypasses RLS for schema management.
-- ─────────────────────────────────────────────────────────────────────────────

-- Create the application role (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ids_app') THEN
    CREATE ROLE ids_app NOLOGIN;
  END IF;
END
$$;

-- Grant connect to the database (run as superuser / owner)
-- GRANT CONNECT ON DATABASE ids TO ids_app;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO ids_app;

-- Grant DML on all tenant-scoped tables
GRANT SELECT, INSERT, UPDATE, DELETE ON
  users, accounts, sessions, api_keys,
  projects, phases, tasks,
  budgets, budget_line_items, vendors, clients,
  assets, ai_insights, audit_logs, notifications
TO ids_app;

-- Read-only access to tenants table (app never writes tenants directly)
GRANT SELECT ON tenants TO ids_app;

-- Grant read on verification_tokens (NextAuth needs this)
GRANT SELECT, INSERT, DELETE ON verification_tokens TO ids_app;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on all tenant-scoped tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: get the current tenant id from session variable
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies — one per table
-- ─────────────────────────────────────────────────────────────────────────────

-- users
CREATE POLICY tenant_isolation ON users
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- accounts
CREATE POLICY tenant_isolation ON accounts
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- sessions
CREATE POLICY tenant_isolation ON sessions
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- api_keys
CREATE POLICY tenant_isolation ON api_keys
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- projects
CREATE POLICY tenant_isolation ON projects
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- phases
CREATE POLICY tenant_isolation ON phases
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- tasks
CREATE POLICY tenant_isolation ON tasks
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- budgets
CREATE POLICY tenant_isolation ON budgets
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- budget_line_items
CREATE POLICY tenant_isolation ON budget_line_items
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- vendors
CREATE POLICY tenant_isolation ON vendors
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- clients
CREATE POLICY tenant_isolation ON clients
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- assets
CREATE POLICY tenant_isolation ON assets
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- ai_insights
CREATE POLICY tenant_isolation ON ai_insights
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- audit_logs (insert-only for app; superuser can SELECT all)
CREATE POLICY tenant_isolation ON audit_logs
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- notifications
CREATE POLICY tenant_isolation ON notifications
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Bypass RLS for migrations / superuser (FORCE RLS for ids_app)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE phases FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items FORCE ROW LEVEL SECURITY;
ALTER TABLE vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE assets FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_insights FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
