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

  const handleRenewMembership = async (user: User) => {
    // If the membership is not expired yet (expiresAt is in the future), start from that date.
    // Otherwise, start from today.
    const currentExpiry = user.expiresAt ? new Date(user.expiresAt) : null;
    const baseDate = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + 30);
    const expiresAt = newExpiry.toISOString().substring(0, 10);

    const dateMsg = currentExpiry && currentExpiry > new Date()
      ? `sumando 30 días a su vigencia actual (${currentExpiry.toLocaleDateString()})`
      : "por 30 días a partir de hoy";

    if (!confirm(`¿Renovar membresía de ${user.name || user.email} ${dateMsg}?\nNueva fecha de vencimiento: ${new Date(expiresAt).toLocaleDateString()}`)) return;

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
          expiresAt,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo renovar la membresía");
      } else {
        await fetchUsers();
      }
    } catch (e) {
      alert("Error renovando membresía");
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
              <th className={styles.th}>Límites</th>
              <th className={styles.th}>Fecha Creación</th>
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
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {user.package ? `${user.package.maxFacebook} FB / ${user.package.maxInstagram} IG / ${user.package.maxYouTube} YT` : "---"}
                  </div>
                </td>
                <td className={styles.td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                {isAdmin && (
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => openModal(user)} title="Editar">
                        ✏️
                      </button>
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
    </div>
  );
}
