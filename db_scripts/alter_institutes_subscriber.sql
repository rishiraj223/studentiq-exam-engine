ALTER TABLE institutes ADD COLUMN IF NOT EXISTS subscriber_type TEXT NOT NULL DEFAULT 'institute' CHECK (subscriber_type IN ('institute', 'student'));
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS standard TEXT;
