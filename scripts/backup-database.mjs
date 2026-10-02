// Zálohovací skript — exportuje všechny tabulky ze Supabase (přes service_role
// klíč, obchází RLS) do jednoho JSON souboru v backups/ a stáhne soubory ze
// Storage. Spouští se ručně nebo
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

const AUTH_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

// Seznam tabulek se zjišťuje z OpenAPI schématu PostgRESTu, aby se nová
// tabulka do zálohy dostala automaticky (dřív pevný seznam a nové tabulky
// jako property_valuations nebo projection_plans v záloze chyběly).
const STORAGE_BUCKETS = ["property-files"];
const PAGE_SIZE = 1000; // PostgREST vrací max. 1000 řádků na dotaz

async function listTables() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { ...AUTH_HEADERS, Accept: "application/openapi+json" },
  });
  if (!res.ok) {
    throw new Error(`Seznam tabulek: HTTP ${res.status} — ${await res.text()}`);
  }
  const spec = await res.json();
  return Object.keys(spec.definitions ?? {}).sort();
}

async function fetchTable(table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: {
        ...AUTH_HEADERS,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      },
    });
    if (!res.ok) {
      throw new Error(`${table}: HTTP ${res.status} — ${await res.text()}`);
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  if (table === "payments") {
    // raw_email_text (plný text mBank emailu) je jen diagnostický údaj, ne
    // potřebný pro obnovu dat, a výrazně nafukuje velikost zálohy.
    return rows.map(({ raw_email_text, ...rest }) => rest);
  }
  return rows;
}

// Rekurzivně vypíše všechny objekty v bucketu (Storage list vrací složky jako
// položky bez id).
async function listBucket(bucket, prefix = "") {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { ...AUTH_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 10000, offset: 0 }),
  });
  if (!res.ok) {
    throw new Error(`Storage ${bucket}: HTTP ${res.status} — ${await res.text()}`);
  }
  const items = await res.json();
  const files = [];
  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) files.push(fullPath);
    else files.push(...(await listBucket(bucket, fullPath)));
  }
  return files;
}

async function backupBucket(bucket, targetDir) {
  const files = await listBucket(bucket);
  for (const file of files) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${bucket}/${file.split("/").map(encodeURIComponent).join("/")}`,
      { headers: AUTH_HEADERS }
    );
    if (!res.ok) {
      throw new Error(`Storage ${bucket}/${file}: HTTP ${res.status}`);
    }
    const outFile = path.join(targetDir, bucket, ...file.split("/"));
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
  }
  return files.length;
}

async function main() {
  const TABLES = await listTables();
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

  // Soubory ze Storage (smlouvy, fotky…) — jen lokálně, na Disk se nenahrávají.
  const storageDir = path.join(perTableDir, "storage");
  for (const bucket of STORAGE_BUCKETS) {
    process.stdout.write(`Stahuji Storage ${bucket}... `);
    console.log(`${await backupBucket(bucket, storageDir)} souborů`);
  }

  console.log(`\nHotovo: ${outPath}`);
  console.log(`Po tabulkách: ${perTableDir}`);
  console.log(`Storage: ${storageDir}`);
}

main().catch(err => {
  console.error("Záloha selhala:", err.message);
  process.exit(1);
});
