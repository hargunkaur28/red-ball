const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const razorpayConfig = {
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
  webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
};

// Verify Razorpay webhook signature — must receive the raw request body buffer/string
exports.verifyWebhookSignature = (rawBody, signature) => {
  const hash = crypto
    .createHmac('sha256', razorpayConfig.webhook_secret)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
};

// Verify payment signature (for frontend)
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', razorpayConfig.key_secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

// Create Razorpay order
exports.createRazorpayOrder = async (options) => {
  if (!razorpayConfig.key_id || !razorpayConfig.key_secret) {
    throw new Error('Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.');
  }
  return new Promise((resolve, reject) => {
    razorpayInstance.orders.create(options, (err, order) => {
      if (err) reject(err);
      else resolve(order);
    });
  });
};

// Fetch Razorpay payment details
exports.fetchPaymentDetails = async (paymentId) => {
  return new Promise((resolve, reject) => {
    razorpayInstance.payments.fetch(paymentId, (err, payment) => {
      if (err) reject(err);
      else resolve(payment);
    });
  });
};

// Create refund
exports.createRefund = async (paymentId, amount = null) => {
  return new Promise((resolve, reject) => {
    const options = amount ? { amount: amount * 100 } : {};
    razorpayInstance.payments.refund(paymentId, options, (err, refund) => {
      if (err) reject(err);
      else resolve(refund);
    });
  });
};

// Capture payment (for authorized payments)
exports.capturePayment = async (paymentId, amount) => {
  return new Promise((resolve, reject) => {
    razorpayInstance.payments.capture(paymentId, amount * 100, (err, payment) => {
      if (err) reject(err);
      else resolve(payment);
    });
  });
};

module.exports.razorpayInstance = razorpayInstance;
module.exports.razorpayConfig = razorpayConfig;
