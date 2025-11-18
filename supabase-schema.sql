-- Red Rocks Sections Table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  section_code TEXT NOT NULL,
  category TEXT NOT NULL, -- 'front', 'center', 'back', 'ga'
  current_image_url TEXT,
  row_info TEXT,
  price INTEGER NOT NULL,
  deal_badge TEXT, -- 'cheapest', 'amazing', 'great', null
  value_badge TEXT, -- 'TOP 1% VALUE', 'TOP 5% VALUE', null
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts Table (stores base prompts and iterations)
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Images Table
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  model_name TEXT NOT NULL, -- e.g., 'dall-e-3', 'stable-diffusion-xl', etc.
  model_provider TEXT NOT NULL, -- e.g., 'openai', 'replicate', 'fal', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  generation_settings JSONB, -- store all generation params
  comparison_notes TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial Red Rocks sections
INSERT INTO sections (name, section_code, category, row_info, price, deal_badge, value_badge) VALUES
  ('Front Left', 'FL', 'front', 'Row GA', 245, 'cheapest', 'TOP 1% VALUE'),
  ('Front Center', 'FC', 'front', 'Row GA', 289, 'amazing', 'TOP 5% VALUE'),
  ('Front Right', 'FR', 'front', 'Row GA', 245, 'amazing', 'TOP 5% VALUE'),
  ('Left', 'L', 'center', 'Row 20', 195, null, null),
  ('Center Left', 'CL', 'center', 'Row 25', 195, 'great', null),
  ('Center Right', 'CR', 'center', 'Row 25', 195, 'great', null),
  ('Right', 'R', 'center', 'Row 20', 195, null, null),
  ('Back Left', 'BL', 'back', 'Row 55', 145, null, null),
  ('Back Center Left', 'BCL', 'back', 'Row 60', 155, null, null),
  ('Back Center Right', 'BCR', 'back', 'Row 60', 155, null, null),
  ('Back Right', 'BR', 'back', 'Row 55', 145, null, null),
  ('General Admission', 'GA1', 'ga', 'Row GA', 209, 'great', null),
  ('General Admission 2', 'GA2', 'ga', 'Row GA', 209, null, null),
  ('Standing Room Only', 'SRO', 'back', null, 125, null, null);

