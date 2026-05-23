const axios = require('axios');

const brevoClient = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: { 'Content-Type': 'application/json' },
});

const getSender = () => ({
  email: process.env.BREVO_SENDER_EMAIL || 'noreply@redballacademy.com',
  name: process.env.BREVO_SENDER_NAME || 'Red Ball Academy',
});

const send = (payload) =>
  brevoClient.post('/smtp/email', payload, {
    headers: { 'api-key': process.env.BREVO_API_KEY },
  });

async function sendPasswordResetOTP({ toEmail, toName, otp }) {
  return send({
    sender: getSender(),
    to: [{ email: toEmail, name: toName }],
    subject: 'Your Red Ball Academy Password Reset OTP',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#DC2626;">Red Ball Academy</h2>
        <p>Hi ${toName},</p>
        <p>Your password reset OTP is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#DC2626;
                    padding:20px;background:#f8f8f8;border-radius:8px;text-align:center;margin:20px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr/>
        <p style="font-size:12px;color:#999;">Red Ball Box Cricket Academy</p>
      </div>
    `,
  });
}

async function sendFailedLoginAlert({ targetEmail, attemptedEmail, role, attemptCount, ip, userAgent, timestamp }) {
  return send({
    sender: getSender(),
    to: [{ email: targetEmail, name: 'Admin' }],
    subject: `Security Alert: ${attemptCount} Failed Login Attempts — ${attemptedEmail}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:2px solid #DC2626;border-radius:8px;padding:24px;">
        <h2 style="color:#DC2626;margin-top:0;">Failed Login Alert</h2>
        <p>There have been <strong>${attemptCount} failed login attempts</strong> on your Red Ball Academy portal.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#666;width:140px;">Account</td><td><strong>${attemptedEmail}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Role</td><td>${role}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Attempt Count</td><td><strong>${attemptCount}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">IP Address</td><td>${ip}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Time (IST)</td><td>${timestamp}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Browser</td><td style="font-size:12px;">${userAgent}</td></tr>
        </table>
        <p>If this was you, please ignore. If not, consider changing your password immediately.</p>
      </div>
    `,
  });
}

async function sendMembershipWelcomeEmail({ toEmail, toName, planName, startDate, endDate, totalAmount, invoiceHtml, invoiceNumber }) {
  return send({
    sender: getSender(),
    to: [{ email: toEmail, name: toName }],
    subject: `Welcome to Red Ball Academy! Your ${planName} is Active`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#DC2626;color:white;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="margin:0;">Welcome to Red Ball Academy!</h1>
        </div>
        <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
          <p>Hi <strong>${toName}</strong>,</p>
          <p>Your membership has been activated successfully! Here are your membership details:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8f8f8;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:10px 16px;color:#666;">Plan</td><td style="padding:10px 16px;font-weight:bold;">${planName}</td></tr>
            <tr style="background:white;"><td style="padding:10px 16px;color:#666;">Valid From</td><td style="padding:10px 16px;">${startDate}</td></tr>
            <tr><td style="padding:10px 16px;color:#666;">Valid Until</td><td style="padding:10px 16px;">${endDate}</td></tr>
            <tr style="background:white;"><td style="padding:10px 16px;color:#666;">Amount Paid</td><td style="padding:10px 16px;font-weight:bold;color:#DC2626;">&#8377;${totalAmount}</td></tr>
            <tr><td style="padding:10px 16px;color:#666;">Invoice No.</td><td style="padding:10px 16px;">${invoiceNumber}</td></tr>
          </table>
          <p>Your invoice is included below. Please keep it for your records.</p>
          <p style="margin-top:24px;">See you on the field!</p>
          <p style="color:#DC2626;font-weight:bold;">Team Red Ball Academy</p>
        </div>
        <hr style="margin:32px 0;"/>
        <p style="font-size:11px;color:#999;text-align:center;">Invoice</p>
        ${invoiceHtml}
      </div>
    `,
  });
}

async function sendAdminPaymentAlert({ adminEmail, payerName, paymentType, amount, paymentMode, invoiceNumber, timestamp }) {
  return send({
    sender: getSender(),
    to: [{ email: adminEmail, name: 'Admin' }],
    subject: `New Payment Received — &#8377;${amount} (${paymentType})`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;padding:24px;">
        <h2 style="color:#16a34a;margin-top:0;">Payment Received</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#666;width:140px;">Amount</td><td><strong style="color:#16a34a;font-size:18px;">&#8377;${amount}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Payment Type</td><td>${paymentType}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Payer</td><td>${payerName}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Payment Mode</td><td>${paymentMode || 'N/A'}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Invoice No.</td><td>${invoiceNumber || 'N/A'}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Time (IST)</td><td>${timestamp}</td></tr>
        </table>
      </div>
    `,
  });
}

module.exports = {
  sendPasswordResetOTP,
  sendFailedLoginAlert,
  sendMembershipWelcomeEmail,
  sendAdminPaymentAlert,
};
