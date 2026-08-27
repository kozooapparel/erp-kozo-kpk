-- Migration: Add stage completion tracking fields
-- These fields allow admin to manually mark stages as complete

-- Add completion tracking fields for manual stages
ALTER TABLE orders ADD COLUMN IF NOT EXISTS layout_completed BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_ready BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_completed BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sewing_completed BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packing_completed BOOLEAN DEFAULT false;

-- Add timestamp fields for tracking when each stage was completed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS layout_completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_ready_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sewing_completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packing_completed_at TIMESTAMPTZ;
