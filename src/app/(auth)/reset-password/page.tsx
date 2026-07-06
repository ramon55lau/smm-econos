"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../login/Login.module.css";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Token inválido o expirado");
            }

            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className={styles.error}>Token de recuperación faltante. Por favor, solicita un nuevo enlace.</div>
        );
    }

    if (success) {
        return (
            <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>¡Tu contraseña ha sido actualizada con éxito!</p>
                <Link href="/login" className={styles.button} style={{ display: "block", textDecoration: "none" }}>
                    Ir al Login
                </Link>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Nueva Contraseña</label>
                <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirmar Contraseña</label>
                <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                />
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
                {loading ? "Actualizando..." : "Restablecer Contraseña"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
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
                    <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>Nueva Contraseña</h2>
                    <p className={styles.subtitle}>Crea una nueva contraseña segura para tu cuenta</p>
                </div>

                <Suspense fallback={<div>Cargando...</div>}>
                    <ResetPasswordForm />
                </Suspense>

                <footer className={styles.footer}>
                    <p>© {new Date().getFullYear()} Econos</p>
                </footer>
            </div>
        </div>
    );
}
