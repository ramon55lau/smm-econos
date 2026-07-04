import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const BASE_URL = process.env.NEXTAUTH_URL || "https://smm.econos.io";
const LOGO_ECONOS = `${BASE_URL}/images/logo-econos.png`;
const LOGO_SMM = `${BASE_URL}/images/logo-smm.png`;

// Admin email for notifications (configurable via env)
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "wilter@econos.com";

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Econos - Social Media Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

// ─── Branded email wrapper ───────────────────────────────────
function brandedEmail(content: string): string {
  return `
    <div style="background-color: #f4f1ec; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header with logos -->
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 28px 32px; text-align: center;">
          <table align="center" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right: 16px;">
                <img src="${LOGO_ECONOS}" alt="Econos" height="36" style="display: block; height: 36px; width: auto;" />
              </td>
              <td style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 16px;">
                <img src="${LOGO_SMM}" alt="SMM" height="36" style="display: block; height: 36px; width: auto;" />
              </td>
            </tr>
          </table>
        </div>

        <!-- Body -->
        <div style="padding: 32px; color: #333333; font-size: 15px; line-height: 1.7;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="background: #f8f6f3; padding: 20px 32px; text-align: center; border-top: 1px solid #e8e4df;">
          <p style="margin: 0 0 8px; font-size: 11px; color: #999;">
            Este es un mensaje automático de <strong>Econos SMM</strong>. Por favor no respondas a este correo.
          </p>
          <p style="margin: 0; font-size: 11px; color: #bbb;">
            <a href="${BASE_URL}/privacy-policy" style="color: #b08d6d; text-decoration: none;">Privacidad</a>
            &nbsp;·&nbsp;
            <a href="${BASE_URL}/terms" style="color: #b08d6d; text-decoration: none;">Condiciones</a>
            &nbsp;·&nbsp;
            © ${new Date().getFullYear()} Econos
          </p>
        </div>
      </div>
    </div>
  `;
}

// ─── Branded button ──────────────────────────────────────────
function brandedButton(text: string, url: string, color: string = "#b08d6d"): string {
  return `
    <p style="text-align: center; margin: 24px 0;">
      <a href="${url}" style="display: inline-block; padding: 12px 28px; background: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        ${text}
      </a>
    </p>
  `;
}

