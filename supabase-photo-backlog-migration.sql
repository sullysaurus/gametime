-- Photo Backlog Table
-- This table stores uploaded photos in a waiting area before they are assigned to sections
CREATE TABLE photo_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT, -- Optional smaller preview
  original_filename TEXT,
  file_size INTEGER, -- in bytes
  width INTEGER,
  height INTEGER,
  notes TEXT, -- Admin notes about the photo
  tags TEXT[], -- Optional tags for organization
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_photo_backlog_uploaded_at ON photo_backlog(uploaded_at DESC);
CREATE INDEX idx_photo_backlog_tags ON photo_backlog USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE photo_backlog ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all for now, restrict later with auth)
CREATE POLICY "Allow all for photo_backlog" ON photo_backlog FOR ALL USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_photo_backlog_updated_at
    BEFORE UPDATE ON photo_backlog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
