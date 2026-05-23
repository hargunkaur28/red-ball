const buildInvoiceHTML = (data) => {
  const {
    invoiceNumber,
    date,
    studentName,
    studentPhone,
    studentEmail,
    admissionNumber,
    items,
    subtotal,
    gstPercent,
    gstAmount,
    totalAmount,
    paymentMode,
    paymentId,
    status,
  } = data;

  const itemRows = (items || []).map((item, i) => `
    <tr>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#374151;">${i + 1}</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#374151;">${item.description || item.name}</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:center;">${item.quantity || 1}</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right;">&#8377;${item.rate || item.price}</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right;font-weight:600;">&#8377;${item.amount || (item.price * (item.quantity || 1))}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Red header bar -->
          <tr>
            <td style="background:#DC2626;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#ffffff;">
                    <div style="font-size:20px;font-weight:700;letter-spacing:0.5px;">&#127Cricket; RED BALL BOX CRICKET ACADEMY</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px;">123 Sports Complex, City Name &nbsp;|&nbsp; +91 XXXXXXXXXX</div>
                  </td>
                  <td align="right" style="color:#ffffff;white-space:nowrap;">
                    <div style="font-size:26px;font-weight:700;letter-spacing:2px;">INVOICE</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:2px;">${invoiceNumber || 'N/A'}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;">${date || new Date().toLocaleDateString('en-IN')}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bill To -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#DC2626;margin-bottom:8px;">Bill To</div>
                    <div style="font-size:15px;font-weight:700;color:#111827;">${studentName || 'N/A'}</div>
                    <div style="font-size:13px;color:#6b7280;margin-top:3px;">${studentPhone || ''} &nbsp;|&nbsp; ${studentEmail || ''}</div>
                    ${admissionNumber ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">Admission No: ${admissionNumber}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                <thead>
                  <tr style="background:#f3f4f6;">
                    <th style="padding:10px 14px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:left;">#</th>
                    <th style="padding:10px 14px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:left;">Description</th>
                    <th style="padding:10px 14px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:center;">Qty</th>
                    <th style="padding:10px 14px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:right;">Rate</th>
                    <th style="padding:10px 14px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:16px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td></td>
                  <td width="260" style="border-top:1px solid #e5e7eb;padding-top:12px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;">Subtotal</td>
                        <td style="font-size:13px;color:#374151;text-align:right;padding:4px 0;">&#8377;${subtotal || 0}</td>
                      </tr>
                      ${gstAmount ? `
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding:4px 0;">GST (${gstPercent || 0}%)</td>
                        <td style="font-size:13px;color:#374151;text-align:right;padding:4px 0;">&#8377;${gstAmount}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="font-size:16px;font-weight:700;color:#111827;padding:10px 0 4px;border-top:2px solid #DC2626;">TOTAL</td>
                        <td style="font-size:16px;font-weight:700;color:#DC2626;text-align:right;padding:10px 0 4px;border-top:2px solid #DC2626;">&#8377;${totalAmount || 0}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Info -->
          <tr>
            <td style="padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">
                <tr>
                  <td style="padding:14px 20px;">
                    <div style="font-size:13px;color:#166534;font-weight:700;margin-bottom:6px;">&#10003; ${status || 'PAID'}</div>
                    <div style="font-size:12px;color:#4b5563;"><strong>Payment Mode:</strong> ${paymentMode || 'N/A'}</div>
                    ${paymentId ? `<div style="font-size:12px;color:#4b5563;margin-top:2px;"><strong>Payment ID:</strong> ${paymentId}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <div style="font-size:12px;color:#9ca3af;">Thank you for choosing Red Ball Box Cricket Academy!</div>
              <div style="font-size:11px;color:#d1d5db;margin-top:4px;">This is a computer-generated invoice.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = { buildInvoiceHTML };
