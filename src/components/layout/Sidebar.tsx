"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import styles from "./Sidebar.module.css";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

/* ── SVG Icon Components (Lucide-style, consistent stroke) ── */
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const IconCampaigns = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconAds = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);


const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconPermissions = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconSocial = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: <IconDashboard /> },
  {
    name: "Campañas",
    href: "/campaigns",
    icon: <IconCampaigns />,
    children: [
      { name: "Campañas Simples", href: "/campaigns" },
      { name: "Campañas Dinámicas", href: "/real-estate" },
    ]
  },
  { name: "Reportes", href: "/ads", icon: <IconAds /> },
  { name: "Cuentas Sociales", href: "/settings/accounts", icon: <IconSocial /> },
];

const adminItems = [
  { name: "Usuarios", href: "/admin/users", icon: <IconUsers /> },
  { name: "Permisos", href: "/admin/permissions", icon: <IconPermissions /> },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const toggleMenu = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      {/* ── Logo ── */}
      <div className={styles.logoContainer}>
        <div className={styles.logoCollapsed}>
          <Image src="/images/solo smm.png" alt="Icon" width={36} height={36} className={styles.iconLogo} />
        </div>
        <div className={styles.logoExpanded}>
          <Image src="/images/logo-smm.png" alt="SMM Logo" width={160} height={44} className={styles.smmLogo} priority />
        </div>

        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>


      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>Menú</div>
        {navItems.map((item) => {
          if ('children' in item && item.children) {
            const isParentActive = item.children.some(child => pathname === child.href || pathname.startsWith(`${child.href}/`)) || pathname === item.href;
            const isMenuOpen = openMenus[item.name] !== undefined ? openMenus[item.name] : isParentActive;

            return (
              <div key={item.name} className={styles.navGroup}>
                <div
                  className={`${styles.navItem} ${isParentActive && !isMenuOpen ? styles.active : ""} ${styles.navParent}`}
                  onClick={(e) => toggleMenu(item.name, e)}
                  style={{ cursor: "pointer" }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel} style={{ flex: 1 }}>{item.name}</span>
                  <span className={`${styles.chevron} ${isMenuOpen ? styles.chevronOpen : ""}`}>
                    <IconChevron />
                  </span>
                </div>
                {isMenuOpen && (
                  <div className={styles.navChildren}>
                    {item.children.map(child => {
                      const isActive = child.href === "/campaigns"
                        ? pathname === "/campaigns" || pathname.startsWith("/campaigns/")
                        : pathname === child.href || pathname.startsWith(`${child.href}/`);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`${styles.navChildItem} ${isActive ? styles.activeChild : ""}`}
                          onClick={handleNavClick}
                        >
                          <span className={styles.navChildDot}></span>
                          <span className={styles.navChildLabel}>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              onClick={handleNavClick}
              title={item.name}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.name}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className={styles.navSection} style={{ marginTop: "1.5rem" }}>
              Admin
            </div>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                  onClick={handleNavClick}
                  title={item.name}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <div className={styles.legalLinks}>
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>
            Privacidad
          </a>
          <span className={styles.legalDivider}>·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>
            Condiciones
          </a>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.footerAvatar}>
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.footerName}>
              {session?.user?.name || "Usuario"}
            </div>
            <div className={styles.footerEmail}>{session?.user?.email}</div>
          </div>
          <button className={styles.logoutBtn} onClick={() => signOut()} title="Cerrar sesión">
            <IconLogout />
          </button>
        </div>
        <div className={styles.versionTag}>V3.0</div>
      </div>
    </aside>
  );
}
