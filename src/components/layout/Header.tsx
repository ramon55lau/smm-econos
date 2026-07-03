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
    const parts = pathname.split("/").filter(p => p);
    if (parts.length === 0) return [{ label: "Dashboard", href: "/dashboard" }];

    const crumbs = parts.map((part, index) => {
      const href = "/" + parts.slice(0, index + 1).join("/");
      const labels: Record<string, string> = {
        dashboard: "Dashboard",
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
      };

      // If the part is a UUID or MongoID (approximate check), call it "Detalle"
      const label = labels[part] || (part.length > 20 ? "Detalle" : part.charAt(0).toUpperCase() + part.slice(1));
      return { label, href };
    });

    // Ensure it starts with Dashboard if not already
    if (parts[0] !== "dashboard") {
      return [{ label: "Dashboard", href: "/dashboard" }, ...crumbs];
    }
    return crumbs;
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
            <div className={styles.userInfoHideMobile}>
              <span className={styles.userName}>{session?.user?.name || "Usuario"}</span>
              <IconChevronDown />
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
