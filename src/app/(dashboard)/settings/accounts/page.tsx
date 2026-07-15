"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Accounts.module.css";

type SocialAccount = {
  id: string;
  provider: string;
  providerAccountId: string;
  accountName: string | null;
  pageName: string | null;
  expiresAt: string | null;
};

type UserLimits = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  package: {
    id: string;
    name: string;
    maxFacebook: number;
    maxInstagram: number;
    maxYouTube: number;
  } | null;
};

type Provider = {
  key: string;
  name: string;
  desc: string;
  iconSrc: string;
  iconClass: string;
  btnClass: string;
  iconSvg?: React.ReactNode;
};

const providers: Provider[] = [
  {
    key: "facebook",
    name: "Facebook",
    desc: "Publica en Pages y accede a Instagram",
    iconSrc: "/images/facebook.png",
    iconClass: styles.providerFb,
    btnClass: styles.connectBtnFb,
  },
  {
    key: "instagram",
    name: "Instagram",
    desc: "Requiere cuenta de Facebook vinculada",
    iconSrc: "/images/instagram.png",
    iconClass: styles.providerIg,
    btnClass: styles.connectBtnIg,
  },
  {
    key: "youtube",
    name: "YouTube",
    desc: "Sube videos directamente a tu canal",
    iconSrc: "/images/youtube.png",
    iconClass: styles.providerYt,
    btnClass: styles.connectBtnYt,
  },
  {
    key: "google-ads",
    name: "Google Ads",
    desc: "Administra anuncios de búsqueda y display en Google",
    iconSrc: "",
    iconClass: styles.providerGads,
    btnClass: styles.connectBtnGads,
    iconSvg: (
      <svg viewBox="0 0 256 256" width="32" height="32" xmlns="http://www.w3.org/2000/svg" style={{ objectFit: 'contain' }}>
        <path d="M57.2 178.3L104.5 96.6L151.8 178.3Z" fill="#FBBC04" />
        <path d="M198.8 178.3L104.5 178.3L151.6 96.6Z" fill="#4285F4" />
        <ellipse cx="104.5" cy="178.3" rx="47.3" ry="47.3" fill="#34A853" />
        <path d="M151.6 96.6L198.8 178.3L104.5 178.3Z" fill="#4285F4" />
        <path d="M151.6 96.6L198.8 14.9L246.1 96.6Z" fill="#EA4335" />
      </svg>
    )
  },
];

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  // MFA States
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const fetchAccounts = async () => {
    try {
      const [accRes, limitRes, mfaRes] = await Promise.all([
        fetch("/api/social/accounts"),
        fetch("/api/users/me"),
        fetch("/api/auth/mfa/status")
      ]);

      if (accRes.ok) setAccounts(await accRes.json());
      if (limitRes.ok) setLimits(await limitRes.json());
      if (mfaRes.ok) {
        const mfaData = await mfaRes.json();
        setMfaEnabled(mfaData.mfaEnabled);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  // Auto-verify MFA when 6 digits are typed
  useEffect(() => {
    if (verificationCode && verificationCode.length === 6) {
      handleVerifyMfa();
    }
  }, [verificationCode]);

  const handleSetupMfa = async () => {
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setMfaSecret(data.secret);
      } else {
        const data = await res.json();
        alert(data.error || "Error iniciando configuración MFA");
      }
    } catch {
      alert("Error de red al configurar MFA");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (verificationCode.length !== 6) {
      alert("Introduce tu código de verificación de 6 dígitos.");
      return;
    }
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "MFA activado correctamente");
        setMfaEnabled(true);
        setQrCode("");
        setMfaSecret("");
        setVerificationCode("");
      } else {
        const data = await res.json();
        alert(data.error || "Código incorrecto");
      }
    } catch {
      alert("Error verificando código");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm("¿Estás seguro de que deseas desactivar la autenticación en dos pasos (MFA)? Tu cuenta será menos segura.")) return;
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", { method: "POST" });
      if (res.ok) {
        alert("MFA desactivado correctamente");
        setMfaEnabled(false);
      } else {
        alert("Error al desactivar MFA");
      }
    } catch {
      alert("Error de red al desactivar MFA");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    if ((provider === "youtube" || provider === "google-ads") && !showPrivacyInfo) {
      setShowPrivacyInfo(true);
      return;
    }

    try {
      const connectProvider = provider === "instagram" ? "facebook" : (provider === "google-ads" ? "youtube" : provider);
      const res = await fetch(`/api/social/connect?provider=${connectProvider}`);
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const data = await res.json();
        alert(data.error || "Error al conectar");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const handleDisconnect = async (providerAccountId: string, provider: string) => {
    const acc = accounts.find(a => a.providerAccountId === providerAccountId && a.provider === provider);
    const displayName = acc ? getAccountDisplayName(acc) : "esta cuenta";

    if (!confirm(`¿Estás seguro de que deseas desconectar la cuenta "${displayName}"? Se eliminarán todas las configuraciones asociadas.`)) return;

    try {
      await fetch("/api/social/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerAccountId, provider }),
      });
      await fetchAccounts();
    } catch {
      alert("Error al desconectar");
    }
  };

  const getAccountDisplayName = (acc: SocialAccount): string => {
    if (acc.provider === "youtube") {
      return acc.pageName || acc.accountName || "Canal de YouTube";
    }
    if (acc.provider === "facebook") {
      return acc.pageName || acc.accountName || "Página de Facebook";
    }
    if (acc.provider === "instagram") {
      return acc.accountName || acc.pageName || "Cuenta de Instagram";
    }
    if (acc.provider === "google-ads") {
      return acc.accountName || "Cuenta de Google Ads";
    }
    return acc.accountName || acc.pageName || "Cuenta conectada";
  };

  const getPlatformData = (provider: string) => {
    const platformAccounts = accounts.filter(a => a.provider === provider);

    // Group by providerAccountId (Titular)
    const titularsMap = new Map();
    platformAccounts.forEach(acc => {
      if (!titularsMap.has(acc.providerAccountId)) {
        titularsMap.set(acc.providerAccountId, acc);
      }
    });
    const uniqueTitulars = Array.from(titularsMap.values());

    let limit = 1;
    if (limits && limits.package) {
      if (provider === "facebook") limit = limits.package.maxFacebook;
      else if (provider === "instagram") limit = limits.package.maxInstagram;
      else if (provider === "youtube") limit = limits.package.maxYouTube;
    }
    return {
      accounts: uniqueTitulars,
      limit,
      remaining: limit - uniqueTitulars.length
    };
  };

  if (loading) return <div>Cargando cuentas...</div>;

  return (
    <div className={styles.container}>
      <div>
        <h2 className={styles.title}>Cuentas Sociales</h2>
        <p className={styles.subtitle}>Conecta tus redes sociales para publicar anuncios directamente desde SMM.</p>
      </div>

      {successParam && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          ✅ Cuenta conectada exitosamente.
        </div>
      )}
      {errorParam && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          ❌ Error: {decodeURIComponent(errorParam)}
        </div>
      )}

      <div className={styles.grid}>
        {providers.map(p => {
          const { accounts: platformTitulars, limit, remaining } = getPlatformData(p.key);
          const canConnect = remaining > 0;

          return (
            <div key={p.key} className={`glass-panel ${styles.providerCard}`}>
              <div className={styles.providerHeader}>
                <div className={`${styles.providerIcon} ${p.iconClass}`}>
                  {p.iconSvg ? p.iconSvg : (
                    <img src={p.iconSrc} alt={p.name} style={{ width: 32, height: 32, objectFit: "contain" }} />
                  )}
                </div>
                <div>
                  <div className={styles.providerName}>{p.name}</div>
                  <div className={styles.providerDesc}>{p.desc}</div>
                </div>
              </div>

              <div className={styles.limitInfo}>
                Capacidad: <strong>{platformTitulars.length} / {limit}</strong>
              </div>

              <div className={styles.accountsList}>
                {platformTitulars.length > 0 ? (
                  platformTitulars.map(acc => (
                    <div key={acc.id} className={styles.accountItem}>
                      <div className={styles.accountMain}>
                        <div className={styles.accountAvatar}>
                          {getAccountDisplayName(acc).charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.accountDetails}>
                          <div className={styles.accountTitle}>{getAccountDisplayName(acc)}</div>
                          {acc.expiresAt && (
                            <div className={styles.accountSubtitle}>
                              Expira: {new Date(acc.expiresAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className={styles.miniDisconnectBtn}
                        onClick={() => handleDisconnect(acc.providerAccountId, acc.provider)}
                      >
                        Desconectar
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.noAccounts}>Sin cuentas vinculadas</div>
                )}
              </div>

              <div className={styles.statusRow}>
                {canConnect ? (
                  <button
                    className={`${styles.connectBtn} ${p.btnClass}`}
                    onClick={() => handleConnect(p.key)}
                  >
                    + Vincular {p.name}
                  </button>
                ) : (
                  <div className={styles.limitReached}>
                    Límite alcanzado
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MFA Settings ── */}
      <div className={`glass-panel ${styles.mfaCard}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "600", margin: 0 }}>Autenticación en Dos Pasos (MFA)</h3>
            <p className={styles.providerDesc} style={{ marginTop: "0.25rem", margin: 0 }}>
              Añade una capa extra de seguridad a tu cuenta usando una aplicación de autenticación (Google Authenticator, Authy, etc.).
            </p>
          </div>
          <div className={styles.mfaStatus}>
            Estado:{" "}
            {mfaEnabled ? (
              <span className={styles.mfaStatusActive}>● Activado</span>
            ) : (
              <span className={styles.mfaStatusInactive}>○ Desactivado</span>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "0.5rem" }}>
          {mfaEnabled ? (
            <button
              className={styles.disconnectBtn}
              onClick={handleDisableMfa}
              disabled={mfaLoading}
            >
              {mfaLoading ? "Desactivando..." : "Desactivar MFA"}
            </button>
          ) : !qrCode ? (
            <button
              className={`${styles.connectBtn} ${styles.connectBtnFb}`}
              style={{ background: "var(--accent-primary)" }}
              onClick={handleSetupMfa}
              disabled={mfaLoading}
            >
              {mfaLoading ? "Generando..." : "Configurar MFA con Authenticator"}
            </button>
          ) : (
            <div className={styles.mfaSetupBox}>
              <p style={{ fontSize: "0.9rem", fontWeight: "500", margin: "0 0 0.5rem 0" }}>
                1. Escanea este código QR con tu aplicación de autenticación:
              </p>
              <div className={styles.qrContainer}>
                <img src={qrCode} alt="MFA QR Code" style={{ width: 180, height: 180, display: "block" }} />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "360px", margin: "0.5rem 0 0 0" }}>
                Si no puedes escanear la imagen, ingresa esta clave manualmente en tu aplicación:
                <br />
                <code style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--accent-primary)", marginTop: "0.25rem", display: "inline-block" }}>
                  {mfaSecret}
                </code>
              </p>

              <p style={{ fontSize: "0.9rem", fontWeight: "500", marginTop: "1.5rem", margin: "1.5rem 0 0.5rem 0" }}>
                2. Introduce el código de 6 dígitos para verificar y activar:
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                className={`${styles.miniDisconnectBtn} ${styles.mfaInput}`}
                style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)", padding: "0.5rem", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                disabled={mfaLoading}
              />

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  className={styles.disconnectBtn}
                  onClick={() => {
                    setQrCode("");
                    setMfaSecret("");
                    setVerificationCode("");
                  }}
                  disabled={mfaLoading}
                >
                  Cancelar
                </button>
                <button
                  className={`${styles.connectBtn} ${styles.connectBtnFb}`}
                  style={{ background: "var(--success)" }}
                  onClick={handleVerifyMfa}
                  disabled={mfaLoading}
                >
                  {mfaLoading ? "Verificando..." : "Confirmar y Activar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.infoBox}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <strong style={{ fontSize: '1.2rem' }}>💡</strong>
          <div>
            <p>Conecta tus redes sociales y concede los permisos necesarios para poder publicar directamente desde SMM.</p>
            <div className={styles.revocationLinks}>
              <p style={{ marginTop: '0.75rem', fontWeight: '500', fontSize: '0.8rem', opacity: 0.9 }}>Gestión de seguridad y privacidad:</p>
              <ul className={styles.revocationList}>
                <li>
                  Google / YouTube: <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer">Revocar acceso o gestionar permisos de Google</a>
                </li>
                <li>
                  Meta (Facebook/Instagram): <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer">Gestionar aplicaciones comerciales en Facebook</a>
                </li>
              </ul>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                Al conectar tus cuentas, aceptas nuestros <a href="/privacy-policy" style={{ textDecoration: 'underline' }}>Términos y Política de Privacidad</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPrivacyInfo && (
        <div className={styles.privacyOverlay}>
          <div className={styles.privacyModal}>
            <div className={styles.privacyTitle}>
              <img src="/images/youtube.png" alt="YouTube" style={{ width: 24, height: 24 }} />
              Información de Privacidad y Permisos
            </div>

            <p className={styles.providerDesc} style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Para que SMM pueda gestionar tu canal, Google te solicitará conceder los siguientes permisos:
            </p>

            <div className={styles.privacyContent}>
              <div className={styles.privacyItem}>
                <div className={styles.privacyIcon}>🎬</div>
                <div>
                  <div className={styles.privacyItemTitle}>Publicación de Videos</div>
                  <div className={styles.privacyItemDesc}>Permite subir tus videos directamente desde SMM a tu canal de YouTube (Videos y Shorts).</div>
                </div>
              </div>

              <div className={styles.privacyItem}>
                <div className={styles.privacyIcon}>📊</div>
                <div>
                  <div className={styles.privacyItemTitle}>Lectura de Métricas</div>
                  <div className={styles.privacyItemDesc}>Permite mostrarte estadísticas de tus videos (views, likes) en tu panel de reportes de SMM.</div>
                </div>
              </div>

              <div className={styles.privacyItem}>
                <div className={styles.privacyIcon}>🎯</div>
                <div>
                  <div className={styles.privacyItemTitle}>Gestión de Google Ads</div>
                  <div className={styles.privacyItemDesc}>Permite crear y monitorear campañas publicitarias para promocionar tus videos de propiedades.</div>
                </div>
              </div>
            </div>

            <div className={styles.privacyActions}>
              <button
                className={styles.privacyCancelBtn}
                onClick={() => setShowPrivacyInfo(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.privacyConfirmBtn}
                onClick={() => handleConnect("youtube")}
              >
                Entendido, conectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
