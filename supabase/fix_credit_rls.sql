-- ============================================
-- FIX: Remove write policies from ai_usage and ai_messages
-- Users should ONLY be able to READ their credit data.
-- All writes go through service role key (server-side).
-- Run this in Supabase SQL Editor, then delete this file.
-- ============================================

-- Remove dangerous write policies from ai_usage
DROP POLICY IF EXISTS "Users can insert own usage" ON ai_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON ai_usage;

-- Remove dangerous write policy from ai_messages
DROP POLICY IF EXISTS "Users can insert own messages" ON ai_messages;
