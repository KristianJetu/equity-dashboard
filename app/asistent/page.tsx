"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Hlasový asistent: diktování (Web Speech API), odpovědi nahlas (speechSynthesis), Claude s nástroji na Todoist.
// Konverzace se drží jen v prohlížeči (localStorage), server dostává posledních 20 zpráv.

type Turn = { role: "user" | "assistant"; content: string };
type Action = { ok: boolean; text: string; taskId?: string; undone?: boolean };
type Item = (Turn & { kind?: undefined }) | (Action & { kind: "action" });

type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

const STORE = "asistent:v1";
const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(`${STORE}:${k}`); return v ? JSON.parse(v) as T : d; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(`${STORE}:${k}`, JSON.stringify(v)); } catch { /* private mode */ } };

const SUGGESTIONS = ["Spusť denní přehled", "Co mám po termínu?", "Přidej úkol…", "Dokonči úkol…"];

export default function AsistentPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState("");
  const [voiceOn, setVoiceOn] = useState(false);
  const [lang, setLang] = useState<"cs" | "en">("cs");
  const [autoSend, setAutoSend] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const baseRef = useRef("");
  const finalRef = useRef("");
  const inputRef = useRef("");
  const logRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(t?: string) => void>(() => {});

  useEffect(() => {
    setItems(load<Item[]>("items", []));
    setVoiceOn(load("voiceOn", false));
    setLang(load<"cs" | "en">("lang", "cs"));
    setAutoSend(load("autoSend", true));
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    setMicSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    window.speechSynthesis?.getVoices();
  }, []);
  useEffect(() => { save("items", items.slice(-80)); logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [items]);
  useEffect(() => { inputRef.current = input; }, [input]);

  // ---------- text-to-speech ----------
  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!voiceOn || !synth) return;
    synth.cancel();
    const clean = text.replace(/https?:\/\/\S+/g, "").replace(/[•*#_>`]/g, "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    const prefix = lang === "cs" ? /^cs/i : /^en/i;
    const voices = synth.getVoices();
    const voice = voices.find(v => prefix.test(v.lang) && /google|premium|enhanced|natural|siri/i.test(v.name)) ?? voices.find(v => prefix.test(v.lang));
    const parts = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p.trim());
      u.lang = lang === "cs" ? "cs-CZ" : "en-US";
      if (voice) u.voice = voice;
      if (i === 0) u.onstart = () => setSpeaking(true);
      if (i === parts.length - 1) { u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false); }
      synth.speak(u);
    });
  }, [voiceOn, lang]);

  // ---------- send ----------
  const send = useCallback(async (textArg?: string) => {
    const text = (textArg ?? inputRef.current).trim();
    if (!text || busy) return;
    window.speechSynthesis?.cancel();
    setInput(""); baseRef.current = ""; finalRef.current = "";
    const next: Item[] = [...items, { role: "user", content: text }];
    setItems(next);
    setBusy(true);
    try {
      const turns = next.filter((i): i is Turn & { kind?: undefined } => !i.kind).map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: turns, lang, voice: voiceOn }),
      });
      const data = await res.json().catch(() => ({}));
      const acts: Item[] = (data.actions ?? []).map((a: Action) => ({ ...a, kind: "action" as const }));
      if (!res.ok) {
        setItems(prev => [...prev, ...acts, { kind: "action", ok: false, text: data.error ?? (res.status === 401 ? "Přihlášení vypršelo, obnov stránku." : "Něco se pokazilo, zkus to znovu.") }]);
      } else {
        setItems(prev => [...prev, ...acts, { role: "assistant", content: data.text }]);
        speak(data.text);
      }
    } catch {
      setItems(prev => [...prev, { kind: "action", ok: false, text: "Bez připojení k internetu. Zkus to znovu." }]);
    } finally {
      setBusy(false);
    }
  }, [items, busy, lang, voiceOn, speak]);
  useEffect(() => { sendRef.current = send; }, [send]);

  // ---------- speech-to-text ----------
  function startListening() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { setMicSupported(false); return; }
    window.speechSynthesis?.cancel();
    setMicError("");
    const rec = new Ctor();
    rec.lang = "cs-CZ";
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = inputRef.current ? inputRef.current.trimEnd() + " " : "";
    finalRef.current = "";
    rec.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput((baseRef.current + finalRef.current + interim).replace(/\s+/g, " ").trimStart());
    };
    rec.onerror = e => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setMicError("Povol mikrofon pro tuhle stránku v nastavení prohlížeče.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setMicError("Diktování se přerušilo, zkus to znovu.");
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      const text = (baseRef.current + finalRef.current).trim();
      if (autoSend && text) { setInput(text); setTimeout(() => sendRef.current(text), 50); }
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setMicError("Mikrofon se nepodařilo spustit."); }
  }
  function toggleMic() {
    if (listening) recRef.current?.stop();
    else startListening();
  }

  async function undo(idx: number) {
    const it = items[idx];
    if (!it || it.kind !== "action" || !it.taskId) return;
    const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ undo: it.taskId }) });
    if (res.ok) setItems(prev => prev.map((x, i) => i === idx && x.kind === "action" ? { ...x, undone: true } : x));
  }

  function toggleVoice() {
    const on = !voiceOn; setVoiceOn(on); save("voiceOn", on);
    const synth = window.speechSynthesis;
    if (on && synth) { const u = new SpeechSynthesisUtterance(lang === "en" ? "Voice on." : "Hlas zapnutý."); u.lang = lang === "en" ? "en-US" : "cs-CZ"; synth.speak(u); }
    else synth?.cancel();
  }

  return (
    <div className="as-root">
      <style>{CSS}</style>
      <header className="as-head">
        <a href="/" className="as-back" aria-label="Zpět na dashboard">←</a>
        <h1>Asistent</h1>
        <div className="as-tools">
          <button type="button" className={`as-chip ${voiceOn ? "on" : ""}`} onClick={toggleVoice} aria-pressed={voiceOn}>{voiceOn ? "Hlas zap." : "Hlas vyp."}</button>
          {voiceOn && (
            <select className="as-chip" value={lang} onChange={e => { const v = e.target.value as "cs" | "en"; setLang(v); save("lang", v); }} aria-label="Jazyk odpovědí">
              <option value="cs">CZ</option><option value="en">EN</option>
            </select>
          )}
          <button type="button" className="as-chip" onClick={() => { setItems([]); window.speechSynthesis?.cancel(); }}>Nová</button>
        </div>
      </header>

      <div className="as-log" ref={logRef} aria-live="polite">
        {items.length === 0 && (
          <div className="as-empty">
            <p>Klepni na mikrofon a řekni, co mám udělat. Mám přístup k tvým úkolům v Todoistu a k datům z dashboardu.</p>
            <div className="as-suggest">
              {SUGGESTIONS.map(s => (
                <button key={s} type="button" onClick={() => s.endsWith("…") ? setInput(s.slice(0, -1) + " ") : send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {items.map((it, i) => it.kind === "action" ? (
          <div key={i} className={`as-action ${it.ok ? "" : "bad"}`}>
            <span className="mark">{it.ok ? "✓" : "!"}</span>
            <span className="txt">{it.text}</span>
            {it.ok && it.taskId && /dokončen/i.test(it.text) && (it.undone ? <span className="hint">vráceno</span> : <button type="button" onClick={() => undo(i)}>Vrátit</button>)}
          </div>
        ) : (
          <div key={i} className={`as-msg ${it.role}`}>{it.content}</div>
        ))}
        {busy && <div className="as-msg status">Pracuju na tom…</div>}
      </div>

      <div className="as-composer">
        {micError && <div className="as-err">{micError}</div>}
        {!micSupported && <div className="as-err">Tenhle prohlížeč neumí diktovat. Na iPhonu otevři stránku v Safari, na Androidu v Chromu.</div>}
        <div className="as-row">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            placeholder={listening ? "Poslouchám…" : "Napiš nebo nadiktuj pokyn…"}
            rows={2}
            aria-label="Pokyn pro asistenta"
          />
          <button type="button" className="as-send" onClick={() => send()} disabled={busy || !input.trim()}>Odeslat</button>
        </div>
        <div className="as-microw">
          <label className="as-auto">
            <input type="checkbox" checked={autoSend} onChange={e => { setAutoSend(e.target.checked); save("autoSend", e.target.checked); }} />
            Odeslat hned po domluvení
          </label>
          {speaking && <button type="button" className="as-chip" onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); }}>Ztlumit</button>}
        </div>
        {micSupported && (
          <button type="button" className={`as-mic ${listening ? "live" : ""}`} onClick={toggleMic} disabled={busy} aria-pressed={listening} aria-label={listening ? "Zastavit diktování" : "Začít diktovat"}>
            <span className="as-mic-icon" aria-hidden="true" />
            <span>{listening ? "Poslouchám… klepni pro konec" : "Mluvit"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

const CSS = `
.as-root{--bg:#ece6d8;--surface:#fbf8f1;--ink:#1c2b22;--muted:#6f6a5c;--line:#d9d1bf;--accent:#1f3d2e;--accent-ink:#fbf8f1;--warn:#a5481c;--ok:#2e7a4e;
  min-height:100dvh;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font-family:-apple-system,"Segoe UI",system-ui,sans-serif;max-width:720px;margin:0 auto}
.as-head{display:flex;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:2}
.as-head h1{flex:1;margin:0;font-size:20px;font-weight:700}
.as-back{text-decoration:none;color:var(--ink);font-size:20px;padding:4px 8px}
.as-tools{display:flex;gap:6px;align-items:center}
.as-chip{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600}
.as-chip.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.as-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.as-empty p{color:var(--muted);margin:0 0 12px;font-size:15px;line-height:1.5}
.as-suggest{display:flex;flex-wrap:wrap;gap:8px}
.as-suggest button{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:7px 14px;font-size:14px;color:var(--ink)}
.as-msg{max-width:88%;white-space:pre-wrap;overflow-wrap:anywhere;font-size:15.5px;line-height:1.5}
.as-msg.user{align-self:flex-end;background:var(--accent);color:var(--accent-ink);padding:9px 13px;border-radius:16px 16px 4px 16px}
.as-msg.assistant{align-self:flex-start;background:var(--surface);padding:9px 13px;border-radius:16px 16px 16px 4px;border:1px solid var(--line)}
.as-msg.status{align-self:flex-start;color:var(--muted);font-size:14px}
.as-action{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:14px;background:var(--surface)}
.as-action .mark{color:var(--ok);font-weight:700}.as-action.bad .mark{color:var(--warn)}
.as-action .txt{flex:1 1 200px;min-width:0}
.as-action button{border:0;background:none;color:var(--accent);font-weight:600;text-decoration:underline;padding:0}
.as-action .hint{color:var(--muted);font-size:13px}
.as-composer{border-top:1px solid var(--line);padding:12px 16px calc(14px + env(safe-area-inset-bottom,0px));display:grid;gap:10px;position:sticky;bottom:0;background:var(--bg)}
.as-row{display:flex;gap:8px;align-items:flex-end}
.as-row textarea{flex:1;min-width:0;resize:none;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:12px;padding:10px 12px;font-size:16px;font-family:inherit}
.as-send{border:0;background:var(--accent);color:var(--accent-ink);border-radius:10px;padding:10px 14px;font-weight:600;font-size:15px}
.as-send:disabled{opacity:.5}
.as-microw{display:flex;justify-content:space-between;align-items:center;gap:8px}
.as-auto{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted)}
.as-mic{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;border:0;border-radius:999px;padding:18px;background:var(--accent);color:var(--accent-ink);font-size:17px;font-weight:700}
.as-mic.live{background:var(--warn);animation:as-pulse 1.4s ease-in-out infinite}
.as-mic:disabled{opacity:.6}
.as-mic-icon{width:14px;height:22px;border:3px solid currentColor;border-radius:9px;position:relative;margin-bottom:6px}
.as-mic-icon::after{content:"";position:absolute;left:50%;bottom:-9px;width:20px;height:10px;border:3px solid currentColor;border-top:0;border-radius:0 0 12px 12px;transform:translateX(-50%)}
.as-err{font-size:13.5px;color:var(--warn)}
@keyframes as-pulse{50%{box-shadow:0 0 0 10px rgba(165,72,28,.18)}}
@media (prefers-reduced-motion:reduce){.as-mic.live{animation:none}}
`;
