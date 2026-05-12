// Brevo email sending placeholder
// Will integrate with @getbrevo/brevo SDK when API key is available

/**
 * Send an email via Brevo
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - Email HTML body
 * @param {Array} options.attachments - Array of { name, content } (base64)
 */
const sendEmail = async (options) => {
  try {
    console.log(`📧 Email would be sent to: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    // In production, this will use Brevo API
    return { success: true, messageId: `dev-${Date.now()}` };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