// ─── Email templates ─────────────────────────────────────────
export const emailTemplates = {

  // ── User: Registration pending ──
  registrationPending: (name: string) => ({
    subject: "📋 Tu cuenta en Econos SMM está siendo revisada",
    html: brandedEmail(`
      <h2 style="color: #1a1a2e; margin: 0 0 16px;">¡Hola ${name}!</h2>
      <p>Gracias por registrarte en <strong>Econos - Social Media Manager</strong>.</p>
      <p>Tu cuenta ha sido creada exitosamente y actualmente se encuentra en <strong>revisión</strong> por nuestro equipo de administración.</p>
      <div style="background: #fef9f3; border-left: 4px solid #b08d6d; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          ⏳ Te enviaremos otro correo en cuanto tu cuenta sea aprobada para que puedas comenzar a gestionar tus redes sociales.
        </p>
      </div>
    `),
  }),

  // ── User: Registration approved ──
  registrationApproved: (name: string, email: string, expiresAt?: Date | string | null) => {
    const formattedDate = expiresAt
      ? new Date(expiresAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "No expira (Membresía ilimitada)";
    return {
      subject: "✅ ¡Bienvenido! Tu cuenta en Econos SMM ha sido aprobada",
      html: brandedEmail(`
        <h2 style="color: #28a745; margin: 0 0 16px;">¡Buenas noticias, ${name}!</h2>
        <p>Tu cuenta en <strong>Econos - Social Media Manager</strong> ha sido <strong style="color: #28a745;">aprobada</strong>.</p>
        <p>Ya puedes acceder a la plataforma con tus credenciales:</p>
        <div style="background: #f8f9fa; padding: 14px 18px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0 0;"><strong>Estado:</strong> <span style="color: #28a745;">Activo ✓</span></p>
          <p style="margin: 4px 0 0;"><strong>Vence el:</strong> <span style="color: #dc3545; font-weight: bold;">${formattedDate}</span></p>
        </div>
        ${brandedButton("Iniciar Sesión", `${BASE_URL}/login`, "#28a745")}
      `),
    };
  },

  // ── User: Membership expiring soon ──
  membershipExpiringSoon: (name: string, expiresAt: Date | string) => {
    const formattedDate = new Date(expiresAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    return {
      subject: "⚠️ Tu membresía en Econos SMM vencerá pronto",
      html: brandedEmail(`
        <h2 style="color: #dc3545; margin: 0 0 16px;">Renovación de Membresía Requerida</h2>
        <p>Hola ${name},</p>
        <p>Te recordamos que tu membresía en la plataforma <strong>Econos - Social Media Manager</strong> vencerá en los próximos 5 días.</p>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 15px; color: #856404;">
            📅 Fecha de vencimiento: <strong>${formattedDate}</strong>
          </p>
        </div>
        <p>Para evitar interrupciones al publicar y programar tus campañas en redes sociales, gestiona tu plan comunicándote con administración.</p>
        <p>Si ya has coordinado tu renovación, puedes ignorar este correo de forma segura.</p>
      `),
    };
  },

  // ── User: Password reset ──
  passwordReset: (name: string, resetUrl: string) => ({
    subject: "🔐 Recuperación de contraseña - Econos SMM",
    html: brandedEmail(`
      <h2 style="color: #1a1a2e; margin: 0 0 16px;">Hola ${name},</h2>
      <p>Has solicitado restablecer tu contraseña para tu cuenta en <strong>Econos SMM</strong>.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      ${brandedButton("Restablecer Contraseña", resetUrl, "#dc3545")}
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 18px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #856404;">
          ⚠️ Este enlace expirará en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </p>
      </div>
    `),
  }),

  // ── User: Account suspended ──
  accountSuspended: (name: string) => ({
    subject: "⚠️ Tu cuenta en Econos SMM ha sido suspendida",
    html: brandedEmail(`
      <h2 style="color: #dc3545; margin: 0 0 16px;">Tu cuenta ha sido suspendida</h2>
      <p>Hola ${name},</p>
      <p>Te informamos que tu cuenta en <strong>Econos - Social Media Manager</strong> ha sido temporalmente <strong style="color: #dc3545;">suspendida</strong> por el equipo de administración.</p>
      <div style="background: #fdf0f0; border-left: 4px solid #dc3545; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #721c24;">
          🚫 Durante la suspensión, no podrás iniciar sesión ni programar campañas o gestionar tus cuentas vinculadas.
        </p>
      </div>
      <p>Si consideras que esto es un error, ponte en contacto con nuestro equipo de soporte:</p>
      <p><a href="mailto:soporte@econos.com" style="color: #b08d6d; font-weight: 600;">soporte@econos.com</a></p>
    `),
  }),

  // ── User: Package/plan updated ──
  packageUpdated: (name: string, packageName: string, limits: { facebook: number; instagram: number; youtube: number }) => ({
    subject: "📦 Actualización de plan en Econos SMM",
    html: brandedEmail(`
      <h2 style="color: #1a1a2e; margin: 0 0 16px;">¡Tu plan ha sido actualizado!</h2>
      <p>Hola ${name},</p>
      <p>Te notificamos que se ha asignado un nuevo plan de suscripción a tu cuenta en <strong>Econos - Social Media Manager</strong>.</p>
      <div style="background: #e8f4fd; border-left: 4px solid #007bff; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #007bff;">
          📦 ${packageName}
        </p>
      </div>
      <h3 style="color: #333; margin-top: 20px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Nuevos límites de cuentas</h3>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 12px 0;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px;">👥 <strong>Meta (Facebook)</strong></td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #007bff; font-weight: 700;">Hasta ${limits.facebook} cuenta${limits.facebook === 1 ? '' : 's'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px;">📸 <strong>Instagram</strong></td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #007bff; font-weight: 700;">Hasta ${limits.instagram} cuenta${limits.instagram === 1 ? '' : 's'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-size: 14px;">🎥 <strong>YouTube / Google Ads</strong></td>
          <td style="padding: 10px 14px; font-size: 14px; text-align: right; color: #007bff; font-weight: 700;">Hasta ${limits.youtube} cuenta${limits.youtube === 1 ? '' : 's'}</td>
        </tr>
      </table>
      ${brandedButton("Ir a mi Dashboard", `${BASE_URL}`, "#007bff")}
    `),
  }),

  // ── Admin: New registration notification ──
  adminNewRegistration: (userName: string, userEmail: string) => ({
    subject: "🆕 Nuevo registro en Econos SMM - Pendiente de aprobación",
    html: brandedEmail(`
      <h2 style="color: #1a1a2e; margin: 0 0 16px;">Nuevo usuario registrado</h2>
      <p>Se ha registrado un nuevo usuario en la plataforma y requiere tu aprobación:</p>
      <div style="background: #f8f9fa; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e8e4df;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #666;">Nombre:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #333;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #666;">Email:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #333;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #666;">Estado:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #ffc107;">⏳ Pendiente</td>
          </tr>
        </table>
      </div>
      <p>Accede al panel de administración para revisar y aprobar la cuenta:</p>
      ${brandedButton("Ir al Panel de Usuarios", `${BASE_URL}/admin/users`, "#b08d6d")}
    `),
  }),
};
