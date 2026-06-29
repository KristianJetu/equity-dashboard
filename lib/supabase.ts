const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export async function fetchTable<T>(table: string, order?: string): Promise<T[]> {
  const params = order ? `select=*&order=${order}` : `select=*`;
  const res = await fetch(`${URL}/rest/v1/${table}?${params}`, { headers });
  if (!res.ok) { console.error(`${table} error:`, res.status); return []; }
  return res.json();
}
