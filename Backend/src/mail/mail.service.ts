import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

type Provider = 'smtp' | 'resend';

/**
 * Sends transactional emails.
 *
 * Provider is chosen with the MAIL_PROVIDER environment variable:
 *   - "resend" (default)  -> Resend API, uses RESEND_API_KEY and EMAIL_FROM
 *   - "smtp"              -> your own mail server through Nodemailer, uses
 *                            SMTP_HOST, SMTP_PORT (default 587), SMTP_USER,
 *                            SMTP_PASS and optionally SMTP_FROM
 *
 * To go back to Resend at any time, set MAIL_PROVIDER=resend (or remove it)
 * and restart the app.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly provider: Provider;
  private readonly resend?: Resend;
  private readonly transporter?: nodemailer.Transporter;
  private readonly from: string;
  private readonly appUrl: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.appUrl = (config.get<string>('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000').trim();

    const requested = (config.get<string>('MAIL_PROVIDER') ?? 'resend').trim().toLowerCase();
    this.provider = requested === 'smtp' ? 'smtp' : 'resend';

    if (this.provider === 'smtp') {
      const host = config.get<string>('SMTP_HOST');
      const port = parseInt(config.get<string>('SMTP_PORT') ?? '587', 10);
      const user = config.get<string>('SMTP_USER');
      const pass = config.get<string>('SMTP_PASS');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        // Port 465 = implicit TLS. Port 587 = STARTTLS (upgrade to TLS is required).
        secure: port === 465,
        requireTLS: port !== 465,
        auth: user && pass ? { user, pass } : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      });

      // The "from" address should match the mailbox used to log in.
      this.from = config.get<string>('SMTP_FROM') ?? `Investo <${user}>`;
    } else {
      this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
      this.from = config.get<string>('EMAIL_FROM') ?? 'Investo <noreply@investo.bi>';
    }
  }

  // Check the SMTP connection when the app starts (does not block startup).
  onModuleInit(): void {
    if (this.provider === 'smtp' && this.transporter) {
      this.transporter
        .verify()
        .then(() => this.logger.log('Mail provider: SMTP (connection verified)'))
        .catch((err: Error) =>
          this.logger.warn(`Mail provider: SMTP, but the connection check failed: ${err.message}`),
        );
    } else {
      this.logger.log('Mail provider: Resend');
    }
  }

  // ── Send verification email ────────────────────────────────────────
  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;
    const subject = 'Verify your Investo account';

    const html = this.buildVerificationHtml(name, verifyUrl);
    const text = this.buildVerificationText(name, verifyUrl);

    try {
      if (this.provider === 'smtp') {
        await this.transporter!.sendMail({
          from: this.from,
          to,
          subject,
          html,
          text,
        });
      } else {
        await this.resend!.emails.send({
          from: this.from,
          to,
          subject,
          html,
          text,
        });
      }
      this.logger.log(`Verification email sent to ${to} (${this.provider})`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${to} (${this.provider})`, err);
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again later.',
      );
    }
  }

  // ── Plain-text version (improves deliverability) ───────────────────
  private buildVerificationText(name: string, verifyUrl: string): string {
    return [
      `Welcome to Investo, ${name}!`,
      '',
      'Thank you for creating your account. To start managing your investments,',
      'please verify your email address by opening this link:',
      '',
      verifyUrl,
      '',
      'This link expires in 24 hours. If it expires, you can request a new',
      'verification email from the login page.',
      '',
      "If you didn't create an Investo account, you can safely ignore this email.",
    ].join('\n');
  }

  // ── HTML email template ────────────────────────────────────────────
  private buildVerificationHtml(name: string, verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your Investo account</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f2167;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                📈 Investo
              </h1>
              <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">
                Investment Management Platform
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;font-weight:700;">
                Welcome to Investo, ${name}!
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                Thank you for creating your account. To start managing your investments, please verify
                your email address by clicking the button below.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:#0f2167;color:#ffffff;font-size:15px;
                              font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;
                              letter-spacing:0.3px;">
                      Verify my email address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${verifyUrl}" style="font-size:13px;color:#0f2167;">${verifyUrl}</a>
              </p>

              <!-- Expiry notice -->
              <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                  ⏰ <strong>This link expires in 24 hours.</strong>
                  If it expires, you can request a new verification email from the login page.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                If you didn't create an Investo account, you can safely ignore this email.<br />
                © ${new Date().getFullYear()} Investo. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}