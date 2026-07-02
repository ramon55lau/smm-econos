"use client";

import { useEffect, useState } from "react";
import styles from "./Packages.module.css";
import { useSession } from "next-auth/react";

type Package = {
    id: string;
    name: string;
    maxFacebook: number;
    maxInstagram: number;
    maxYouTube: number;
};

export default function PackagesPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        maxFacebook: 1,
        maxInstagram: 1,
        maxYouTube: 1
    });

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/packages");
            if (res.ok) {
                const data = await res.json();
                setPackages(data);
            }
        } catch (e) {
            console.error("Error fetching packages:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const openModal = (pkg: Package | null = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                name: pkg.name,
                maxFacebook: pkg.maxFacebook,
                maxInstagram: pkg.maxInstagram,
                maxYouTube: pkg.maxYouTube
            });
        } else {
            setEditingPackage(null);
            setFormData({
                name: "",
                maxFacebook: 1,
                maxInstagram: 1,
                maxYouTube: 1
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPackage(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingPackage ? `/api/packages/${editingPackage.id}` : "/api/packages";
            const method = editingPackage ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchPackages();
                closeModal();
            } else {
                const error = await res.json();
                alert(error.error || "Error al guardar el paquete");
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar el paquete "${name}"?`)) return;

        try {
            const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchPackages();
            } else {
                const error = await res.json();
                alert(error.error || "Error al eliminar");
            }
        } catch (e) {
            alert("Error eliminando paquete");
        }
    };

    if (loading) return <div className={styles.loading}>Cargando paquetes...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Configuración de Paquetes</h2>
                    <p className={styles.subtitle}>Define los límites de cuentas (Facebook, Instagram, YouTube) para cada plan</p>
                </div>
                {isAdmin && (
                    <button className={styles.addButton} onClick={() => openModal(null)}>
                        <span>+</span> Nuevo Paquete
                    </button>
                )}
            </div>

            {packages.length === 0 ? (
                <div className={`glass-panel ${styles.emptyState}`}>
                    <p>No hay paquetes configurados actualmente.</p>
                    <button className={styles.retryBtn} onClick={fetchPackages}>Reintentar</button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {packages.map(pkg => (
                        <div key={pkg.id} className={`glass-panel ${styles.card}`}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.packageName}>{pkg.name}</h3>
                                {isAdmin && (
                                    <div className={styles.cardActions}>
                                        <button className={styles.iconBtn} onClick={() => openModal(pkg)} title="Editar">✏️</button>
                                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(pkg.id, pkg.name)} title="Eliminar">🗑️</button>
                                    </div>
                                )}
                            </div>
                            <div className={styles.stats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Facebook</span>
                                    <span className={styles.statValue}>{pkg.maxFacebook}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Instagram</span>
                                    <span className={styles.statValue}>{pkg.maxInstagram}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>YouTube</span>
                                    <span className={styles.statValue}>{pkg.maxYouTube}</span>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <span className={styles.limitTag}>Límites por Red Social</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para Crear/Editar */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>{editingPackage ? "Editar Paquete" : "Crear Nuevo Paquete"}</h3>
                            <button className={styles.closeBtn} onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSave} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Nombre del Plan</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Starter, Enterprise..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.limitsFormGrid}>
                                <div className={styles.formGroup}>
                                    <label>Máx. Facebook</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.maxFacebook}
                                        onChange={e => setFormData({ ...formData, maxFacebook: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Máx. Instagram</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.maxInstagram}
                                        onChange={e => setFormData({ ...formData, maxInstagram: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Máx. YouTube</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.maxYouTube}
                                        onChange={e => setFormData({ ...formData, maxYouTube: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelActionBtn} onClick={closeModal}>Cancelar</button>
                                <button type="submit" className={styles.submitBtn} disabled={saving}>
                                    {saving ? "Guardando..." : (editingPackage ? "Actualizar Paquete" : "Crear Paquete")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
