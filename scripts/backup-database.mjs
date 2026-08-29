// Zálohovací skript — exportuje všechny tabulky ze Supabase (přes service_role
// klíč, obchází RLS) do jednoho JSON souboru v backups/. Spouští se ručně nebo
// přes naplánovanou úlohu (viz README v backups/).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(projectRoot, ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Chybí NEXT_PUBLIC_SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY v .env.local");
  process.exit(1);
}

const TABLES = [
  "properties",
  "mortgages",
  "payments",
  "tenants",
  "debts",
  "messages",
  "profiles",
  "consumer_loans",
  "income_profile",
];

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`${table}: HTTP ${res.status} — ${await res.text()}`);
  }
  const rows = await res.json();
  if (table === "payments") {
    // raw_email_text (plný text mBank emailu) je jen diagnostický údaj, ne
    // potřebný pro obnovu dat, a výrazně nafukuje velikost zálohy.
    return rows.map(({ raw_email_text, ...rest }) => rest);
  }
  return rows;
}

async function main() {
  const dump = { exported_at: new Date().toISOString(), tables: {} };
  for (const table of TABLES) {
    process.stdout.write(`Exportuji ${table}... `);
    const rows = await fetchTable(table);
    dump.tables[table] = rows;
    console.log(`${rows.length} řádků`);
  }

  const backupsDir = path.join(projectRoot, "backups");
  fs.mkdirSync(backupsDir, { recursive: true });

  const dateStr = new Date().toISOString().slice(0, 10);
  const outPath = path.join(backupsDir, `backup-${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), "utf8");

  // Zvlášť po tabulkách — pro snazší nahrání na Google Disk (velký kombinovaný
  // soubor by nešel přečíst najednou kvůli limitu na čtení souborů).
  const perTableDir = path.join(backupsDir, dateStr);
  fs.mkdirSync(perTableDir, { recursive: true });
  for (const table of TABLES) {
    fs.writeFileSync(
      path.join(perTableDir, `${table}.json`),
      JSON.stringify(dump.tables[table], null, 2),
      "utf8"
    );
  }

  console.log(`\nHotovo: ${outPath}`);
  console.log(`Po tabulkách: ${perTableDir}`);
}

main().catch(err => {
  console.error("Záloha selhala:", err.message);
  process.exit(1);
});
