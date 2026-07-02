"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../login/Login.module.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            setMessage(data.message || "Se ha enviado un correo con instrucciones.");
            setLoading(false);
        } catch (err: any) {
            setError("Ocurrió un error. Inténtalo más tarde.");
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`glass-panel ${styles.card}`}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <Image src="/images/logo-econos.png" alt="Econos" width={160} height={50} className={styles.logo} priority />
                    </div>
                    <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>Recuperar Contraseña</h2>
                    <p className={styles.subtitle}>Ingresa tu correo para recibir un enlace de recuperación</p>
                </div>

                {!message ? (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>Correo Electrónico</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="tu@correo.com"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.button} disabled={loading}>
                            {loading ? "Enviando..." : "Enviar enlace"}
                        </button>
                    </form>
                ) : (
                    <div className={styles.success} style={{ textAlign: "center", padding: "1rem", color: "var(--text-primary)" }}>
                        <p>{message}</p>
                        <Link href="/login" className={styles.button} style={{ marginTop: "1rem", display: "block", textDecoration: "none" }}>
                            Volver al Login
                        </Link>
                    </div>
                )}

                <footer className={styles.footer}>
                    <p>¿Recordaste tu contraseña? <Link href="/login" className={styles.legalLink}>Inicia sesión</Link></p>
                </footer>
            </div>
        </div>
    );
}
