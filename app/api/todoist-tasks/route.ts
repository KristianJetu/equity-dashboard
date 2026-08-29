import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const label = searchParams.get("label") ?? "akvizice";

  const token = process.env.TODOIST_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Missing TODOIST_API_TOKEN" }, { status: 500 });

  const res = await fetch(
    `https://api.todoist.com/api/v1/tasks?label=${encodeURIComponent(label)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: "Todoist API error", status: res.status, body }, { status: 502 });
  }

  const tasks = await res.json();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("complete");
  if (!taskId) return NextResponse.json({ error: "Missing task id" }, { status: 400 });

  const token = process.env.TODOIST_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Missing TODOIST_API_TOKEN" }, { status: 500 });

  const res = await fetch(`https://api.todoist.com/api/v1/tasks/${taskId}/close`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return NextResponse.json({ error: "Todoist API error" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
