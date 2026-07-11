"use client";

import { useEffect, useState } from "react";
import styles from "./Users.module.css";
import { useSession } from "next-auth/react";

type Package = {
  id: string;
  name: string;
  maxFacebook: number;
  maxInstagram: number;
  maxYouTube: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  packageId?: string;
  package?: Package;
  createdAt: string;
  expiresAt?: string | null;
  mfaEnabled?: boolean;
};

const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
const STATUSES = ["PENDING", "APPROVED", "BLOCKED"];

export default function UsersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "VIEWER",
    status: "APPROVED",
    packageId: "",
    expiresAt: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      if (res.ok) setPackages(await res.json());
    } catch (e) {
      console.error("Error fetching packages:", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPackages();
  }, []);

  const openModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email,
        password: "",
        role: user.role,
        status: user.status || "APPROVED",
        packageId: user.packageId || "",
        expiresAt: user.expiresAt ? user.expiresAt.substring(0, 10) : ""
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "VIEWER",
        status: "PENDING",
        packageId: packages[0]?.id || "",
        expiresAt: ""
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isEditing = !!editingUser;
      const url = isEditing ? `/api/users/${editingUser.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const payload: any = { ...formData };
      if (isEditing && !payload.password) {
        delete payload.password; // Don't send empty password if not changing
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Algo salió mal");
      }

      await fetchUsers();
      closeModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar a este usuario?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo eliminar el usuario");
      } else {
        await fetchUsers();
      }
    } catch (e) {
      alert("Error eliminando usuario");
    }
  };

  const handleDisableMfa = async (user: User) => {
    if (!confirm(`¿Estás seguro de que deseas desactivar el 2FA para el usuario ${user.name}? This will clear their 2FA settings.`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          packageId: user.packageId,
          disableMfa: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo desactivar el 2FA");
      } else {
        alert("Autenticación 2FA desactivada con éxito.");
        await fetchUsers();
      }
    } catch (e) {
      alert("Error desactivando el 2FA.");
    }
  };

  // Renewal modal states
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewModalUser, setRenewModalUser] = useState<User | null>(null);
  const [renewCalculatedExpiry, setRenewCalculatedExpiry] = useState("");
  const [renewDateMsg, setRenewDateMsg] = useState("");
  const [renewing, setRenewing] = useState(false);

  const handleRenewMembership = (user: User) => {
    const currentExpiry = user.expiresAt ? new Date(user.expiresAt) : null;
    const baseDate = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + 30);
    const expiresAt = newExpiry.toISOString().substring(0, 10);

    const dateMsg = currentExpiry && currentExpiry > new Date()
      ? `Agrega 30 días continuos al vencimiento actual (${currentExpiry.toLocaleDateString('es-ES')})`
      : "Inicia hoy y extiende la vigencia por 30 días continuos";

    setRenewModalUser(user);
    setRenewCalculatedExpiry(expiresAt);
    setRenewDateMsg(dateMsg);
    setIsRenewModalOpen(true);
  };

  const confirmRenewMembership = async () => {
    if (!renewModalUser) return;
    setRenewing(true);

    try {
      const res = await fetch(`/api/users/${renewModalUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: renewModalUser.name,
          email: renewModalUser.email,
          role: renewModalUser.role,
          status: renewModalUser.status,
          packageId: renewModalUser.packageId,
          expiresAt: renewCalculatedExpiry,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo renovar la membresía");
      } else {
        await fetchUsers();
        setIsRenewModalOpen(false);
        setRenewModalUser(null);
      }
    } catch (e) {
      alert("Error renovando membresía");
    } finally {
      setRenewing(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return <span className={`${styles.badge} ${styles.badgeSuperAdmin}`}>Super Admin</span>;
      case "ADMIN": return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
      case "EDITOR": return <span className={`${styles.badge} ${styles.badgeEditor}`}>Editor</span>;
      default: return <span className={`${styles.badge} ${styles.badgeViewer}`}>Viewer</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <span className={`${styles.badge} ${styles.badgeApproved}`}>Aprobado</span>;
      case "PENDING": return <span className={`${styles.badge} ${styles.badgePending}`}>Pendiente</span>;
      case "BLOCKED": return <span className={`${styles.badge} ${styles.badgeBlocked}`}>Bloqueado</span>;
      default: return <span className={`${styles.badge}`}>{status}</span>;
    }
  };

  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Gestión de Usuarios</h2>
        {isAdmin && (
          <button className={styles.addButton} onClick={() => openModal(null)}>
            <span>+</span> Nuevo Usuario
          </button>
        )}
      </div>

      <div className={`glass-panel ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Nombre</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Rol</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Vencimiento</th>
              <th className={styles.th}>Paquete / Plan</th>
              <th className={styles.th}>2FA</th>
              {isAdmin && <th className={styles.th}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={styles.tr}>
                <td className={styles.td} style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {user.name || "Sin nombre"}
                </td>
                <td className={styles.td}>{user.email}</td>
                <td className={styles.td}>{getRoleBadge(user.role)}</td>
                <td className={styles.td}>{getStatusBadge(user.status)}</td>
                <td className={styles.td}>
                  {["SUPER_ADMIN", "ADMIN"].includes(user.role) ? (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No expira</span>
                  ) : user.expiresAt ? (
                    <span style={{
                      fontWeight: 500,
                      color: new Date(user.expiresAt) < new Date() ? "var(--danger)" : "var(--text-secondary)"
                    }}>
                      {new Date(user.expiresAt).toLocaleDateString()}
                      {new Date(user.expiresAt) < new Date() && " (Vencido)"}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sin fecha</span>
                  )}
                </td>
                <td className={styles.td}>
                  <span style={{ fontWeight: 600 }}>{user.package?.name || "Sin plan"}</span>
                </td>
                <td className={styles.td}>
                  <span style={{
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "6px",
                    background: user.mfaEnabled ? "rgba(34, 197, 94, 0.1)" : "rgba(107, 114, 128, 0.1)",
                    color: user.mfaEnabled ? "#16a34a" : "#4b5563",
                    border: `1px solid ${user.mfaEnabled ? "rgba(34, 197, 94, 0.15)" : "rgba(107, 114, 128, 0.15)"}`
                  }}>
                    {user.mfaEnabled ? "🔐 Sí" : "🔓 No"}
                  </span>
                </td>
                {isAdmin && (
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => openModal(user)} title="Editar">
                        ✏️
                      </button>
                      {user.mfaEnabled && (
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleDisableMfa(user)}
                          title="Desactivar 2FA manualmente"
                          style={{ color: "#dc2626" }}
                        >
                          🔑
                        </button>
                      )}
                      {!['SUPER_ADMIN', 'ADMIN'].includes(user.role) && (
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleRenewMembership(user)}
                          title="Renovar membresía 30 días"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          🔄
                        </button>
                      )}
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                        onClick={() => handleDelete(user.id)}
                        title="Eliminar"
                        disabled={user.id === session?.user?.id}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h3>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <div style={{ color: "var(--danger)", fontSize: "0.875rem" }}>{error}</div>}

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre completo</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser} // Can't easily change email once created generally
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Contraseña {editingUser && <span style={{ fontWeight: "normal", color: "var(--text-muted)" }}>(Dejar en blanco para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  className={styles.input}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Rol de Sistema</label>
                <select
                  className={styles.select}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Estado de Cuenta</label>
                <select
                  className={styles.select}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Paquete de Suscripción</label>
                <select
                  className={styles.select}
                  value={formData.packageId}
                  onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar plan...</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.maxFacebook} FB / {p.maxInstagram} IG / {p.maxYouTube} YT)
                    </option>
                  ))}
                </select>
              </div>

              {!["SUPER_ADMIN", "ADMIN"].includes(formData.role) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fecha de Vencimiento de Membresía</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "-4px" }}>
                    Si se dejas en blanco, al aprobar o guardar se calcularán 30 días automáticamente.
                  </small>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elegante Modal de Renovación de Suscripción */}
      {isRenewModalOpen && renewModalUser && (
        <div className={styles.modalOverlay} style={{ backdropFilter: "blur(6px)", zIndex: 10000 }}>
          <div className={styles.modalContent} style={{
            maxWidth: "460px",
            borderRadius: "1.5rem",
            border: "1px solid rgba(176, 141, 109, 0.2)",
            boxShadow: "0 20px 50px rgba(13, 13, 15, 0.15)",
            padding: "2rem",
            background: "var(--bg-secondary, #fffdf9)",
            animation: "modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            {/* Header con Logos de Marca */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(176, 141, 109, 0.12)",
              paddingBottom: "1.25rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src="/images/logo-econos.png" alt="Econos" style={{ height: "20px", width: "auto", objectFit: "contain" }} />
                <span style={{ height: "14px", width: "1px", background: "rgba(74, 63, 53, 0.2)" }}></span>
                <img src="/images/logo-smm.png" alt="SMM" style={{ height: "26px", width: "auto", objectFit: "contain" }} />
              </div>
              <button
                onClick={() => { setIsRenewModalOpen(false); setRenewModalUser(null); }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "0"
                }}
              >
                ✕
              </button>
            </div>

            {/* Icono de Renovación */}
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(176, 141, 109, 0.15), rgba(176, 141, 109, 0.05))",
              border: "1px solid rgba(176, 141, 109, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b08d6d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>

            <h3 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--text-primary, #4a3f35)",
              textAlign: "center",
              marginBottom: "0.25rem"
            }}>
              Renovar Membresía
            </h3>
            <p style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textAlign: "center",
              marginBottom: "1.5rem"
            }}>
              Extiende el acceso de cliente de forma manual
            </p>

            {/* Datos del Usuario */}
            <div style={{
              background: "rgba(176, 141, 109, 0.06)",
              borderRadius: "1rem",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(176, 141, 109, 0.08)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Cliente:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {renewModalUser.name || "Usuario"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Email:</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{renewModalUser.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Plan Actual:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-primary, #b08d6d)" }}>
                  {packages.find(p => p.id === renewModalUser.packageId)?.name || 'Plan Básico'}
                </span>
              </div>

              <div style={{ height: "1px", background: "rgba(176, 141, 109, 0.12)", margin: "0.75rem 0" }}></div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.02em" }}>Vencimiento Actual</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {renewModalUser.expiresAt ? new Date(renewModalUser.expiresAt).toLocaleDateString('es-ES') : "Expirada / Sin fecha"}
                  </span>
                </div>
                <div style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>➡️</div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--accent-primary, #b08d6d)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>Nuevo Vencimiento</span>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent-primary, #b08d6d)" }}>
                    {new Date(renewCalculatedExpiry).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            <p style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: "1.75rem",
              textAlign: "center"
            }}>
              💡 <em>{renewDateMsg}.</em> Se enviará de inmediato un correo electrónico al cliente con la confirmación de la fecha de caducidad y límites detallados de su paquete.
            </p>

            {/* Acciones */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => { setIsRenewModalOpen(false); setRenewModalUser(null); }}
                disabled={renewing}
                style={{
                  flex: 1,
                  padding: "0.8rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(74, 63, 53, 0.15)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(74, 63, 53, 0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRenewMembership}
                disabled={renewing}
                style={{
                  flex: 1,
                  padding: "0.8rem 1rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "linear-gradient(135deg, #c4a882, #b08d6d)",
                  color: "#fff",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(176, 141, 109, 0.25)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(176, 141, 109, 0.35)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(176, 141, 109, 0.25)";
                }}
              >
                {renewing ? "Procesando..." : "Confirmar Renovación"}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
