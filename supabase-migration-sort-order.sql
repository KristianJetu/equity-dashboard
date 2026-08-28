-- Přidá sort_order pro řazení nemovitostí přetahováním
-- Existující nemovitosti dostanou pořadí dle created_at

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS sort_order integer;

UPDATE properties
SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
  FROM properties
) sub
WHERE properties.id = sub.id;
