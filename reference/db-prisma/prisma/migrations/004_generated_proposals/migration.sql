-- Migration: 004_generated_proposals
-- Adds the generated_proposals table for AI-generated design proposal PDFs.

-- New enums
CREATE TYPE "GeneratedProposalStatus" AS ENUM (
  'generating',
  'ready',
  'sent',
  'failed'
);

CREATE TYPE "ProposalTemplate" AS ENUM (
  'classic',
  'modern',
  'minimal'
);

-- New table
CREATE TABLE "generated_proposals" (
  "id"           TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "projectId"    TEXT NOT NULL,
  "clientId"     TEXT,
  "assetId"      TEXT,
  "template"     "ProposalTemplate"        NOT NULL DEFAULT 'classic',
  "status"       "GeneratedProposalStatus" NOT NULL DEFAULT 'generating',
  "version"      INTEGER NOT NULL DEFAULT 1,
  "proposalData" JSONB,
  "pdfUrl"       TEXT,
  "sentAt"       TIMESTAMP(3),
  "feedbackNote" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "generated_proposals_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "generated_proposals_tenantId_idx" ON "generated_proposals"("tenantId");
CREATE INDEX "generated_proposals_projectId_idx" ON "generated_proposals"("projectId");

-- Foreign keys
ALTER TABLE "generated_proposals"
  ADD CONSTRAINT "generated_proposals_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generated_proposals"
  ADD CONSTRAINT "generated_proposals_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "generated_proposals"
  ADD CONSTRAINT "generated_proposals_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
