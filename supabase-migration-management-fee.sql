ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS management_fee integer DEFAULT NULL;
