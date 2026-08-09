import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM') ?? 'Investo <noreply@investo.bi>';
    this.appUrl = (config.get<string>('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000').trim();
  }

  // ── Send verification email ────────────────────────────────────────
  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;

    const html = this.buildVerificationHtml(name, verifyUrl);

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Verify your Investo account',
        html,
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${to}`, err);
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again later.',
      );
    }
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
