"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import styles from "./Header.module.css";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

/* ── SVG Icons ── */
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

type HeaderProps = {
  onMenuToggle?: () => void;
  isCollapsed?: boolean;
};

export function Header({ onMenuToggle, isCollapsed }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(p => p && p !== "dashboard");

    return parts.map((part, index) => {
      // Rebuild path correctly
      const prefix = pathname.startsWith("/dashboard/") ? "/dashboard" : "";
      const href = prefix + "/" + parts.slice(0, index + 1).join("/");
      const labels: Record<string, string> = {
        campaigns: "Campañas",
        ads: "Reportes",
        settings: "Configuración",
        accounts: "Cuentas",
        admin: "Admin",
        users: "Usuarios",
        permissions: "Permisos",
        new: "Nuevo",
        publish: "Publicar",
        "real-estate": "Propiedades",
        security: "Seguridad",
      };

      const label = labels[part] || (part.length > 20 ? "Detalle" : part.charAt(0).toUpperCase() + part.slice(1));
      return { label, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onMenuToggle && (
          <button
            className={`${styles.menuBtn} ${isCollapsed ? styles.menuBtnVisible : ""}`}
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <span className={styles.menuIcon}>☰</span>
          </button>
        )}

        <nav className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.href} className={styles.crumbWrapper}>
              {i > 0 && <span className={styles.separator}>/</span>}
              <Link
                href={crumb.href}
                className={`${styles.crumb} ${i === breadcrumbs.length - 1 ? styles.activeCrumb : ""}`}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.centerLogoContainer}>
        <Link href="/dashboard" className={styles.logoCapsule}>
          <div className={styles.logoWrapperEconos}>
            <Image
              src="/images/logo-econos.png"
              alt="Econos"
              width={120}
              height={26}
              className={styles.logoEconos}
              style={{
                objectFit: 'contain',
                width: '100%',
                height: 'auto',
                maxHeight: '26px',
                filter: 'brightness(0.4) sepia(1) hue-rotate(-20deg) saturate(1.5)'
              }}
              priority
              unoptimized
            />
          </div>
          <div className={styles.logoDivider} />
          <div className={styles.logoWrapperSmm}>
            <Image
              src="/images/logo-smm.png"
              alt="Social Media Manager"
              width={110}
              height={38}
              style={{
                objectFit: 'contain',
                width: '100%',
                height: 'auto',
                maxHeight: '38px'
              }}
              priority
              unoptimized
            />
          </div>
        </Link>
      </div>

      <div className={styles.actions}>
        <div className={styles.userSection}>
          <button
            className={styles.profileBtn}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onBlur={() => {
              // Delay closing slightly so click triggers on menu items first
              setTimeout(() => setIsDropdownOpen(false), 200);
            }}
            title="Perfil de usuario"
          >
            <div className={styles.avatar}>
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className={styles.userInfoHideMobile} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
              <span className={styles.userName} style={{ lineHeight: "1.1", fontWeight: "600" }}>{session?.user?.name || "Usuario"}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--accent-primary)", fontWeight: "600", lineHeight: "1" }}>
                {(session?.user as any)?.packageName || "Sin Plan"}
              </span>
            </div>
          </button>

          {isDropdownOpen && (
            <div className={styles.userDropdown} style={{ display: "block" }}>
              <button
                onClick={() => {
                  signOut();
                }}
                className={styles.dropdownItem}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
