"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem("pwa-install-dismissed")) return;

    const standalone =
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;
    if (window.innerWidth > 768) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);

    const existing = (window as { __pwaPrompt?: BeforeInstallPromptEvent }).__pwaPrompt;
    if (existing) setDeferredPrompt(existing);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    setVisible(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("pwa-install-dismissed", "1");
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 72,
      left: 12,
      right: 12,
      zIndex: 9999,
      background: "#1f3d2e",
      color: "#f5efe0",
      borderRadius: 16,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      fontFamily: "'Hanken Grotesk', sans-serif",
    }}>
      <div style={{ fontSize: 28, flexShrink: 0 }}>🏠</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          Mobilní aplikace
        </div>
        {isIos ? (
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
            V Safari klepni na <strong>Sdílet</strong> a vyber <strong>Přidat na plochu</strong>
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
            V menu prohlížeče vyber <strong>Přidat na plochu</strong> nebo <strong>Nainstalovat aplikaci</strong>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {deferredPrompt && (
          <button onClick={install} style={{
            background: "#c8a84b",
            color: "#1f3d2e",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            Přidat
          </button>
        )}
        <button onClick={dismiss} style={{
          background: "transparent",
          color: "#f5efe0",
          border: "1px solid rgba(245,239,224,0.3)",
          borderRadius: 8,
          padding: "4px 10px",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
        }}>
          Zavřít
        </button>
      </div>
    </div>
  );
}
