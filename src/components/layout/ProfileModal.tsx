"use client";

import { useState } from "react";
import styles from "./ProfileModal.module.css";

type ProfileModalProps = {
    user: {
        name?: string | null;
        email?: string | null;
        createdAt?: string | null;
        expiresAt?: string | null;
        packageName?: string;
        mfaEnabled?: boolean;
        role?: string;
    };
    onClose: () => void;
    onMfaDisabled?: () => void;
};

export default function ProfileModal({ user, onClose, onMfaDisabled }: ProfileModalProps) {
    const [activeTab, setActiveTab] = useState<"info" | "password" | "mfa">("info");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mfaPassword, setMfaPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const isExemptRole = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 8) {
            setMessage({ type: "error", text: "La nueva contraseña debe tener al menos 8 caracteres" });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Las contraseñas no coinciden" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: "success", text: "Contraseña actualizada correctamente" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDisableMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!confirm("¿Estás seguro de que deseas desactivar la autenticación de dos factores?")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: mfaPassword, disableMfa: true }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage({ type: "success", text: "2FA desactivado correctamente. Se aplicará al próximo inicio de sesión." });
            setMfaPassword("");
            onMfaDisabled?.();
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.modalAvatar}>
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                            <h3 className={styles.modalTitle}>Mi Perfil</h3>
                            <p className={styles.modalSubtitle}>{user.email}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === "info" ? styles.tabActive : ""}`}
                        onClick={() => { setActiveTab("info"); setMessage(null); }}
                    >
                        Información
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "password" ? styles.tabActive : ""}`}
                        onClick={() => { setActiveTab("password"); setMessage(null); }}
                    >
                        Contraseña
                    </button>
                    {user.mfaEnabled && (
                        <button
                            className={`${styles.tab} ${activeTab === "mfa" ? styles.tabActive : ""}`}
                            onClick={() => { setActiveTab("mfa"); setMessage(null); }}
                        >
                            2FA
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {message && (
                        <div className={`${styles.message} ${message.type === "success" ? styles.messageSuccess : styles.messageError}`}>
                            {message.type === "success" ? "✅" : "⚠️"} {message.text}
                        </div>
                    )}

                    {activeTab === "info" && (
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>Nombre</label>
                                <div className={styles.infoValue}>{user.name || "Sin nombre"}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>Correo electrónico</label>
                                <div className={styles.infoValue}>{user.email || "—"}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>Paquete activo</label>
                                <div className={styles.infoValueAccent}>{user.packageName || "Sin Plan"}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>Fecha de creación</label>
                                <div className={styles.infoValue}>{formatDate(user.createdAt)}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>Fecha de caducidad</label>
                                <div className={styles.infoValue}>
                                    {isExemptRole ? (
                                        <span style={{ color: "var(--text-muted)" }}>No expira (Admin)</span>
                                    ) : user.expiresAt ? (
                                        <span style={{
                                            color: new Date(user.expiresAt) < new Date() ? "var(--danger)" : "var(--text-primary)"
                                        }}>
                                            {formatDate(user.expiresAt)}
                                            {new Date(user.expiresAt) < new Date() && " (Vencido)"}
                                        </span>
                                    ) : (
                                        <span style={{ color: "var(--text-muted)" }}>Sin fecha asignada</span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>Autenticación 2FA</label>
                                <div className={styles.infoValue}>
                                    <span className={`${styles.badge} ${user.mfaEnabled ? styles.badgeOn : styles.badgeOff}`}>
                                        {user.mfaEnabled ? "🔐 Activado" : "🔓 Desactivado"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "password" && (
                        <form onSubmit={handleChangePassword} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Contraseña actual</label>
                                <input
                                    type="password"
                                    className={styles.formInput}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    placeholder="Ingresa tu contraseña actual"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nueva contraseña</label>
                                <input
                                    type="password"
                                    className={styles.formInput}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="Mínimo 8 caracteres"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Confirmar nueva contraseña</label>
                                <input
                                    type="password"
                                    className={styles.formInput}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Repite la nueva contraseña"
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? "Guardando..." : "Cambiar contraseña"}
                            </button>
                        </form>
                    )}

                    {activeTab === "mfa" && user.mfaEnabled && (
                        <form onSubmit={handleDisableMfa} className={styles.form}>
                            <div className={styles.mfaWarning}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <path d="M12 9v4" /><path d="M12 17h.01" />
                                </svg>
                                <div>
                                    <strong>Desactivar autenticación de dos factores</strong>
                                    <p>Tu cuenta quedará protegida únicamente con tu contraseña. Esta acción se aplicará en el próximo inicio de sesión.</p>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Confirma tu contraseña actual</label>
                                <input
                                    type="password"
                                    className={styles.formInput}
                                    value={mfaPassword}
                                    onChange={(e) => setMfaPassword(e.target.value)}
                                    required
                                    placeholder="Ingresa tu contraseña para confirmar"
                                />
                            </div>
                            <button type="submit" className={styles.submitBtnDanger} disabled={loading}>
                                {loading ? "Procesando..." : "Desactivar 2FA"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