-- Insert base prompts for each section
INSERT INTO prompts (section_id, prompt_text, negative_prompt, version, is_active)
SELECT
  id,
  CASE
    WHEN section_code = 'FL' THEN 'Professional concert photography, view from front left section of Red Rocks Amphitheatre looking toward illuminated stage, packed sold-out crowd, stunning golden hour sunset sky with pink and purple clouds, dramatic stage lighting with colorful beams cutting through dusk atmosphere, massive LED screens, natural red sandstone rock formations framing the venue, slightly angled perspective from left side showing stage and crowd, magical ethereal atmosphere, professional photography, 8k quality, cinematic lighting, vibrant colors, concert atmosphere'
    WHEN section_code = 'FC' THEN 'Professional concert photography, center front view of Red Rocks Amphitheatre stage, perfectly symmetrical composition, massive packed crowd, breathtaking sunset sky with vibrant orange and pink gradients, spectacular stage lighting with multicolor LED screens and light beams, natural red rock walls on both sides, front row perspective looking straight at stage, sold-out show energy, magical golden hour lighting, professional photography, 8k quality, cinematic, vivid colors, epic concert moment'
    WHEN section_code = 'FR' THEN 'Professional concert photography, view from front right section of Red Rocks Amphitheatre toward stage, densely packed concert crowd, stunning twilight sky with deep purple and amber sunset colors, dramatic concert lighting with colorful stage lights and LED displays, natural sandstone formations on right side, slightly angled view from right showing full stage and crowd, magical dusk atmosphere, professional photography, 8k quality, cinematic lighting, rich colors, electrifying concert vibe'
    WHEN section_code = 'L' THEN 'Professional concert photography, mid-distance view from left section of Red Rocks Amphitheatre, elevated perspective looking toward illuminated stage, sea of concertgoers packed together, gorgeous sunset sky with pink and orange hues, dynamic stage lighting with colorful beams, natural red rock formation prominent on left side, diagonal view showing depth and scale of venue, golden hour magic, professional photography, 8k quality, atmospheric, warm sunset tones, incredible concert energy'
    WHEN section_code = 'CL' THEN 'Professional concert photography, center-left view of Red Rocks Amphitheatre concert, elevated mid-venue perspective looking at stage, massive sold-out crowd filling every seat, stunning twilight sky with purple and pink sunset gradients, spectacular stage lighting with LED screens and light beams, natural red sandstone rocks framing venue, slightly off-center composition from left showing venue depth, magical dusk atmosphere, professional photography, 8k quality, cinematic, vibrant sunset colors, epic scale'
    WHEN section_code = 'CR' THEN 'Professional concert photography, center-right view of Red Rocks Amphitheatre during concert, elevated mid-venue angle toward illuminated stage, densely packed audience, breathtaking sunset sky with amber and magenta clouds, dynamic concert lighting with colorful stage lights and massive LED displays, natural red rock formations visible, slightly off-center right composition showing venue scale, golden hour glow, professional photography, 8k quality, cinematic atmosphere, warm vibrant colors, sold-out show energy'
    WHEN section_code = 'R' THEN 'Professional concert photography, mid-distance view from right section of Red Rocks Amphitheatre, elevated perspective toward stage, sea of concert attendees, stunning sunset sky with deep orange and purple hues, dramatic stage lighting with colorful beams cutting through atmosphere, natural sandstone formation prominent on right, diagonal angle showing venue depth and crowd scale, magical twilight lighting, professional photography, 8k quality, atmospheric, rich sunset tones, electrifying concert atmosphere'
    WHEN section_code = 'BL' THEN 'Professional concert photography, elevated rear view from back left section of Red Rocks Amphitheatre, sweeping perspective over entire packed crowd toward distant illuminated stage, spectacular sunset sky with pink and purple clouds, stage lighting visible in distance with colorful LED screens, natural red rock formations towering on left, diagonal high angle showing full venue scale, magical golden hour atmosphere, professional photography, 8k quality, epic wide shot, warm sunset colors, massive sold-out crowd'
    WHEN section_code = 'BCL' THEN 'Professional concert photography, elevated rear center-left view of Red Rocks Amphitheatre concert, high angle overlooking thousands of concertgoers toward distant stage, breathtaking twilight sky with vibrant orange and magenta gradient, stage lighting and LED screens glowing in distance, natural red sandstone walls framing venue, slightly left of center high perspective showing massive venue scale, ethereal dusk lighting, professional photography, 8k quality, cinematic wide shot, rich sunset hues, incredible concert atmosphere'
    WHEN section_code = 'BCR' THEN 'Professional concert photography, elevated rear center-right view of Red Rocks Amphitheatre, high angle over sea of concertgoers toward illuminated stage below, stunning sunset sky with purple and amber clouds, colorful stage lighting and massive LED displays visible, natural red rock formations on both sides, slightly right of center elevated perspective showing venue grandeur, magical golden hour glow, professional photography, 8k quality, epic wide composition, warm vibrant sunset colors, sold-out show scale'
    WHEN section_code = 'BR' THEN 'Professional concert photography, elevated rear view from back right section of Red Rocks Amphitheatre, sweeping high angle over packed crowd toward distant stage, spectacular twilight sky with deep purple and orange sunset, stage lighting and LED screens glowing far below, natural sandstone formation towering on right side, diagonal elevated perspective showing full venue majesty, magical dusk atmosphere, professional photography, 8k quality, dramatic wide shot, rich sunset tones, massive concert crowd'
    WHEN section_code = 'GA1' THEN 'Professional concert photography, immersive ground-level view from general admission pit area at Red Rocks Amphitheatre, dense crowd around, looking up toward towering illuminated stage, stunning sunset sky with pink and orange clouds above stage, spectacular close-up of stage lighting with colorful beams and LED screens, natural red rocks visible on sides, energetic front section perspective showing stage power, golden hour magic, professional photography, 8k quality, dynamic angle, vibrant sunset colors, electric concert energy'
    WHEN section_code = 'GA2' THEN 'Professional concert photography, ground-level view from general admission area at Red Rocks Amphitheatre, surrounded by packed crowd, facing illuminated concert stage, breathtaking twilight sky with purple and amber gradients, dramatic stage lighting with multicolor LED displays and light beams overhead, natural sandstone formations flanking venue, immersive crowd-level perspective showing stage intensity, magical dusk atmosphere, professional photography, 8k quality, energetic composition, warm sunset hues, sold-out show vibe'
    ELSE 'Professional concert photography, elevated standing room view from upper rear of Red Rocks Amphitheatre, high vantage point overlooking entire packed venue toward distant illuminated stage, spectacular sunset sky with vibrant pink and orange clouds, stage lighting and massive LED screens glowing far below, natural red rock formations creating dramatic amphitheater bowl, wide elevated perspective showing full majesty of sold-out show, ethereal golden hour lighting, professional photography, 8k quality, breathtaking wide shot, rich sunset colors, epic concert scale'
  END as prompt_text,
  'blurry, low quality, distorted, amateur, empty venue, daytime, harsh shadows, overexposed, underexposed, noise, grainy, artifacts, cartoonish, painting, illustration, drawing, amateur photography',
  1,
  true
FROM sections;

-- Create indexes for better performance
CREATE INDEX idx_sections_category ON sections(category);
CREATE INDEX idx_prompts_section_id ON prompts(section_id);
CREATE INDEX idx_prompts_is_active ON prompts(is_active);
CREATE INDEX idx_generated_images_section_id ON generated_images(section_id);
CREATE INDEX idx_generated_images_status ON generated_images(status);
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, restrict later with auth)
CREATE POLICY "Allow all for sections" ON sections FOR ALL USING (true);
CREATE POLICY "Allow all for prompts" ON prompts FOR ALL USING (true);
CREATE POLICY "Allow all for generated_images" ON generated_images FOR ALL USING (true);
