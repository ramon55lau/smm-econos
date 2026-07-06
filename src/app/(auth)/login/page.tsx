"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Login.module.css";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showMfa, setShowMfa] = useState(false);
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaMsg, setMfaMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const disableMfa = searchParams.get("disableMfa");
    const msg = searchParams.get("msg");
    if (disableMfa === "success") {
      setMfaMsg({ text: "Tu Autenticación 2FA ha sido desactivada con éxito. Ya puedes iniciar sesión.", type: "success" });
    } else if (disableMfa === "error") {
      const errorText = msg === "invalid_or_expired"
        ? "El enlace de desactivación de 2FA ha expirado o ya fue utilizado."
        : "Hubo un error al procesar la solicitud de desactivación de 2FA.";
      setMfaMsg({ text: errorText, type: "error" });
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const signInData: any = {
      redirect: false,
      email,
      password,
    };

    if (showMfa) {
      signInData.totpCode = totpCode;
    }

    const result = await signIn("credentials", signInData);

    if (result?.error) {
      if (result.error === "MFA_REQUIRED") {
        setShowMfa(true);
        setLoading(false);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleSendRecoveryEmail = async () => {
    if (!email) {
      setError("Por favor, introduce tu correo electrónico primero.");
      return;
    }

    setSendingEmail(true);
    setError("");
    setMfaMsg(null);

    try {
      const res = await fetch("/api/auth/mfa/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo enviar el correo de recuperación.");
      } else {
        setMfaMsg({ text: "Te hemos enviado un correo electrónico con instrucciones para desactivar tu 2FA.", type: "success" });
      }
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={`${styles.logoWrapper} ${styles.econosWrapper}`}>
              <Image
                src="/images/logo-econos.png"
                alt="Econos"
                width={125}
                height={29}
                priority
                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
              />
            </div>
            <div className={styles.divider} />
            <div className={`${styles.logoWrapper} ${styles.smmWrapper}`}>
              <Image
                src="/images/logo-smm.png"
                alt="SMM"
                width={110}
                height={33}
                priority
                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
              />
            </div>
          </div>
          <p className={styles.subtitle}>Inicia sesión para gestionar tus campañas</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mfaMsg && (
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              background: mfaMsg.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${mfaMsg.type === "success" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
              color: mfaMsg.type === "success" ? "#16a34a" : "#dc2626",
              marginBottom: "1rem",
            }}>
              {mfaMsg.text}
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}

          {!showMfa ? (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {showPassword ? (
                      /* Eye-off icon */
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      /* Eye icon */
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.formGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label htmlFor="totpCode" className={styles.label} style={{ margin: 0 }}>
                  {isBackupCode ? "Código de Recuperación" : "Código de Seguridad (MFA)"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupCode(!isBackupCode);
                    setTotpCode("");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-primary)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  {isBackupCode ? "Usar App" : "Usar Código de Respaldo"}
                </button>
              </div>
              <input
                id="totpCode"
                type="text"
                maxLength={isBackupCode ? 8 : 6}
                placeholder={isBackupCode ? "abcdef12" : "000000"}
                className={styles.input}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                disabled={loading}
                required
                autoFocus
                style={{ textAlign: "center", letterSpacing: "0.15em", fontSize: "1.1rem" }}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                {isBackupCode
                  ? "Introduce uno de tus códigos de recuperación de 8 caracteres alfanuméricos."
                  : "Introduce el código de 6 dígitos generado por tu app de autenticación."}
              </p>

              {/* Botón de pérdida de dispositivo */}
              <div style={{ marginTop: "1rem", textAlign: "right" }}>
                <button
                  type="button"
                  onClick={handleSendRecoveryEmail}
                  disabled={sendingEmail}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.76rem",
                    cursor: sendingEmail ? "not-allowed" : "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                  onMouseEnter={e => !sendingEmail && (e.currentTarget.style.color = "var(--accent-primary)")}
                  onMouseLeave={e => !sendingEmail && (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {sendingEmail ? "Enviando..." : "📧 ¿Perdiste tu teléfono? Desactivar 2FA por Correo"}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Procesando..." : (showMfa ? "Verificar y Entrar" : "Ingresar")}
          </button>
        </form>

        <div className={styles.extraLinks} style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem" }}>
          <Link href="/forgot-password" className={styles.legalLink}>¿Olvidaste tu contraseña?</Link>
          <div style={{ marginTop: "0.5rem" }}>
            <span>¿No tienes cuenta? </span>
            <Link href="/register" className={styles.legalLink} style={{ fontWeight: "600", color: "var(--accent-primary)" }}>Regístrate aquí</Link>
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.legalLinks}>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>Política de Privacidad</a>
            <span className={styles.legalSeparator}>|</span>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>Condiciones de Uso</a>
          </div>
          <p>© {new Date().getFullYear()} Econos</p>
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary, #fbf7f0)',
        color: 'var(--text-muted)'
      }}>
        Cargando formulario...
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
