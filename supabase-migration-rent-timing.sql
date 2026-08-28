-- Přidá sloupec rent_timing na tabulku properties
-- 'advance' = nájem placen měsíc předem (výchozí pro většinu nemovitostí)
-- 'current' = nájem placen v tom samém měsíci (výjimka: Zahálka/Hauser)

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS rent_timing text DEFAULT 'advance'
  CHECK (rent_timing IN ('advance', 'current'));
