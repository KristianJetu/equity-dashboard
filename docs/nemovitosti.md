# Nemovitosti — soubory a ocenění (detail)

> Načítá se jen na požádání (není součástí CLAUDE.md). Stručný přehled a odkazy: CLAUDE.md.

## Soubory k nemovitostem (nastaveno 2026-08-29)
- **Supabase Storage** — bucket `property-files` (private), cesta `{user_id}/{property_id}/{timestamp}.{ext}`
- **Tabulka `property_files`**: id, user_id, property_id, bucket, path, name, size, mime_type, category (`contract`/`insurance`/`photo`/`other`), note, created_at
- **RLS**: uživatel vidí/nahrává/maže jen soubory kde `user_id = auth.uid()`. Storage politiky navíc kontrolují `(storage.foldername(name))[1] = auth.uid()::text`
- **UI**: záložka "Soubory" v `PropertyModal` — upload s výběrem kategorie + poznámkou, seznam souborů, otevření přes signed URL (1 hod), mazání
- **Migrace**: `supabase-migration-files.sql` — spuštěna a ověřena funkční 2026-08-29
- **Signed URL**: soubory nejsou veřejně přístupné, URL se generuje na vyžádání přes `supabase.storage.createSignedUrl` s platností 1 hod

## Ocenění nemovitostí (nastaveno 2026-09-06, rozšířeno 2026-09-07)
- **Tabulka `property_valuations`**: id, user_id, property_id, value, valuation_date, note, created_at — historie odhadů hodnoty v čase
- **RLS**: stejný vzorec jako `property_files` — politiky pro `authenticated` s `user_id = auth.uid()` na SELECT/INSERT/UPDATE/DELETE
- **`properties.estimated_value` zůstává "aktuální hodnota"** — při přidání nového ocenění se přepíše (žádné jiné výpočty se neměnily, equity/LTV/cashflow projekce čtou dál `estimated_value`)
- **UI**: záložka "Ocenění" v `PropertyModal` (mezi "Detaily" a "Soubory") — formulář na přidání (hodnota, datum, poznámka), historie se zobrazenou změnou oproti předchozímu záznamu, mazání
- **Graf vývoje hodnoty**: `ValuationChart` — ručně kreslený SVG (styl jako hlavní graf "Jak rosteš v čase"), hover tooltip, zobrazí se nad formulářem v záložce Ocenění jakmile jsou k dispozici aspoň 2 body. Prvním bodem je `purchase_price`/`purchase_date`, pokud jsou vyplněné.
- **Badge na kartě nemovitosti**: "Ocenění po termínu" pokud od posledního ocenění (nebo od `purchase_date`, pokud ještě žádné ocenění není) uplynulo 90+ dní; klik otevře rovnou záložku Ocenění. Nezobrazuje se pro spravované (`ownership_type = manager`) ani plánované nemovitosti.
- **Delta od posledního ocenění**: na kartě nemovitosti (vedle cenové pilulky) i souhrnně v hero sekci Majetek — rozdíl mezi dvěma nejnovějšími záznamy v `property_valuations` na nemovitost, zobrazí se jen když má nemovitost aspoň 2 záznamy. Souhrn v Majetku ukazuje měsíc nejnovějšího ocenění (ne konkrétní den, protože nemovitosti se oceňují v různé dny) a jmenovitě všechny nemovitosti, které do součtu přispěly.
- **Výnos z nájmu** na kartě nemovitosti (pod LTV blokem, jen u pronajatých vlastních nemovitostí): "Hrubý výnos" = roční nájem / hodnota nemovitosti; "Výnos na kapitál" = roční čistý cashflow (nájem − splátka − pojistka/12 − náklady) / vlastní kapitál (hodnota − zbývající dluh).
- **Migrace**: `supabase-migration-valuations.sql` — spuštěna a ověřena funkční 2026-09-07

