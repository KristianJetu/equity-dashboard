-- Volitelný finanční profil uživatele — jen pro Optimistickou projekci
-- (DTI/DSTI + maximální délka budoucích úvěrů podle věku) v grafu "Jak rosteš v čase".
-- Nepoužívá se nikde jinde v appce.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_year integer,
  ADD COLUMN IF NOT EXISTS income_employment numeric,
  ADD COLUMN IF NOT EXISTS income_other numeric,
  ADD COLUMN IF NOT EXISTS dti_projection_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS household_costs numeric,
  ADD COLUMN IF NOT EXISTS assumed_ltv_pct numeric NOT NULL DEFAULT 70;
