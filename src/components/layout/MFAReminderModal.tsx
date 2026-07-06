"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function MFAReminderModal() {
    const { status } = useSession();
    const router = useRouter();
    const [visible, setVisible] = useState(false);
    const checkedRef = useRef(false); // prevent double-check on StrictMode double-invoke

    useEffect(() => {
        if (status !== "authenticated") return;
        if (checkedRef.current) return;
        checkedRef.current = true;

        let cancelled = false;

        const checkAndShow = async () => {
            try {
                const res = await fetch("/api/auth/mfa/status");
                const data = await res.json();
                if (!cancelled && !data.mfaEnabled) {
                    // Small delay so it doesn't flash on page load
                    setTimeout(() => {
                        if (!cancelled) setVisible(true);
                    }, 1200);
                }
            } catch {
                // API failure: show the modal as a safe fallback
                if (!cancelled) {
                    setTimeout(() => {
                        if (!cancelled) setVisible(true);
                    }, 1200);
                }
            }
        };

        checkAndShow();

        return () => { cancelled = true; };
    }, [status]);


    const handleLater = () => {
        sessionStorage.setItem("mfa_reminder_dismissed", "true");
        setVisible(false);
    };

    const handleActivate = () => {
        sessionStorage.setItem("mfa_reminder_dismissed", "true");
        setVisible(false);
        router.push("/security");
    };

    if (!visible) return null;

    return (
        <>
            {/* Overlay */}
            <div
                onClick={handleLater}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(13, 13, 15, 0.55)",
                    backdropFilter: "blur(4px)",
                    zIndex: 9998,
                    animation: "fadeInOverlay 0.3s ease",
                }}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="mfa-modal-title"
                style={{
                    position: "fixed",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 9999,
                    width: "min(420px, 92vw)",
                    background: "var(--bg-secondary, #fffdf9)",
                    borderRadius: "1.5rem",
                    border: "1px solid rgba(176, 141, 109, 0.15)",
                    boxShadow: "0 24px 60px rgba(13, 13, 15, 0.18), 0 8px 20px rgba(0,0,0,0.08)",
                    padding: "2rem",
                    animation: "slideUpModal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    textAlign: "center",
                }}
            >
                {/* Shield icon */}
                <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(176, 141, 109, 0.15), rgba(176, 141, 109, 0.05))",
                    border: "1px solid rgba(176, 141, 109, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem",
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#b08d6d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                </div>

                <h2
                    id="mfa-modal-title"
                    style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: "var(--text-primary, #4a3f35)",
                        marginBottom: "0.6rem",
                    }}
                >
                    Protege tu cuenta con 2FA
                </h2>

                <p style={{
                    fontSize: "0.88rem",
                    color: "var(--text-secondary, #7a6f65)",
                    lineHeight: 1.6,
                    marginBottom: "1.75rem",
                }}>
                    La <strong>Autenticación en Dos Pasos</strong> agrega una capa adicional de seguridad a tu cuenta.
                    Te recomendamos activarla ahora para proteger tu acceso y el de tus campañas.
                </p>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                    <button
                        onClick={handleLater}
                        style={{
                            flex: 1,
                            padding: "0.8rem 1rem",
                            borderRadius: "0.875rem",
                            border: "1px solid rgba(74, 63, 53, 0.12)",
                            background: "transparent",
                            color: "var(--text-secondary, #7a6f65)",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(74, 63, 53, 0.05)";
                            e.currentTarget.style.borderColor = "rgba(74, 63, 53, 0.2)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "rgba(74, 63, 53, 0.12)";
                        }}
                    >
                        Más Tarde
                    </button>

                    <button
                        onClick={handleActivate}
                        style={{
                            flex: 1,
                            padding: "0.8rem 1rem",
                            borderRadius: "0.875rem",
                            border: "none",
                            background: "linear-gradient(135deg, #c4a882, #b08d6d)",
                            color: "#fff",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(176, 141, 109, 0.35)",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(176, 141, 109, 0.45)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 14px rgba(176, 141, 109, 0.35)";
                        }}
                    >
                        🔐 Activar Ahora
                    </button>
                </div>

                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem" }}>
                    Puedes activarla en cualquier momento desde <strong>Seguridad</strong> en el menú lateral
                </p>
            </div>

            <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
        </>
    );
}
