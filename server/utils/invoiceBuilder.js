/**
 * Build HTML invoice template
 * @param {Object} data - Invoice data
 * @returns {string} HTML string
 */
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
        .invoice { max-width: 700px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #DC2626; padding-bottom: 20px; }
        .logo-section h1 { margin: 0; color: #DC2626; font-size: 24px; font-weight: 700; }
        .logo-section p { margin: 4px 0; font-size: 12px; color: #666; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { margin: 0; font-size: 28px; color: #333; }
        .invoice-meta p { margin: 4px 0; font-size: 13px; color: #666; }
        .bill-to { margin-bottom: 24px; }
        .bill-to h3 { margin: 0 0 8px 0; color: #DC2626; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .bill-to p { margin: 2px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { background: #f8f8f8; border: 1px solid #e0e0e0; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { border: 1px solid #e0e0e0; padding: 10px 12px; font-size: 14px; }
        .totals { text-align: right; margin-top: 16px; }
        .totals p { margin: 4px 0; font-size: 14px; }
        .totals .total { font-size: 18px; font-weight: 700; color: #DC2626; }
        .payment-info { margin-top: 24px; padding: 16px; background: #f8f8f8; border-radius: 6px; }
        .payment-info p { margin: 4px 0; font-size: 13px; }
        .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="logo-section">
            <h1>🏏 RED BALL CRICKET ACADEMY</h1>
            <p>123 Sports Complex, City Name</p>
            <p>GSTIN: XXXXXXXXXXXX</p>
            <p>Phone: +91 XXXXXXXXXX</p>
          </div>
          <div class="invoice-meta">
            <h2>INVOICE</h2>
            <p><strong>${invoiceNumber || 'N/A'}</strong></p>
            <p>Date: ${date || new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
        <div class="bill-to">
          <h3>Bill To</h3>
          <p><strong>${studentName || 'N/A'}</strong></p>
          <p>${studentPhone || ''} | ${studentEmail || ''}</p>
          ${admissionNumber ? `<p>Admission No: ${admissionNumber}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(items || []).map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.description || item.name}</td>
                <td>${item.quantity || 1}</td>
                <td>₹${item.rate || item.price}</td>
                <td>₹${item.amount || item.price * (item.quantity || 1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p>Subtotal: ₹${subtotal || 0}</p>
          <p>GST (${gstPercent || 18}%): ₹${gstAmount || 0}</p>
          <p class="total">TOTAL: ₹${totalAmount || 0}</p>
        </div>
        <div class="payment-info">
          <p><strong>Payment Mode:</strong> ${paymentMode || 'N/A'}</p>
          ${paymentId ? `<p><strong>Payment ID:</strong> ${paymentId}</p>` : ''}
          <p><strong>Status:</strong> ${status || 'PAID'} ✓</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing Red Ball Cricket Academy!</p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { buildInvoiceHTML };
