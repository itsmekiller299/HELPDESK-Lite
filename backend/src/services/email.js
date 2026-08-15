const nodemailer = require('nodemailer');

function getTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendTicketEmail({ to, recipientName, ticket, subject, preview }) {
  const transport = getTransport();
  if (!transport || !to) return { delivered: false, reason: 'SMTP is not configured' };

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const ticketUrl = `${appUrl}/tickets/${ticket.id}`;
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `[HelpDesk Lite] ${subject}`,
      text: `Hi ${recipientName},\n\n${preview}\n\nView ticket #${ticket.id}: ${ticketUrl}`,
      html: `<p>Hi ${escapeHtml(recipientName)},</p><p>${escapeHtml(preview)}</p><p><a href="${ticketUrl}">View ticket #${ticket.id}</a></p>`,
    });
    return { delivered: true };
  } catch (error) {
    console.error('Email delivery failed:', error.message);
    return { delivered: false, reason: 'SMTP delivery failed' };
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

module.exports = { sendTicketEmail, escapeHtml };
