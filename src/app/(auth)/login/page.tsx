"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <Image
              src="/images/logo-econos.png"
              alt="Econos"
              width={130}
              height={30}
              priority
              className={styles.logoEconos}
              style={{ objectFit: 'contain', width: 'auto', height: '30px' }}
            />
            <div className={styles.divider} />
            <Image
              src="/images/logo-smm.png"
              alt="SMM"
              width={140}
              height={42}
              priority
              style={{ objectFit: 'contain', width: 'auto', height: '42px' }}
            />
          </div>
          <p className={styles.subtitle}>Inicia sesión para gestionar tus campañas</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
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
              <label htmlFor="totpCode" className={styles.label}>Código de Seguridad (MFA)</label>
              <input
                id="totpCode"
                type="text"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="000000"
                className={styles.input}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                disabled={loading}
                required
                autoFocus
              />
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Introduce el código de 6 dígitos generado por tu app de autenticación.
              </p>
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
