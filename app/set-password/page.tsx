"use client";
import { useState } from "react";
import { createClient } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Heslo musí mít alespoň 8 znaků."); return; }
    if (password !== confirm) { setError("Hesla se neshodují."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Nepodařilo se nastavit heslo: " + error.message);
      setLoading(false);
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 24, color: "#1c2b22", marginBottom: 8 }}>
          🏡 Equity Dashboard
        </div>
        <div style={{ color: "#7c8378", fontSize: 14, marginBottom: 28 }}>Nastavte si heslo pro přístup k účtu</div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Heslo</div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#7c8378", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Heslo znovu</div>
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d2cab4", background: "#faf8f3", fontSize: 14, color: "#1c2b22", boxSizing: "border-box" }}
            />
          </div>

          {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "#1f3d2e", color: "#f5f1e6", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Ukládám…" : "Nastavit heslo →"}
          </button>
        </form>
      </div>
    </div>
  );
}
