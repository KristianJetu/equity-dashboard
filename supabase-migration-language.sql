-- Jazyková preference uživatele (zatím jen uloženo, UI se ještě nepřekládá)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'cs' CHECK (language IN ('cs', 'en'));
