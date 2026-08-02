import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { UPLOADS_ROOT } from '../middleware/upload';
import { env } from '../config/env';

export interface CertificatePdfData {
  certificateNumber: string;
  studentName: string;
  universityName: string;
  course: string;
  grade?: string | null;
  title: string;
  issueDate: Date;
  logoPath?: string | null;
  tokenId?: string | null;
  template?: 'CLASSIC' | 'MODERN' | 'ELEGANT' | string | null;
  expiresAt?: Date | null;
}

const templateTheme = (template?: string | null) => {
  switch (template) {
    case 'MODERN':
      return { bg: '#0f172a', accent: '#14b8a6', text: '#f8fafc', muted: '#94a3b8', line: '#14b8a6' };
    case 'ELEGANT':
      return { bg: '#fffbeb', accent: '#92400e', text: '#1c1917', muted: '#78716c', line: '#b45309' };
    default:
      return { bg: '#f8fafc', accent: '#0f766e', text: '#0f172a', muted: '#64748b', line: '#0f766e' };
  }
};

export const generateQrCode = async (
  certificateId: string,
  tokenId?: string | null
): Promise<{ filePath: string; url: string }> => {
  const verifyUrl = tokenId
    ? `${env.clientUrl}/verify/${tokenId}`
    : `${env.clientUrl}/verify/certificate/${certificateId}`;

  const fileName = `qr-${certificateId}.png`;
  const filePath = path.join(UPLOADS_ROOT, 'qrcodes', fileName);

  await QRCode.toFile(filePath, verifyUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return { filePath, url: `/uploads/qrcodes/${fileName}` };
};

export const generateCertificatePdf = async (
  data: CertificatePdfData,
  qrPath?: string
): Promise<{ filePath: string; url: string }> => {
  const fileName = `${data.certificateNumber}.pdf`;
  const filePath = path.join(UPLOADS_ROOT, 'certificates', fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    const theme = templateTheme(data.template);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(theme.bg);

    // Border
    doc
      .strokeColor(theme.accent)
      .lineWidth(3)
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .stroke();

    doc
      .strokeColor(theme.muted)
      .lineWidth(1)
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .stroke();

    // Logo
    if (data.logoPath && fs.existsSync(data.logoPath)) {
      try {
        doc.image(data.logoPath, doc.page.width / 2 - 40, 50, { width: 80, height: 80 });
      } catch {
        // skip invalid logo
      }
    }

    doc
      .fillColor(theme.accent)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(data.universityName.toUpperCase(), 50, data.logoPath ? 140 : 60, {
        align: 'center',
      });

    doc
      .fillColor(theme.text)
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('CERTIFICATE OF ACHIEVEMENT', 50, data.logoPath ? 165 : 90, {
        align: 'center',
      });

    doc
      .fillColor(theme.muted)
      .fontSize(12)
      .font('Helvetica')
      .text(data.title, 50, data.logoPath ? 205 : 130, { align: 'center' });

    doc
      .fillColor(theme.muted)
      .fontSize(12)
      .text('This is to certify that', 50, 250, { align: 'center' });

    doc
      .fillColor(theme.text)
      .fontSize(26)
      .font('Helvetica-Bold')
      .text(data.studentName, 50, 275, { align: 'center' });

    doc
      .moveTo(doc.page.width / 2 - 150, 310)
      .lineTo(doc.page.width / 2 + 150, 310)
      .strokeColor(theme.line)
      .stroke();

    doc
      .fillColor(theme.text)
      .fontSize(14)
      .font('Helvetica')
      .text(`has successfully completed the course`, 50, 325, { align: 'center' });

    doc
      .fillColor(theme.accent)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(data.course, 50, 350, { align: 'center' });

    if (data.grade) {
      doc
        .fillColor(theme.text)
        .fontSize(13)
        .font('Helvetica')
        .text(`Grade: ${data.grade}`, 50, 380, { align: 'center' });
    }

    const issueDateStr = data.issueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc
      .fillColor(theme.muted)
      .fontSize(11)
      .text(`Issued on ${issueDateStr}`, 60, 430);

    doc.text(`Certificate No: ${data.certificateNumber}`, 60, 450);

    if (data.tokenId) {
      doc.text(`NFT Token ID: ${data.tokenId}`, 60, 470);
    }

    if (data.expiresAt) {
      doc.text(
        `Valid until: ${data.expiresAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        60,
        data.tokenId ? 490 : 470
      );
    }

    if (data.template) {
      doc
        .fillColor(theme.muted)
        .fontSize(9)
        .text(`Template: ${data.template}`, 60, 515);
    }

    if (qrPath && fs.existsSync(qrPath)) {
      doc.image(qrPath, doc.page.width - 150, 410, { width: 90, height: 90 });
      doc
        .fillColor(theme.muted)
        .fontSize(8)
        .text('Scan to verify', doc.page.width - 150, 505, { width: 90, align: 'center' });
    }

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return { filePath, url: `/uploads/certificates/${fileName}` };
};
