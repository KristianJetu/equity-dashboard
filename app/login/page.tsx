"use client";
import { useState } from "react";
import { createClient } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Nesprávný email nebo heslo.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Přihlášení selhalo — zkontroluj internetové připojení nebo blokování třetích stran (adblock/shields).");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 24, color: "#1c2b22", marginBottom: 8 }}>
          🏡 Equity Dashboard
        </div>
        <div style={{ color: "#7c8378", fontSize: 14, marginBottom: 28 }}>Přihlaste se ke svému účtu</div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Email</div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Heslo</div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }}
            />
          </div>

          {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Přihlašuji…" : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}
