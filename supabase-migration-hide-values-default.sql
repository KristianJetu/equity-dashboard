-- Výchozí stav skrývání částek (majetek, hodnota portfolia, dluh) při otevření aplikace.
-- Ikonka oka u hero karty mění jen zobrazení v aktuální session/prohlížeči (localStorage);
-- tenhle sloupec řídí, s čím se má appka otevřít, když si to uživatel v Nastavení sám nastaví.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hide_values_default boolean NOT NULL DEFAULT true;
