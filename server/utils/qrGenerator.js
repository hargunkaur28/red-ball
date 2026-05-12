const QRCode = require('qrcode');

/**
 * Generate a QR code as a data URL
 * @param {string} data - Data to encode in the QR code
 * @returns {Promise<string>} QR code as base64 data URL
 */
const generateQR = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0A0A0B',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Generation Error:', error);
    throw error;
  }
};

/**
 * Generate a QR code as a buffer
 * @param {string} data - Data to encode
 * @returns {Promise<Buffer>} QR code image buffer
 */
const generateQRBuffer = async (data) => {
  try {
    return await QRCode.toBuffer(data, {
      width: 400,
      margin: 2,
    });
  } catch (error) {
    console.error('QR Buffer Generation Error:', error);
    throw error;
  }
};

module.exports = { generateQR, generateQRBuffer };
