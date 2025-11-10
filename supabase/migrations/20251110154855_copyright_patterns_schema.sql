-- Create enum types
CREATE TYPE pattern_type AS ENUM ('exact', 'fuzzy', 'regex');
CREATE TYPE severity_level AS ENUM ('severe', 'moderate', 'minor');
CREATE TYPE category_type AS ENUM ('character', 'brand', 'trademark', 'artwork', 'style');

-- Create copyright_patterns table
CREATE TABLE copyright_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  pattern_type pattern_type NOT NULL DEFAULT 'exact',
  severity severity_level NOT NULL,
  category category_type NOT NULL,
  replacement_suggestion TEXT,
  explanation TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english', pattern || ' ' || COALESCE(explanation, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_copyright_patterns_fts ON copyright_patterns USING GIN(fts);
CREATE INDEX idx_copyright_patterns_severity ON copyright_patterns(severity) WHERE active = true;
CREATE INDEX idx_copyright_patterns_category ON copyright_patterns(category) WHERE active = true;
CREATE INDEX idx_copyright_patterns_pattern_type ON copyright_patterns(pattern_type) WHERE active = true;

-- Enable Row Level Security
ALTER TABLE copyright_patterns ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (anyone can read active patterns)
CREATE POLICY "Allow public read for active patterns" ON copyright_patterns
  FOR SELECT
  USING (active = true);

-- Create policy for insert/update/delete (service role only)
CREATE POLICY "Allow service role full access" ON copyright_patterns
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert seed data
INSERT INTO copyright_patterns (pattern, pattern_type, severity, category, replacement_suggestion, explanation) VALUES
  -- Characters (Severe)
  ('Mickey Mouse', 'exact', 'severe', 'character', 'cartoon mouse', 'Disney trademark character - cannot be used without permission'),
  ('Donald Duck', 'exact', 'severe', 'character', 'cartoon duck', 'Disney trademark character - protected intellectual property'),
  ('Harry Potter', 'exact', 'severe', 'character', 'young wizard', 'Warner Bros. copyrighted character - highly protected IP'),
  ('Hermione Granger', 'exact', 'severe', 'character', 'intelligent wizard student', 'Harry Potter character - protected by copyright'),
  ('Spider-Man', 'exact', 'severe', 'character', 'web-slinging superhero', 'Marvel character - trademarked and copyrighted'),
  ('Batman', 'exact', 'severe', 'character', 'vigilante hero', 'DC Comics character - protected trademark'),
  ('Superman', 'exact', 'severe', 'character', 'caped superhero', 'DC Comics character - iconic trademark'),
  ('Pikachu', 'exact', 'severe', 'character', 'electric creature', 'Pokemon character - Nintendo/Game Freak trademark'),
  ('Mario', 'exact', 'severe', 'character', 'mustachioed plumber', 'Nintendo trademark character'),
  ('Darth Vader', 'exact', 'severe', 'character', 'dark warrior', 'Star Wars character - Lucasfilm/Disney IP'),

  -- Brands & Trademarks (Moderate to Severe)
  ('Disney', 'exact', 'severe', 'brand', 'animated entertainment style', 'Disney brand name - cannot use directly'),
  ('Marvel', 'exact', 'moderate', 'brand', 'superhero universe', 'Marvel Entertainment trademark'),
  ('DC Comics', 'exact', 'moderate', 'brand', 'comic book style', 'DC Comics brand trademark'),
  ('Nintendo', 'exact', 'moderate', 'brand', 'video game style', 'Nintendo Corporation trademark'),
  ('Pixar', 'exact', 'moderate', 'brand', '3D animated style', 'Pixar Animation Studios trademark'),

  -- Art Styles (Moderate)
  ('Disney style', 'fuzzy', 'moderate', 'style', 'animated fairy tale style', 'Disney artistic style - avoid direct association'),
  ('Marvel style', 'fuzzy', 'moderate', 'style', 'comic book illustration', 'Marvel artistic style - use generic alternative'),
  ('Pixar style', 'fuzzy', 'moderate', 'style', '3D computer animation', 'Pixar artistic style - trademark protected'),

  -- Famous Artworks (Minor to Moderate)
  ('Mona Lisa', 'exact', 'minor', 'artwork', 'Renaissance portrait', 'Famous Da Vinci painting - exact replica may have restrictions'),
  ('Starry Night', 'exact', 'minor', 'artwork', 'swirling night sky painting', 'Van Gogh artwork - public domain but avoid exact copies'),
  ('The Scream', 'exact', 'minor', 'artwork', 'expressionist figure painting', 'Munch artwork - recognizable copyrighted composition'),

  -- Franchises & Universes
  ('Hogwarts', 'exact', 'severe', 'brand', 'magical school', 'Harry Potter location - Warner Bros. IP'),
  ('Gotham City', 'exact', 'moderate', 'brand', 'dark urban setting', 'Batman location - DC Comics IP'),
  ('Middle-earth', 'exact', 'severe', 'brand', 'fantasy realm', 'Tolkien estate trademark'),

  -- Living Artists (Severe - special consideration)
  ('in the style of Banksy', 'fuzzy', 'severe', 'style', 'street art style', 'Living artist - do not mimic specific style'),
  ('like Banksy', 'fuzzy', 'severe', 'style', 'urban graffiti style', 'Living artist - avoid direct style references'),

  -- Additional Protected Terms
  ('Star Wars', 'exact', 'severe', 'brand', 'space opera', 'Lucasfilm trademark - cannot use'),
  ('Pokemon', 'exact', 'severe', 'brand', 'creature collection', 'Nintendo/Game Freak trademark'),
  ('Lord of the Rings', 'exact', 'severe', 'brand', 'epic fantasy', 'Tolkien estate trademark'),
  ('Game of Thrones', 'exact', 'severe', 'brand', 'medieval fantasy', 'HBO trademark')
;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_copyright_patterns_updated_at BEFORE UPDATE
  ON copyright_patterns FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create optional analytics table for tracking prompt checks
CREATE TABLE IF NOT EXISTS prompt_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ip TEXT,
  original_prompt TEXT NOT NULL,
  violations_found INTEGER DEFAULT 0,
  max_severity severity_level,
  rewritten BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_checks_created_at ON prompt_checks(created_at);
