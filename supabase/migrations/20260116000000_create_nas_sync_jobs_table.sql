-- Migration: Create nas_sync_jobs table for tracking NAS synchronization jobs
-- This table tracks the status and progress of NAS file synchronization

CREATE TABLE IF NOT EXISTS nas_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'processing', 'completed', 'partial', 'error')),
  total_files INTEGER NOT NULL DEFAULT 0,
  processed_files INTEGER NOT NULL DEFAULT 0,
  new_files INTEGER NOT NULL DEFAULT 0,
  modified_files INTEGER NOT NULL DEFAULT 0,
  deleted_files INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying recent jobs
CREATE INDEX idx_nas_sync_jobs_started_at ON nas_sync_jobs(started_at DESC);
CREATE INDEX idx_nas_sync_jobs_status ON nas_sync_jobs(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_nas_sync_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nas_sync_jobs_updated_at
  BEFORE UPDATE ON nas_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_nas_sync_jobs_updated_at();

-- RLS policies
ALTER TABLE nas_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage nas_sync_jobs"
  ON nas_sync_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view jobs
CREATE POLICY "Authenticated users can view nas_sync_jobs"
  ON nas_sync_jobs
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE nas_sync_jobs IS 'Tracks NAS file synchronization job progress and status';
COMMENT ON COLUMN nas_sync_jobs.status IS 'Job status: pending, scanning, processing, completed, partial, error';
COMMENT ON COLUMN nas_sync_jobs.total_files IS 'Total number of files found during scan';
COMMENT ON COLUMN nas_sync_jobs.processed_files IS 'Number of files processed so far';
COMMENT ON COLUMN nas_sync_jobs.new_files IS 'Number of new files added';
COMMENT ON COLUMN nas_sync_jobs.modified_files IS 'Number of modified files updated';
COMMENT ON COLUMN nas_sync_jobs.deleted_files IS 'Number of document chunks deleted (orphans)';
COMMENT ON COLUMN nas_sync_jobs.errors IS 'Array of error messages encountered during sync';
