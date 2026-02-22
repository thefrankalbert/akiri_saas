// ============================================
// Email Service — Resend
// ============================================

import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Akiri <noreply@akiri.app>';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Send an email. Returns true if sent, false if skipped (no API key configured).
 * In development without RESEND_API_KEY, logs to console instead.
 */
async function send(to: string, subject: string, html: string): Promise<boolean> {
  const resend = getResend();

  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[EMAIL] To: ${to} | Subject: ${subject}`);
    }
    return false;
  }

  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[EMAIL] Send failed:', err);
    return false;
  }
}

// ─── Templates ────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 24px">
<tr><td style="text-align:center;padding-bottom:32px">
  <span style="font-size:24px;font-weight:700;color:#fff">Akiri</span>
</td></tr>
<tr><td style="background:#13131a;border-radius:12px;padding:32px 24px;color:#e4e4e7">
  ${content}
</td></tr>
<tr><td style="text-align:center;padding-top:24px;color:#71717a;font-size:12px">
  &copy; ${new Date().getFullYear()} Akiri. Transport collaboratif pour la diaspora.
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Send OTP verification code
 */
export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return send(
    to,
    `Votre code de v\u00e9rification Akiri : ${code}`,
    baseLayout(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px">V\u00e9rification de votre compte</h2>
      <p style="margin:0 0 24px;line-height:1.6">Voici votre code de v\u00e9rification :</p>
      <div style="text-align:center;padding:24px;background:#1a1a24;border-radius:8px;margin-bottom:24px">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1">${code}</span>
      </div>
      <p style="margin:0;color:#a1a1aa;font-size:14px">Ce code expire dans 10 minutes. Si vous n\u2019avez pas demand\u00e9 ce code, ignorez cet email.</p>
    `)
  );
}

/**
 * Send delivery confirmation code to sender
 */
export async function sendConfirmationCodeEmail(
  to: string,
  code: string,
  route: string
): Promise<boolean> {
  return send(
    to,
    'Votre code de confirmation de livraison',
    baseLayout(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px">Code de confirmation</h2>
      <p style="margin:0 0 16px;line-height:1.6">Votre demande de transport <strong>${route}</strong> a \u00e9t\u00e9 accept\u00e9e et pay\u00e9e.</p>
      <p style="margin:0 0 24px;line-height:1.6">Communiquez ce code au voyageur <strong>uniquement apr\u00e8s r\u00e9ception</strong> de votre colis :</p>
      <div style="text-align:center;padding:24px;background:#1a1a24;border-radius:8px;margin-bottom:24px">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#22c55e">${code}</span>
      </div>
      <p style="margin:0;color:#a1a1aa;font-size:14px">Ne partagez ce code qu\u2019apr\u00e8s avoir v\u00e9rifi\u00e9 que votre colis est intact.</p>
    `)
  );
}

/**
 * Send notification email for request status changes
 */
export async function sendStatusEmail(
  to: string,
  subject: string,
  heading: string,
  body: string
): Promise<boolean> {
  return send(
    to,
    subject,
    baseLayout(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px">${heading}</h2>
      <p style="margin:0 0 24px;line-height:1.6">${body}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demandes"
         style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
        Voir mes demandes
      </a>
    `)
  );
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentEmail(
  to: string,
  amount: number,
  currency: string,
  route: string
): Promise<boolean> {
  return send(
    to,
    'Paiement confirm\u00e9 — Akiri',
    baseLayout(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px">Paiement confirm\u00e9</h2>
      <p style="margin:0 0 16px;line-height:1.6">Votre paiement de <strong>${amount} ${currency}</strong> pour le trajet <strong>${route}</strong> a \u00e9t\u00e9 autoris\u00e9.</p>
      <p style="margin:0 0 24px;line-height:1.6">Les fonds sont s\u00e9curis\u00e9s et seront lib\u00e9r\u00e9s au voyageur apr\u00e8s confirmation de la livraison.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demandes"
         style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
        Suivre ma demande
      </a>
    `)
  );
}

/**
 * Send payout notification to traveler
 */
export async function sendPayoutEmail(
  to: string,
  amount: number,
  currency: string
): Promise<boolean> {
  return send(
    to,
    'Paiement lib\u00e9r\u00e9 — Akiri',
    baseLayout(`
      <h2 style="margin:0 0 16px;color:#fff;font-size:20px">Paiement re\u00e7u</h2>
      <p style="margin:0 0 16px;line-height:1.6">La livraison a \u00e9t\u00e9 confirm\u00e9e. <strong>${amount} ${currency}</strong> vont \u00eatre vers\u00e9s sur votre compte.</p>
      <p style="margin:0;color:#a1a1aa;font-size:14px">Le virement peut prendre 2 \u00e0 5 jours ouvrables selon votre banque.</p>
    `)
  );
}
