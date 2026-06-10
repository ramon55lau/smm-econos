import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
    title: 'Política de Privacidad – Servicios de Google | SMM',
    description:
        'Política de privacidad específica sobre el uso de los servicios de Google en la plataforma SMM Social Media Manager.',
};

const scopes = [
    {
        icon: '▶',
        color: '#c4302b',
        bg: '#fff0f0',
        title: 'youtube.upload',
        label: 'Publicación en YouTube',
        description:
            'Permite a SMM subir videos de inmuebles a tu canal de YouTube únicamente cuando tú confirmas la publicación de forma explícita. La aplicación nunca sube contenido sin tu aprobación previa.',
    },
    {
        icon: '👁',
        color: '#4285F4',
        bg: '#f0f5ff',
        title: 'youtube.readonly',
        label: 'Lectura de datos de YouTube',
        description:
            'Nos permite leer el estado y las métricas básicas (título, estado de publicación, vistas) de los videos que hemos subido, para mostrarte el progreso en tu panel de control.',
    },
    {
        icon: '📊',
        color: '#34A853',
        bg: '#f0fff5',
        title: 'adwords',
        label: 'Google Ads',
        description:
            'Usado para crear y gestionar campañas publicitarias que promocionan tus propiedades en los resultados de búsqueda de Google. Cada campaña se crea bajo tu supervisión directa y puedes pausarla en cualquier momento.',
    },
    {
        icon: '👤',
        color: '#FBBC05',
        bg: '#fffbf0',
        title: 'openid / email / profile',
        label: 'Identificación y Perfil',
        description:
            'Usamos tu nombre y correo de Google únicamente para crear y autenticar tu cuenta en SMM. No accedemos a ningún otro dato personal de tu cuenta de Google ni lo compartimos con terceros.',
    },
];

export default function GooglePrivacyPolicyPage() {
    return (
        <div className={styles.page}>
            <main className={styles.container}>

                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.badge}>Servicios de Google</div>
                    <h1 className={styles.title}>Política de Privacidad</h1>
                    <p className={styles.subtitle}>
                        Esta página detalla cómo SMM hace uso de los permisos de Google que solicita al momento de iniciar sesión con tu cuenta.
                    </p>
                    <p className={styles.date}>Vigente desde: 10 de junio de 2026</p>
                </header>

                {/* Intro */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>¿Por qué pedimos permisos de Google?</h2>
                    <p className={styles.text}>
                        SMM es una herramienta de gestión de redes sociales diseñada para agencias y profesionales inmobiliarios. Para poder publicar en YouTube y administrar anuncios, necesitamos que Google nos autorice a actuar en tu nombre de forma segura mediante OAuth 2.0. A continuación explicamos cada permiso solicitado.
                    </p>
                </section>

                {/* Scopes */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Permisos solicitados</h2>
                    <div className={styles.scopeGrid}>
                        {scopes.map((s) => (
                            <div key={s.title} className={styles.scopeCard} style={{ borderTopColor: s.color }}>
                                <div className={styles.scopeIconWrap} style={{ background: s.bg, color: s.color }}>
                                    {s.icon}
                                </div>
                                <div className={styles.scopeBody}>
                                    <span className={styles.scopeCode} style={{ color: s.color }}>{s.title}</span>
                                    <h3 className={styles.scopeLabel}>{s.label}</h3>
                                    <p className={styles.scopeDesc}>{s.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Security */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Protección de Datos y Seguridad</h2>
                    <p className={styles.text}>
                        En SMM, la seguridad de tus datos de Google es nuestra prioridad. Implementamos los siguientes mecanismos de protección:
                    </p>
                    <ul className={styles.text}>
                        <li><strong>Cifrado en Tránsito:</strong> Protegemos la transferencia de datos mediante TLS 1.2 o superior en todas las conexiones.</li>
                        <li><strong>Cifrado en Reposo:</strong> Los tokens de acceso y actualización de Google se almacenan cifrados en nuestra base de datos utilizando el estándar AES-256.</li>
                        <li><strong>Restricción de Acceso:</strong> El acceso a los tokens de Google está limitado únicamente a los procesos automatizados necesarios para las funciones de la plataforma. Ningún personal tiene acceso a tus credenciales privadas.</li>
                        <li><strong>Eliminación Automática:</strong> Al desconectar tu cuenta de Google o eliminar tu perfil de SMM, todos los tokens y datos asociados se borran permanentemente de forma inmediata.</li>
                    </ul>
                    <p className={styles.text} style={{ marginTop: '1rem' }}>
                        Puedes revocar el acceso en cualquier momento desde <a className={styles.link} href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.
                    </p>
                </section>

                {/* Limited Use */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Uso Limitado (Limited Use)</h2>
                    <p className={styles.text}>
                        SMM cumple estrictamente con la <a className={styles.link} href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer">Política de Datos del Usuario de los Servicios de API de Google</a>. La información obtenida a través de las APIs de Google se utiliza exclusivamente para proporcionar y mejorar las funciones de publicación de videos y gestión de anuncios dentro de la aplicación, y no se transfiere a terceros salvo para el cumplimiento legal o la mejora directa de estas funcionalidades.
                    </p>
                </section>

                {/* Third parties */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>¿Compartimos tus datos?</h2>
                    <p className={styles.text}>
                        No vendemos, cedemos ni compartimos tus datos de Google con terceros. La información de tu cuenta se usa exclusivamente para operar las funciones de SMM que tú has activado.
                    </p>
                </section>

                {/* Contact */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Contacto</h2>
                    <p className={styles.text}>
                        Si tienes preguntas sobre el uso de tus permisos de Google, escríbenos a:{' '}
                        <a className={styles.link} href="mailto:soporte@econos.com">soporte@econos.com</a>
                    </p>
                </section>

                <footer className={styles.footer}>
                    <Link href="/privacy-policy" className={styles.backLink}>← Política de Privacidad General</Link>
                    <Link href="/" className={styles.backLink}>← Volver al inicio</Link>
                </footer>
            </main>
        </div>
    );
}
