import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const smtpHost =
      this.config.get<string>('SMTP_HOST', 'smtp.gmail.com') || 'smtp.gmail.com';
    const smtpPort = 587;
    const smtpUser =
      this.config.get<string>('SMTP_USER') || 'gbaghdasaryan1998@gmail.com';
    const smtpPass = 'flznjagthskwqyhb';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      debug: true,
      logger: true,
    });
  }

  async sendOtp(
    to: string,
    code: string,
    type: 'email_verification' | 'password_reset',
  ): Promise<void> {
    const isVerification = type === 'email_verification';
    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM', 'noreply@example.com'),
      to,
      subject: isVerification ? 'Verify your email' : 'Reset your password',
      text: isVerification
        ? `Your verification code is: ${code}. Expires in 10 minutes.`
        : `Your password reset code is: ${code}. Expires in 10 minutes.`,
    });
  }

  async sendSecurityAlert(
    to: string,
    type: 'incorrect_otp' | 'failed_login',
  ): Promise<void> {
    const subjects: Record<typeof type, string> = {
      incorrect_otp: 'Incorrect verification code entered',
      failed_login: 'Failed sign-in attempt on your account',
    };
    const texts: Record<typeof type, string> = {
      incorrect_otp:
        'Someone just entered an incorrect verification code for your account. If this was not you, your account may be at risk.',
      failed_login:
        'A failed sign-in attempt was made on your account. If this was not you, please change your password immediately.',
    };
    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM', 'noreply@example.com'),
      to,
      subject: subjects[type],
      text: texts[type],
    });
  }
}
