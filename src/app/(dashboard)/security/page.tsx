"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

type MfaStatus = "idle" | "loading" | "generating" | "verifying" | "success" | "error";

export default function SecurityPage() {
    const { data: session, update: updateSession } = useSession();
    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
    const [status, setStatus] = useState<MfaStatus>("idle");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);

    useEffect(() => {
        fetchMfaStatus();
    }, []);

    const fetchMfaStatus = async () => {
        try {
            const res = await fetch("/api/auth/mfa/status");
            const data = await res.json();
            setMfaEnabled(data.mfaEnabled);
        } catch {
            setMfaEnabled(false);
        }
    };

    const handleStartSetup = async () => {
        setStatus("generating");
        setMessage(null);
        setCode("");
        setQrCode(null);

        const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
            setMessage({ text: data.error || "Error al generar el QR.", type: "error" });
            setStatus("error");
            return;
        }

        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStatus("verifying");
    };

    const handleVerify = async () => {
        if (code.length !== 6) {
            setMessage({ text: "El código debe tener 6 dígitos.", type: "error" });
            return;
        }

        setStatus("loading");
        setMessage(null);

        const res = await fetch("/api/auth/mfa/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (!res.ok) {
            setMessage({ text: data.error || "Código incorrecto.", type: "error" });
            setStatus("verifying");
            return;
        }

        setStatus("success");
        setMfaEnabled(true);
        setQrCode(null);
        setSecret(null);
        setCode("");
        await updateSession();
        setMessage({ text: "¡2FA activado exitosamente! Tu cuenta ahora está protegida.", type: "success" });
    };

    const handleDisable = async () => {
        setStatus("loading");
        setMessage(null);

        const res = await fetch("/api/auth/mfa/disable", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
            setMessage({ text: data.error || "Error al desactivar.", type: "error" });
            setStatus("idle");
            return;
        }

        setMfaEnabled(false);
        setShowDisableConfirm(false);
        setStatus("idle");
        await updateSession();
        setMessage({ text: "2FA desactivado. Puedes volver a activarlo cuando quieras.", type: "success" });
    };

    const isLoading = status === "loading" || status === "generating";

    return (
        <div style={{
            maxWidth: "640px",
            margin: "0 auto",
            padding: "2rem 1.5rem",
        }}>
            {/* Header */}
            <div style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, rgba(176, 141, 109, 0.2), rgba(176, 141, 109, 0.08))",
                        border: "1px solid rgba(176, 141, 109, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b08d6d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                            Seguridad
                        </h1>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                            Configuración de Autenticación en Dos Pasos (2FA)
                        </p>
                    </div>
                </div>
            </div>

            {/* Mensaje de estado */}
            {message && (
                <div style={{
                    padding: "0.875rem 1.25rem",
                    borderRadius: "0.875rem",
                    marginBottom: "1.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    background: message.type === "success"
                        ? "rgba(34, 197, 94, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${message.type === "success" ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                    color: message.type === "success" ? "#16a34a" : "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                }}>
                    {message.type === "success" ? "✅" : "⚠️"} {message.text}
                </div>
            )}

            {/* Card principal */}
            <div style={{
                background: "var(--bg-secondary, #fffdf9)",
                border: "1px solid rgba(176, 141, 109, 0.15)",
                borderRadius: "1.25rem",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}>
                {/* Estado actual */}
                <div style={{
                    padding: "1.5rem",
                    borderBottom: "1px solid rgba(176, 141, 109, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: mfaEnabled
                                ? "rgba(34, 197, 94, 0.12)"
                                : "rgba(176, 141, 109, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.4rem",
                            flexShrink: 0,
                        }}>
                            {mfaEnabled ? "🔐" : "🔓"}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>
                                Autenticación en Dos Pasos
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                {mfaEnabled === null
                                    ? "Verificando estado..."
                                    : mfaEnabled
                                        ? "✅ Activado — Tu cuenta está protegida"
                                        : "❌ Desactivado — Tu cuenta es vulnerable"}
                            </div>
                        </div>
                    </div>

                    {/* Badge de estado */}
                    <div style={{
                        padding: "0.35rem 0.875rem",
                        borderRadius: "9999px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        background: mfaEnabled ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.1)",
                        color: mfaEnabled ? "#16a34a" : "#dc2626",
                        border: `1px solid ${mfaEnabled ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.2)"}`,
                        whiteSpace: "nowrap",
                    }}>
                        {mfaEnabled ? "ACTIVO" : "INACTIVO"}
                    </div>
                </div>

                {/* Contenido del flujo */}
                <div style={{ padding: "1.75rem" }}>

                    {/* Estado: no iniciado y 2FA no activo */}
                    {status === "idle" && !mfaEnabled && (
                        <div>
                            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                                La Autenticación en Dos Pasos (2FA) añade una capa extra de protección a tu cuenta.
                                Cada vez que inicies sesión, necesitarás ingresar un código temporal generado por tu aplicación
                                de autenticación (Google Authenticator, Authy, etc.).
                            </p>

                            <div style={{
                                background: "rgba(176, 141, 109, 0.06)",
                                border: "1px solid rgba(176, 141, 109, 0.15)",
                                borderRadius: "0.875rem",
                                padding: "1.25rem",
                                marginBottom: "1.5rem",
                            }}>
                                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                                    📋 Pasos para activar:
                                </div>
                                <ol style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.8 }}>
                                    <li>Instala <strong>Google Authenticator</strong> o <strong>Authy</strong> en tu teléfono</li>
                                    <li>Escanea el código QR que te mostraremos</li>
                                    <li>Ingresa el código de 6 dígitos de la app para confirmar</li>
                                </ol>
                            </div>

                            <button
                                onClick={handleStartSetup}
                                disabled={isLoading}
                                style={{
                                    width: "100%",
                                    padding: "0.9rem",
                                    borderRadius: "0.875rem",
                                    border: "none",
                                    background: "linear-gradient(135deg, #c4a882, #b08d6d)",
                                    color: "#fff",
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 4px 14px rgba(176, 141, 109, 0.35)",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(176, 141, 109, 0.45)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(176, 141, 109, 0.35)"; }}
                            >
                                🔐 Comenzar Configuración de 2FA
                            </button>
                        </div>
                    )}

                    {/* Estado: generando QR */}
                    {status === "generating" && (
                        <div style={{ textAlign: "center", padding: "2rem" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                Generando código QR seguro...
                            </p>
                        </div>
                    )}

                    {/* Estado: mostrando QR para verificar */}
                    {status === "verifying" && qrCode && (
                        <div>
                            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                                    Escanea este código QR con <strong>Google Authenticator</strong> o <strong>Authy</strong>
                                </p>

                                {/* QR Code */}
                                <div style={{
                                    display: "inline-block",
                                    padding: "1rem",
                                    background: "#fff",
                                    borderRadius: "1rem",
                                    border: "1px solid rgba(176, 141, 109, 0.2)",
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                    marginBottom: "1.25rem",
                                }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCode} alt="Código QR 2FA" width={200} height={200} style={{ display: "block" }} />
                                </div>

                                {/* Clave manual */}
                                {secret && (
                                    <div style={{
                                        background: "rgba(176, 141, 109, 0.06)",
                                        border: "1px solid rgba(176, 141, 109, 0.15)",
                                        borderRadius: "0.75rem",
                                        padding: "0.75rem 1rem",
                                        marginBottom: "1.5rem",
                                        textAlign: "left",
                                    }}>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", fontWeight: 600 }}>
                                            ¿No puedes escanear? Ingresa este código manualmente:
                                        </div>
                                        <code style={{
                                            fontSize: "0.85rem",
                                            color: "var(--text-primary)",
                                            fontFamily: "monospace",
                                            letterSpacing: "0.1em",
                                            wordBreak: "break-all",
                                        }}>
                                            {secret}
                                        </code>
                                    </div>
                                )}
                            </div>

                            {/* Ingreso del código */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{
                                    display: "block",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    marginBottom: "0.5rem",
                                }}>
                                    Ingresa el código de 6 dígitos de tu app:
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    style={{
                                        width: "100%",
                                        padding: "0.875rem 1rem",
                                        borderRadius: "0.875rem",
                                        border: "1px solid rgba(176, 141, 109, 0.25)",
                                        background: "var(--bg-primary)",
                                        color: "var(--text-primary)",
                                        fontSize: "1.5rem",
                                        fontFamily: "monospace",
                                        letterSpacing: "0.5em",
                                        textAlign: "center",
                                        outline: "none",
                                        caretColor: "#b08d6d",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = "#b08d6d"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(176, 141, 109, 0.15)"; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(176, 141, 109, 0.25)"; e.currentTarget.style.boxShadow = "none"; }}
                                    onKeyDown={e => { if (e.key === "Enter" && code.length === 6) handleVerify(); }}
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <button
                                    onClick={() => { setStatus("idle"); setQrCode(null); setSecret(null); setCode(""); setMessage(null); }}
                                    style={{
                                        flex: 1,
                                        padding: "0.8rem",
                                        borderRadius: "0.875rem",
                                        border: "1px solid rgba(74, 63, 53, 0.15)",
                                        background: "transparent",
                                        color: "var(--text-secondary)",
                                        fontSize: "0.9rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={code.length !== 6 || isLoading}
                                    style={{
                                        flex: 2,
                                        padding: "0.8rem",
                                        borderRadius: "0.875rem",
                                        border: "none",
                                        background: code.length === 6 && !isLoading
                                            ? "linear-gradient(135deg, #c4a882, #b08d6d)"
                                            : "rgba(176, 141, 109, 0.3)",
                                        color: "#fff",
                                        fontSize: "0.9rem",
                                        fontWeight: 700,
                                        cursor: code.length === 6 && !isLoading ? "pointer" : "not-allowed",
                                        transition: "all 0.2s ease",
                                        boxShadow: code.length === 6 && !isLoading ? "0 4px 14px rgba(176, 141, 109, 0.35)" : "none",
                                    }}
                                >
                                    {isLoading ? "Verificando..." : "✅ Confirmar y Activar"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Estado: 2FA ya activo */}
                    {mfaEnabled && status !== "verifying" && (
                        <div>
                            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                                Tu cuenta está protegida con Autenticación en Dos Pasos. Cada vez que inicies sesión,
                                deberás ingresar el código de tu aplicación de autenticación.
                            </p>

                            <div style={{
                                background: "rgba(34, 197, 94, 0.06)",
                                border: "1px solid rgba(34, 197, 94, 0.2)",
                                borderRadius: "0.875rem",
                                padding: "1.25rem",
                                marginBottom: "1.5rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                            }}>
                                <span style={{ fontSize: "1.5rem" }}>✅</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#16a34a", fontSize: "0.9rem" }}>
                                        2FA Activo y Funcionando
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#15803d", marginTop: "2px" }}>
                                        Tu cuenta tiene una capa adicional de seguridad habilitada.
                                    </div>
                                </div>
                            </div>

                            {!showDisableConfirm ? (
                                <button
                                    onClick={() => setShowDisableConfirm(true)}
                                    style={{
                                        width: "100%",
                                        padding: "0.8rem",
                                        borderRadius: "0.875rem",
                                        border: "1px solid rgba(239, 68, 68, 0.25)",
                                        background: "rgba(239, 68, 68, 0.05)",
                                        color: "#dc2626",
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)"; }}
                                >
                                    🔓 Desactivar 2FA
                                </button>
                            ) : (
                                <div style={{
                                    background: "rgba(239, 68, 68, 0.06)",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    borderRadius: "0.875rem",
                                    padding: "1.25rem",
                                }}>
                                    <p style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: 600, marginBottom: "0.5rem" }}>
                                        ⚠️ ¿Estás seguro?
                                    </p>
                                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
                                        Desactivar el 2FA hará tu cuenta más vulnerable. Solo hazlo si tienes una razón válida.
                                    </p>
                                    <div style={{ display: "flex", gap: "0.75rem" }}>
                                        <button
                                            onClick={() => setShowDisableConfirm(false)}
                                            style={{
                                                flex: 1,
                                                padding: "0.7rem",
                                                borderRadius: "0.75rem",
                                                border: "1px solid rgba(74, 63, 53, 0.15)",
                                                background: "transparent",
                                                color: "var(--text-secondary)",
                                                fontSize: "0.875rem",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDisable}
                                            disabled={isLoading}
                                            style={{
                                                flex: 1,
                                                padding: "0.7rem",
                                                borderRadius: "0.75rem",
                                                border: "none",
                                                background: "#dc2626",
                                                color: "#fff",
                                                fontSize: "0.875rem",
                                                fontWeight: 700,
                                                cursor: isLoading ? "not-allowed" : "pointer",
                                                opacity: isLoading ? 0.7 : 1,
                                            }}
                                        >
                                            {isLoading ? "Desactivando..." : "Sí, Desactivar"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Info card */}
            <div style={{
                marginTop: "1.5rem",
                padding: "1.25rem",
                background: "rgba(176, 141, 109, 0.05)",
                border: "1px solid rgba(176, 141, 109, 0.12)",
                borderRadius: "1rem",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
            }}>
                <strong style={{ color: "var(--text-secondary)" }}>💡 Aplicaciones recomendadas:</strong>{" "}
                Google Authenticator (
                <a href="https://play.google.com/store/search?q=google+authenticator" target="_blank" rel="noopener noreferrer" style={{ color: "#b08d6d" }}>Android</a>
                {" / "}
                <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" style={{ color: "#b08d6d" }}>iOS</a>
                ) o Authy (
                <a href="https://authy.com/download/" target="_blank" rel="noopener noreferrer" style={{ color: "#b08d6d" }}>Todas las plataformas</a>
                ).
            </div>
        </div>
    );
}
