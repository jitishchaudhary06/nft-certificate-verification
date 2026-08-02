import nodemailer from 'nodemailer';
import { env } from '../config/env';

const createTransporter = () => {
  if (!env.smtp.user || !env.smtp.pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
};

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[Email] SMTP not configured. Skipping email to:', payload.to);
    console.info('[Email Preview]', payload.subject);
    return false;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    attachments: payload.attachments,
  });
  return true;
};

export const emailTemplates = {
  verifyEmail: (name: string, link: string) => ({
    subject: 'Verify your email — NFT Certificate Generator',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h2>Welcome, ${name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <p><a href="${link}" style="background:#0f766e;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">Verify Email</a></p>
        <p style="color:#666;font-size:12px">Or open: ${link}</p>
      </div>
    `,
  }),
  resetPassword: (name: string, link: string) => ({
    subject: 'Reset your password — NFT Certificate Generator',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h2>Hello, ${name}</h2>
        <p>You requested a password reset. Click below to set a new password.</p>
        <p><a href="${link}" style="background:#0f766e;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">Reset Password</a></p>
        <p style="color:#666;font-size:12px">This link expires in 1 hour.</p>
      </div>
    `,
  }),
  certificateIssued: (name: string, course: string, verifyLink: string) => ({
    subject: `Your certificate for ${course} is ready`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h2>Congratulations, ${name}!</h2>
        <p>Your certificate for <strong>${course}</strong> has been issued.</p>
        <p><a href="${verifyLink}" style="background:#0f766e;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">View Certificate</a></p>
      </div>
    `,
  }),
};
