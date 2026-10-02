// Tenká vrstva nad Todoist REST API v1 pro hlasového asistenta (/asistent).
// Token je jen na serveru (TODOIST_API_TOKEN), do klienta se nikdy neposílá.

const BASE = "https://api.todoist.com/api/v1";

export type TodoistTask = {
  id: string;
  content: string;
  description?: string;
  priority: number; // 4 = nejvyšší (p1 v aplikaci), 1 = nejnižší (p4)
  project_id?: string;
  due?: { date?: string; string?: string; is_recurring?: boolean } | null;
};

export type TodoistProject = { id: string; name: string; inbox_project?: boolean };

function token(): string {
  const t = process.env.TODOIST_API_TOKEN;
  if (!t) throw new Error("Chybí TODOIST_API_TOKEN ve Vercelu.");
  return t;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Todoist ${res.status}: ${(await res.text()).slice(0, 200)}`);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const results = <T,>(data: unknown): T[] =>
  Array.isArray(data) ? (data as T[]) : ((data as { results?: T[] })?.results ?? []);

// "p1".."p4" (jak je zná uživatel) <-> API priorita 4..1
export const toApiPriority = (p?: string) => ({ p1: 4, p2: 3, p3: 2, p4: 1 })[p ?? "p4"] ?? 1;
export const toUserPriority = (n?: number) => `p${5 - (n ?? 1)}`;

export async function filterTasks(query: string, limit = 50): Promise<TodoistTask[]> {
  const q = query.trim() || "all";
  return results<TodoistTask>(await call(`/tasks/filter?query=${encodeURIComponent(q)}&limit=${limit}`));
}

export async function listProjects(): Promise<TodoistProject[]> {
  return results<TodoistProject>(await call(`/projects`));
}

export async function addTask(t: { content: string; description?: string; due_string?: string; priority?: string; project_id?: string }) {
  const body: Record<string, unknown> = { content: t.content, priority: toApiPriority(t.priority) };
  if (t.description) body.description = t.description;
  if (t.due_string) body.due_string = t.due_string;
  if (t.project_id && t.project_id !== "inbox") body.project_id = t.project_id;
  return call<TodoistTask>(`/tasks`, { method: "POST", body: JSON.stringify(body) });
}

export async function closeTask(id: string) {
  await call(`/tasks/${encodeURIComponent(id)}/close`, { method: "POST" });
}

export async function reopenTask(id: string) {
  await call(`/tasks/${encodeURIComponent(id)}/reopen`, { method: "POST" });
}
