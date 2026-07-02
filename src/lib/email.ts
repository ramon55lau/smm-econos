import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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

export const emailTemplates = {
    registrationPending: (name: string) => ({
        subject: "Tu cuenta en Econos está siendo revisada",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">¡Hola ${name}!</h2>
        <p>Gracias por registrarte en <strong>Econos - Social Media Manager</strong>.</p>
        <p>Tu cuenta ha sido creada exitosamente y actualmente se encuentra en **revisión** por nuestro equipo de administración.</p>
        <p>Te enviaremos otro correo en cuanto tu cuenta sea aprobada para que puedas comenzar a gestionar tus redes sociales.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `,
    }),
    registrationApproved: (name: string, email: string) => ({
        subject: "¡Bienvenido! Tu cuenta en Econos ha sido aprobada",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #28a745;">¡Buenas noticias, ${name}!</h2>
        <p>Tu cuenta en <strong>Econos - Social Media Manager</strong> ha sido **aprobada**.</p>
        <p>Ya puedes acceder a la plataforma con tus credenciales:</p>
        <p style="background: #f4f4f4; padding: 10px; border-radius: 5px;">
          <strong>Email:</strong> ${email}<br>
          <strong>Estado:</strong> Activo
        </p>
        <p><a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Iniciar Sesión</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">¡Estamos emocionados de tenerte con nosotros!</p>
      </div>
    `,
    }),
    passwordReset: (name: string, resetUrl: string) => ({
        subject: "Recuperación de contraseña - Econos SMM",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2>Hola ${name},</h2>
        <p>Has solicitado restablecer tu contraseña para tu cuenta en Econos SMM.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste esto, puedes ignorar este correo de forma segura.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Econos Social Media Team</p>
      </div>
    `,
    }),
};
