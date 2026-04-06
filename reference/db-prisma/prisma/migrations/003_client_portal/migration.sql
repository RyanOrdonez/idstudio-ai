-- Migration: 003_client_portal
-- Adds: tags column on clients, ClientPortalSession, ProposalApproval

-- ── ProposalStatus enum ───────────────────────────────────────────────────────
CREATE TYPE "ProposalStatus" AS ENUM (
  'pending_approval',
  'approved',
  'revision_requested'
);

-- ── tags column on clients ───────────────────────────────────────────────────
ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';

-- ── client_portal_sessions ───────────────────────────────────────────────────
CREATE TABLE "client_portal_sessions" (
  "id"         TEXT         NOT NULL,
  "tenantId"   TEXT         NOT NULL,
  "clientId"   TEXT         NOT NULL,
  "email"      TEXT         NOT NULL,
  "token"      TEXT         NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "usedAt"     TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "client_portal_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_portal_sessions_token_key" UNIQUE ("token"),
  CONSTRAINT "client_portal_sessions_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "client_portal_sessions_tenantId_idx" ON "client_portal_sessions"("tenantId");
CREATE INDEX "client_portal_sessions_clientId_idx" ON "client_portal_sessions"("clientId");

-- ── proposal_approvals ───────────────────────────────────────────────────────
CREATE TABLE "proposal_approvals" (
  "id"        TEXT             NOT NULL,
  "tenantId"  TEXT             NOT NULL,
  "projectId" TEXT             NOT NULL,
  "assetId"   TEXT             NOT NULL,
  "clientId"  TEXT             NOT NULL,
  "status"    "ProposalStatus" NOT NULL DEFAULT 'pending_approval',
  "comment"   TEXT,
  "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "proposal_approvals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "proposal_approvals_assetId_clientId_key" UNIQUE ("assetId", "clientId"),
  CONSTRAINT "proposal_approvals_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proposal_approvals_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proposal_approvals_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "proposal_approvals_tenantId_idx" ON "proposal_approvals"("tenantId");
CREATE INDEX "proposal_approvals_projectId_idx" ON "proposal_approvals"("projectId");

-- ── RLS for new tables ───────────────────────────────────────────────────────
ALTER TABLE "client_portal_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proposal_approvals"     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "client_portal_sessions"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

CREATE POLICY "tenant_isolation" ON "proposal_approvals"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
