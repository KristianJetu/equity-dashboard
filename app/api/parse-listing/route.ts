import { NextRequest, NextResponse } from "next/server";

// Rozparsuje inzerát ze sreality.cz — čistě z dat, žádné AI. Sreality vrací (aspoň dnes)
// v HTML plně strukturovaný JSON přes Next.js "__NEXT_DATA__", takže není potřeba
// hádat hodnoty z textu. Pokud sreality strukturu změní nebo požadavek zablokuje,
// vrátíme jasnou chybu a uživatel vyplní formulář ručně (viz docs/inzeraty.md).

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

type CbValue = { name?: string; value?: number } | null | undefined;
const cbName = (v: CbValue) => (v && v.name && v.name !== "- nezadáno" && !v.name.startsWith("- vyber") ? v.name : null);

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({ url: null }));
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Chybí URL." }, { status: 400 });
  }

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: "Neplatná URL." }, { status: 400 });
  }

  if (!host.endsWith("sreality.cz")) {
    return NextResponse.json(
      { error: "Automatické stažení podporujeme jen pro sreality.cz. Vyplň prosím údaje ručně." },
      { status: 422 }
    );
  }

  let html: string;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "cs" } });
    if (!res.ok) {
      return NextResponse.json({ error: `Sreality odpověděla chybou (HTTP ${res.status}). Vyplň prosím údaje ručně.` }, { status: 502 });
    }
    html = await res.text();
  } catch (err) {
    console.error("parse-listing fetch error:", err);
    return NextResponse.json({ error: "Nepodařilo se stránku stáhnout. Vyplň prosím údaje ručně." }, { status: 502 });
  }

  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    return NextResponse.json({ error: "Stránku se nepodařilo rozpoznat (změněná struktura). Vyplň prosím údaje ručně." }, { status: 502 });
  }

  let estate: Record<string, unknown> | null = null;
  try {
    const data = JSON.parse(match[1]);
    const queries: Array<{ queryKey?: unknown[]; state?: { data?: unknown } }> =
      data?.props?.pageProps?.dehydratedState?.queries ?? [];
    const estateQuery = queries.find((q) => Array.isArray(q.queryKey) && q.queryKey[0] === "estate");
    estate = (estateQuery?.state?.data as Record<string, unknown>) ?? null;
  } catch (err) {
    console.error("parse-listing json error:", err);
  }

  if (!estate) {
    return NextResponse.json({ error: "Data inzerátu se nepodařilo najít. Vyplň prosím údaje ručně." }, { status: 502 });
  }

  const params = (estate.params as Record<string, unknown>) ?? {};
  const locality = (estate.locality as Record<string, unknown>) ?? {};
  const images = (estate.images as Array<{ href?: string }>) ?? [];
  const category = estate.categorySubCb as CbValue;
  const dealType = estate.categoryTypeCb as CbValue;

  const listing = {
    source: "sreality",
    url,
    title: (estate.name as string) ?? null,
    city: (locality.city as string) ?? null,
    price: typeof estate.price === "number" ? estate.price : null,
    area_m2: typeof params.usableArea === "number" ? params.usableArea : (typeof params.floorArea === "number" ? params.floorArea : null),
    disposition: cbName(category),
    property_type: cbName(dealType),
    ownership: cbName(params.ownership as CbValue),
    building_condition: cbName(params.buildingCondition as CbValue),
    energy_rating: cbName(params.energyEfficiencyRating as CbValue),
    description: (estate.description as string) ?? null,
    image_url: images[0]?.href ?? null,
  };

  return NextResponse.json({ listing });
}
