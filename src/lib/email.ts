export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log('[Email][SIMULATED] To:', to, 'Subject:', subject);
    return { ok: true, simulated: true };
  }

  // If SMTP is configured, attempt to send via nodemailer if installed
  try {
    // Dynamically import to avoid adding dependency unless configured
    // @ts-ignore
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: (process.env.SMTP_SECURE === 'true') || false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@beuty.local', to, subject, html, text });
    console.log('Email sent:', info.messageId);
    return { ok: true, info };
  } catch (e) {
    console.error('Failed to send email:', e);
    return { ok: false, error: String(e) };
  }
}
