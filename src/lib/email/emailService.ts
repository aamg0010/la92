/**
 * Email Service
 *
 * Para habilitar el envío de emails, necesitas configurar un proveedor SMTP.
 * Opciones recomendadas:
 *
 * 1. SendGrid (recomendado para producción)
 *    - Crear cuenta en sendgrid.com
 *    - Obtener API key
 *    - Configurar en variables de entorno
 *
 * 2. Gmail SMTP (para desarrollo/pequeño volumen)
 *    - Habilitar "Less secure apps" o usar App Password
 *    - smtp.gmail.com:587
 *
 * 3. Mailgun, AWS SES, etc.
 *
 * Configuración necesaria en .env:
 * VITE_EMAIL_PROVIDER=sendgrid|smtp
 * VITE_SENDGRID_API_KEY=xxx
 * VITE_SMTP_HOST=smtp.gmail.com
 * VITE_SMTP_PORT=587
 * VITE_SMTP_USER=xxx
 * VITE_SMTP_PASS=xxx
 * VITE_EMAIL_FROM=noreply@clinident.trycompany.es
 */

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface LicenseEmailData {
  clinicName: string;
  adminEmail: string;
  adminName: string;
  licenseCode: string;
  plan: string;
  maxUsers: number;
  expiresAt: string;
  loginUrl: string;
}

export function generateLicenseEmailHtml(data: LicenseEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Clinident</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Clinident</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Sistema de Gestión Odontológica</p>
      </td>
    </tr>
    <tr>
      <td style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin: 0 0 20px;">¡Bienvenido/a ${data.adminName}!</h2>

        <p style="color: #64748b; line-height: 1.6;">
          Su licencia de <strong>Clinident</strong> para <strong>${data.clinicName}</strong> ha sido activada correctamente.
        </p>

        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #0ea5e9; margin: 0 0 16px; font-size: 16px;">Datos de su Licencia</h3>

          <table width="100%" style="color: #475569; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0;"><strong>Código de Licencia:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; color: #0ea5e9; font-weight: bold;">${data.licenseCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Plan:</strong></td>
              <td style="padding: 8px 0;">${data.plan}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Usuarios Máximos:</strong></td>
              <td style="padding: 8px 0;">${data.maxUsers}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Válida hasta:</strong></td>
              <td style="padding: 8px 0;">${data.expiresAt}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.loginUrl}"
             style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Acceder a Clinident
          </a>
        </div>

        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
          <p style="color: #92400e; margin: 0; font-size: 13px;">
            <strong>Importante:</strong> Al acceder por primera vez, deberá aceptar los Términos y Condiciones y la Política de Privacidad (RGPD).
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Este email fue enviado automáticamente por Clinident.<br>
          Si tiene alguna pregunta, contacte con soporte@trycompany.es
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateLicenseEmailText(data: LicenseEmailData): string {
  return `
¡Bienvenido/a ${data.adminName}!

Su licencia de Clinident para ${data.clinicName} ha sido activada.

DATOS DE SU LICENCIA
====================
Código de Licencia: ${data.licenseCode}
Plan: ${data.plan}
Usuarios Máximos: ${data.maxUsers}
Válida hasta: ${data.expiresAt}

Acceder a Clinident: ${data.loginUrl}

IMPORTANTE: Al acceder por primera vez, deberá aceptar los Términos y Condiciones y la Política de Privacidad (RGPD).

---
Este email fue enviado automáticamente por Clinident.
Si tiene alguna pregunta, contacte con soporte@trycompany.es
  `.trim();
}

// Placeholder para el envío real de email
// En producción, esto se conectaría con SendGrid, SMTP, etc.
export async function sendEmail(config: EmailConfig): Promise<boolean> {
  console.log("📧 Email would be sent:", {
    to: config.to,
    subject: config.subject,
  });

  // TODO: Implementar con SendGrid o SMTP
  // const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
  // if (SENDGRID_API_KEY) {
  //   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${SENDGRID_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       personalizations: [{ to: [{ email: config.to }] }],
  //       from: { email: 'noreply@clinident.trycompany.es' },
  //       subject: config.subject,
  //       content: [
  //         { type: 'text/plain', value: config.text },
  //         { type: 'text/html', value: config.html },
  //       ],
  //     }),
  //   });
  //   return response.ok;
  // }

  return true;
}

export async function sendLicenseEmail(data: LicenseEmailData): Promise<boolean> {
  return sendEmail({
    to: data.adminEmail,
    subject: `Bienvenido a Clinident - Licencia activada para ${data.clinicName}`,
    html: generateLicenseEmailHtml(data),
    text: generateLicenseEmailText(data),
  });
}
