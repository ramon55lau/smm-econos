import Image from "next/image";
import Link from "next/link";
import styles from "../terms/TermsOfService.module.css";

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.content}`}>
        <div className={styles.logoHeader}>
          <Image src="/images/logo-econos.png" alt="Econos" width={240} height={75} className={styles.logo} priority />
          <div className={styles.headerDivider}></div>
          <Image src="/images/logo-smm.png" alt="SMM" width={150} height={60} className={styles.logo} priority />
        </div>

        <h1 className={styles.title}>Política de Privacidad</h1>
        <p className={styles.lastUpdated}>Última actualización: {lastUpdated}</p>

        <section className={styles.section}>
          <p>
            En <strong>Social Media Manager (SMM)</strong> de Econos, nos comprometemos a proteger tu privacidad y a ser completamente
            transparentes sobre cómo utilizamos tus datos. Esta política describe el tratamiento de la información que recopilamos
            cuando usas nuestra plataforma.
          </p>
        </section>

        <section className={styles.section}>
          <h2>1. Información que Recopilamos</h2>
          <p>Recopilamos la información necesaria para operar el servicio:</p>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y foto de perfil obtenidos mediante inicio de sesión con Google o credenciales propias.</li>
            <li><strong>Tokens de acceso:</strong> credenciales OAuth de Google y Meta para interactuar con sus APIs en tu nombre.</li>
            <li><strong>Contenido publicado:</strong> imágenes, videos y textos que tú generas y publicas a través de SMM.</li>
            <li><strong>Datos de uso:</strong> registros de actividad dentro de la plataforma para mejorar el servicio.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>2. Permisos de Google</h2>
          <p>
            SMM solicita permisos a los servicios de Google para las siguientes funciones específicas. Para poder publicar en YouTube y administrar anuncios, necesitamos que Google nos autorice a actuar en tu nombre de forma segura mediante OAuth 2.0. A continuación explicamos cada permiso solicitado:
          </p>
          <ul>
            <li><strong>youtube.upload (Publicación en YouTube):</strong> Permite a SMM subir videos de inmuebles a tu canal de YouTube únicamente cuando tú confirmas la publicación de forma explícita. La aplicación nunca sube contenido sin tu aprobación previa.</li>
            <li><strong>youtube.readonly (Lectura de datos de YouTube):</strong> Nos permite leer el estado y las métricas básicas (título, estado de publicación, vistas) de los videos que hemos subido, para mostrarte el progreso en tu panel de control.</li>
            <li><strong>Google Ads (adwords):</strong> Usado para crear y gestionar campañas publicitarias que promocionan tus propiedades en los resultados de búsqueda de Google. Cada campaña se crea bajo tu supervisión directa y puedes pausarla en cualquier momento.</li>
            <li><strong>openid / email / profile (Identificación y Perfil):</strong> Usamos tu nombre y correo de Google únicamente para crear y autenticar tu cuenta en SMM. No accedemos a ningún otro dato personal de tu cuenta de Google ni lo compartimos con terceros.</li>
          </ul>
          <p>
            Para más detalles sobre el uso de datos de Google, consulta nuestra{" "}
            <Link href="/privacy-policy/google" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>
              Política de Privacidad — Servicios de Google
            </Link>.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Permisos de Meta</h2>
          <p>
            SMM solicita acceso a Meta (Facebook e Instagram) para:
          </p>
          <ul>
            <li>Publicar imágenes y videos en páginas de Facebook e Instagram que administras.</li>
            <li>Gestionar campañas publicitarias en tus Cuentas Publicitarias de Meta.</li>
            <li>Leer estadísticas básicas de tus publicaciones para mostrártelas en el panel.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Almacenamiento y Seguridad</h2>
          <p>
            Los tokens de acceso de Google y Meta se almacenan cifrados en nuestra base de datos. Solo se utilizan para ejecutar
            las acciones que tú autorizas dentro de SMM. Puedes revocar el acceso en cualquier momento desde la
            configuración de tu cuenta de Google (
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>
              myaccount.google.com/permissions
            </a>
            ) o de Meta.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Uso Compartido de Datos</h2>
          <p>
            No vendemos, alquilamos ni compartimos tus datos personales o de campaña con terceros para fines ajenos a la
            operativa técnica del servicio. Tus datos se utilizan exclusivamente para ejecutar las funcionalidades que tú
            has activado dentro de SMM.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Tus Derechos</h2>
          <ul>
            <li>Acceder a los datos que tenemos sobre tu cuenta.</li>
            <li>Solicitar la eliminación de tu cuenta y todos tus datos asociados.</li>
            <li>Revocar permisos de Google o Meta en cualquier momento sin afectar el resto de la plataforma.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. Contacto</h2>
          <p>
            Si tienes alguna pregunta sobre esta política, escríbenos a:{" "}
            <a href="mailto:soporte@econos.com" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>
              soporte@econos.com
            </a>
          </p>
        </section>

        <div className={styles.footer}>
          © {new Date().getFullYear()} Econos. Todos los derechos reservados.
          {" · "}
          <Link href="/terms" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>
            Condiciones de Uso
          </Link>
          {" · "}
          <Link href="/privacy-policy/google" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>
            Privacidad – Google
          </Link>
        </div>
      </div>
    </div>
  );
}
