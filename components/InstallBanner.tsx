"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [show, setShow] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem("pwa-install-dismissed")) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode =
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isInStandaloneMode) return; // already installed

    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return; // desktop — nezobrazovat

    if (isIos) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) setShow("ios");
      return;
    }

    // Event mohl přijít před React hydratací — čteme z globální proměnné
    const existing = (window as { __pwaPrompt?: BeforeInstallPromptEvent }).__pwaPrompt;
    if (existing) {
      setDeferredPrompt(existing);
      setShow("android");
      return;
    }
    // Fallback: pokud ještě nepřišel, počkáme
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setShow(null);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem("pwa-install-dismissed", "1");
    setShow(null);
  };

  if (!show) return null;

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
      {/* Ikona */}
      <div style={{ fontSize: 32, flexShrink: 0 }}>🏠</div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
          Přidat na plochu
        </div>
        {show === "android" ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Otevírej dashboard jako appku — bez prohlížeče.
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Klepni na <strong>Sdílet</strong> → <strong>Přidat na plochu</strong>
          </div>
        )}
      </div>

      {/* Tlačítka */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {show === "android" && (
          <button
            onClick={install}
            style={{
              background: "#c8a84b",
              color: "#1f3d2e",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Přidat
          </button>
        )}
        <button
          onClick={dismiss}
          style={{
            background: "transparent",
            color: "#f5efe0",
            border: "1px solid rgba(245,239,224,0.3)",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Zavřít
        </button>
      </div>
    </div>
  );
}
