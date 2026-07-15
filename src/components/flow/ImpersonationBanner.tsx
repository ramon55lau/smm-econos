"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImpersonationBanner() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [restoring, setRestoring] = useState(false);

    if (!session?.user?.impersonator) return null;

    async function handleRestore() {
        try {
            setRestoring(true);
            const res = await fetch("/api/users/impersonate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "restore" }),
            });

            if (res.ok) {
                // Trigger NextAuth update to clear impersonation object and restore super admin identity
                await update({ action: "restore" });

                // Refresh page layout and route back to users list
                router.refresh();
                router.push("/admin/users");
            } else {
                alert("Error al restaurar sesión de administrador");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al restaurar sesión");
        } finally {
            setRestoring(false);
        }
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: "42px",
                backgroundColor: "#f97316", // Premium orange-500
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                fontSize: "13px",
                fontWeight: "500",
                zIndex: 999999, // Float above absolutely everything
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                fontFamily: "inherit",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <span>
                    Estás visualizando la cuenta de <strong>{session.user.name || "Usuario"}</strong> ({session.user.email}).
                </span>
            </div>
            <button
                onClick={handleRestore}
                disabled={restoring}
                style={{
                    backgroundColor: "#ffffff",
                    color: "#ea580c",
                    border: "none",
                    borderRadius: "4px",
                    padding: "5px 12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: restoring ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease-in-out",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    opacity: restoring ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff7ed";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                }}
            >
                {restoring ? "Restaurando..." : "Volver a Super Admin ↩️"}
            </button>
        </div>
    );
}
