const REQUIRED_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
  'CLIENT_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'BREVO_API_KEY',
  'SUPER_ADMIN_EMAIL',
  'SUPER_ADMIN_CODE',
  'MANAGER_EMAIL',
  'MANAGER_CODE',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables:\n  ${missing.join('\n  ')}\nSet them in server/.env before starting.`
    );
  }
}

module.exports = validateEnv;
