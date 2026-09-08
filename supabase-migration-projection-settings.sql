-- Pokročilé (volitelné) nastavení Optimistické projekce v grafu "Jak rosteš v čase".
-- Sbaleno do jednoho jsonb sloupce místo řady samostatných — jde o desítky vzájemně
-- souvisejících "kohoutků" simulace, ne o obecná data profilu.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS projection_settings jsonb;
