"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../login/Login.module.css";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === "El usuario ya existe") {
                    setUserExists(true);
                    setLoading(false);
                    return;
                }
                throw new Error(data.error || "Ocurrió un error");
            }

            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (userExists) {
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
                        <h2 style={{ color: "var(--danger)", marginBottom: "1rem", marginTop: "1rem" }}>¡Usuario ya Registrado!</h2>
                        <p className={styles.subtitle} style={{ marginBottom: "1.5rem" }}>
                            El correo electrónico <strong>{email}</strong> ya se encuentra registrado en nuestra base de datos.
                        </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
                        <Link href="/login" className={styles.button} style={{ textAlign: "center", display: "block", textDecoration: "none" }}>
                            Iniciar Sesión
                        </Link>
                        <Link href="/forgot-password" className={styles.button} style={{ textAlign: "center", display: "block", textDecoration: "none", background: "none", border: "1px solid var(--accent-primary)", color: "var(--text-primary)", boxShadow: "none" }}>
                            Recuperar Contraseña
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
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
                        <h2 style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>¡Registro Exitoso!</h2>
                        <p className={styles.subtitle}>
                            Tu solicitud ha sido recibida. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión. Te hemos enviado un correo de confirmación.
                        </p>
                    </div>
                    <Link href="/login" className={styles.button} style={{ textAlign: "center", display: "block", textDecoration: "none" }}>
                        Volver al Login
                    </Link>
                </div>
            </div>
        );
    }

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
                    <p className={styles.subtitle}>Crea tu cuenta para comenzar</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>Nombre Completo</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Tu nombre"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

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

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Contraseña</label>
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

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? "Registrando..." : "Registrarse"}
                    </button>
                </form>

                <footer className={styles.footer}>
                    <p>¿Ya tienes cuenta? <Link href="/login" className={styles.legalLink}>Inicia sesión</Link></p>
                    <div className={styles.legalLinks} style={{ marginTop: "1rem" }}>
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>Privacidad</a>
                        <span className={styles.legalSeparator}>|</span>
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.legalLink}>Condiciones</a>
                    </div>
                    <p>© {new Date().getFullYear()} Econos</p>
                </footer>
            </div>
        </div>
    );
}
