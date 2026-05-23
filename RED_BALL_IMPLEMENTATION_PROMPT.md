# Red Ball Academy — Full Implementation Prompt
> Hand this entire document to your AI coding assistant. It contains every file path, current state, and exact changes needed.

---

## PROJECT SNAPSHOT

**Stack:** Node.js + Express · MongoDB/Mongoose · React + Vite · Razorpay · Cloudinary · Socket.io · Brevo (email — configured but not wired up yet)

**Key folders:**
```
server/
  index.js               ← startup & seed logic
  controllers/
    auth.controller.js   ← login, register, forgot-password, reset-password
    payment.controller.js ← all payment flows + activateOnPaymentSuccess()
  models/
    User.js              ← user schema
    Payment.js           ← payment schema (has emailSentAt field)
    Membership.js        ← membership schema
  utils/
    invoiceBuilder.js    ← HTML invoice template (already built)
  middleware/
    auth.middleware.js   ← JWT verify
  routes/
    auth.routes.js       ← /api/auth/* routes
  config/
    razorpay.js
  .env                   ← secrets file
```

---

## ANSWERING YOUR BREVO QUESTION FIRST

**Yes — use Brevo for everything.** It's already in your stack (just commented out in `.env`). It handles:
- Transactional emails (OTP, welcome, invoices, alerts) — free up to 300/day
- HTML email templates with attachments
- No separate service needed

Install the official package:
```bash
npm install @getbrevo/brevo
```

Create `server/utils/emailService.js` as your single email utility (see below). Every email in this project goes through that one file.

---

## TASK 1 — Move Admin Credentials to `.env` (no more hardcoded emails)

### What's wrong now
`server/index.js` lines 177–199 hardcode the seeded credentials:
```js
email: 'admin@redball.com',
password: 'Admin@123',
// and
email: 'restaurant@redball.com',
password: 'Manager@123',
```

### What to do

**Step 1 — Add to `server/.env`:**
```env
# Admin seed credentials (change these to your real values)
SUPER_ADMIN_EMAIL=banshu31st@gmail.com
SUPER_ADMIN_PASSWORD=YourSecurePassword@123
SUPER_ADMIN_NAME=Super Admin

MANAGER_EMAIL=your-restaurant-email@gmail.com
MANAGER_PASSWORD=YourManagerPassword@123
MANAGER_NAME=Restaurant Manager

RECEPTION_EMAIL=reception@redball.com
RECEPTION_PASSWORD=Reception@123

# Admin notification email (where all alerts and payment mails go)
ADMIN_NOTIFICATION_EMAIL=banshu31st@gmail.com
```

**Step 2 — Update `server/index.js` seed block (lines 175–212):**
```js
const existingAdmin = await User.findOne({ role: 'superadmin' });
if (!existingAdmin) {
  await User.create({
    name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL,
    phone: '9999999999',
    password: process.env.SUPER_ADMIN_PASSWORD,
    role: 'superadmin',
  });
  console.log(`🔐 Superadmin seeded: ${process.env.SUPER_ADMIN_EMAIL}`);
}

const existingManager = await User.findOne({ role: 'manager' });
if (!existingManager) {
  await User.create({
    name: process.env.MANAGER_NAME || 'Restaurant Manager',
    email: process.env.MANAGER_EMAIL,
    phone: '8888888888',
    password: process.env.MANAGER_PASSWORD,
    role: 'manager',
  });
  console.log(`👨‍🍳 Manager seeded: ${process.env.MANAGER_EMAIL}`);
}
```

> **To change the email in future:** just update the `.env` values and delete the DB user. On next server restart it re-seeds with the new email. No code changes ever needed.

---

## TASK 2 — 6-Digit Security Code for Super-Admin and Manager Login

### Concept
Super-admin and manager logins require **email + password + 6-digit ENV code**. Regular users (role: `user`, `receptionist`) login with just email + password as before. The codes live only in `.env` — never in the DB.

### Step 1 — Add to `server/.env`
```env
# 6-digit security codes (change these to anything you want)
SUPER_ADMIN_CODE=847291
MANAGER_CODE=563018
```

### Step 2 — Update `server/controllers/auth.controller.js` — `login()` function

After the password match check and before generating tokens, add:

```js
// 6-digit code check for privileged roles
if (user.role === 'superadmin' || user.role === 'manager') {
  const { securityCode } = req.body;
  if (!securityCode) {
    return res.status(401).json({ 
      message: 'Security code required for admin login.',
      requiresCode: true 
    });
  }
  const expectedCode = user.role === 'superadmin'
    ? process.env.SUPER_ADMIN_CODE
    : process.env.MANAGER_CODE;

  if (securityCode !== expectedCode) {
    // Track failed attempt (see Task 3 below for full attempt tracking)
    return res.status(401).json({ message: 'Invalid security code.' });
  }
}
```

### Step 3 — Frontend: `client/src/pages/auth/Auth.jsx`

Add conditional state:
```jsx
const [requiresCode, setRequiresCode] = useState(false);
const [securityCode, setSecurityCode] = useState('');
```

On login response that returns `requiresCode: true`, show a 6-digit OTP-style input. On retry, send `securityCode` in the request body alongside email and password.

---

## TASK 3 — Failed Login Attempt Detection + Email Alert

### Step 1 — Add fields to `server/models/User.js`

Add inside the schema:
```js
loginAttempts: {
  type: Number,
  default: 0,
},
loginLockedUntil: {
  type: Date,
  default: null,
},
lastFailedLoginAt: {
  type: Date,
  default: null,
},
failedAlertSentAt: {
  type: Date,
  default: null,  // tracks when we last sent the alert so we don't spam
},
```

### Step 2 — Update `server/controllers/auth.controller.js` — `login()` function

Replace the current minimal login logic with full attempt tracking:

```js
exports.login = async (req, res) => {
  try {
    const { email, password, securityCode } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +loginLockedUntil +failedAlertSentAt');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    // Check if account is temporarily locked (optional — 15 min lockout after 10 attempts)
    if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.loginLockedUntil - new Date()) / 60000);
      return res.status(429).json({ 
        message: `Account temporarily locked. Try again in ${minutesLeft} minutes.` 
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment attempt counter
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastFailedLoginAt = new Date();

      // Send alert email after 5 failed attempts (once per hour to avoid spam)
      const ALERT_THRESHOLD = 5;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (
        user.loginAttempts >= ALERT_THRESHOLD &&
        (!user.failedAlertSentAt || user.failedAlertSentAt < oneHourAgo)
      ) {
        user.failedAlertSentAt = new Date();
        // Fire-and-forget — don't await, don't block the response
        sendFailedLoginAlert({
          targetEmail: process.env.ADMIN_NOTIFICATION_EMAIL,
          attemptedEmail: user.email,
          role: user.role,
          attemptCount: user.loginAttempts,
          ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        }).catch(console.error);
      }

      // Lock account after 10 failed attempts (15 min lockout)
      if (user.loginAttempts >= 10) {
        user.loginLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ✅ Password matched — check 6-digit code for privileged roles
    if (user.role === 'superadmin' || user.role === 'manager') {
      const expectedCode = user.role === 'superadmin'
        ? process.env.SUPER_ADMIN_CODE
        : process.env.MANAGER_CODE;

      if (!securityCode) {
        return res.status(401).json({ message: 'Security code required.', requiresCode: true });
      }
      if (securityCode !== expectedCode) {
        // Count this as a failed attempt too
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        await user.save({ validateBeforeSave: false });
        return res.status(401).json({ message: 'Invalid security code.' });
      }
    }

    // ✅ All checks passed — reset attempt counter on successful login
    user.loginAttempts = 0;
    user.loginLockedUntil = null;

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
```

---

## TASK 4 — Working Forgot Password (via Brevo OTP email)

### Current state
`auth.controller.js` `forgotPassword()` already generates the OTP and stores it in the DB. It just does `console.log(otp)` instead of emailing it. The `resetPassword()` route is also already done.

### What to do — just replace the `console.log` line

In `server/controllers/auth.controller.js` `forgotPassword()` (around line 245), replace:
```js
// TODO: Send OTP via Brevo email
console.log(`OTP for ${email}: ${otp}`);
```
With:
```js
await sendPasswordResetOTP({ 
  toEmail: user.email, 
  toName: user.name, 
  otp 
});
```

### Important: Super-admin / Manager forgot password behaviour
For users with role `superadmin` or `manager`:
- Forgot password works the same way (OTP to their email, they reset their password)
- **But** they still need the 6-digit ENV code every time they log in
- So a compromised password alone is never enough — the ENV code is the second factor
- This means: do NOT block forgot-password for admins. It's fine to let them reset their password. The ENV code stays the real security gate.

---

## TASK 5 — Membership Welcome Email + Invoice

### Where to add it
`server/controllers/payment.controller.js` — inside `activateOnPaymentSuccess()` function, in the `if (payment.type === 'membership')` block (around line 394).

After the membership is activated and admission is updated, add:

```js
if (payment.type === 'membership') {
  const membership = await Membership.findOneAndUpdate(
    { paymentId: payment._id },
    { status: 'active' },
    { new: true }
  ).populate('planId').populate('studentId', 'name email phone');

  if (membership) {
    await Admission.findOneAndUpdate(
      { membershipId: membership._id },
      { paymentStatus: 'paid' }
    );

    // Send welcome email + invoice
    if (membership.studentId?.email) {
      const { buildInvoiceHTML } = require('../utils/invoiceBuilder');
      const invoiceHtml = buildInvoiceHTML({
        invoiceNumber: payment.invoiceNumber,
        date: new Date(payment.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        }),
        studentName: membership.studentId.name,
        studentPhone: membership.studentId.phone,
        studentEmail: membership.studentId.email,
        items: [{
          description: `Membership: ${membership.planId?.name || 'Plan'}`,
          quantity: 1,
          rate: payment.amount,
          amount: payment.amount,
        }],
        subtotal: payment.amount,
        gstPercent: payment.gstPercent,
        gstAmount: payment.gstAmount,
        totalAmount: payment.totalAmount,
        paymentMode: payment.paymentMode,
        paymentId: payment.razorpayPaymentId || String(payment._id),
        status: 'PAID',
      });

      sendMembershipWelcomeEmail({
        toEmail: membership.studentId.email,
        toName: membership.studentId.name,
        planName: membership.planId?.name || 'Membership',
        startDate: new Date(membership.startDate).toLocaleDateString('en-IN'),
        endDate: new Date(membership.endDate).toLocaleDateString('en-IN'),
        totalAmount: payment.totalAmount,
        invoiceHtml,
        invoiceNumber: payment.invoiceNumber,
      }).catch(console.error);

      // Mark email as sent
      await Payment.findByIdAndUpdate(payment._id, { emailSentAt: new Date() });
    }
  }
}
```

**Note:** `sendMembershipWelcomeEmail` is imported from `server/utils/emailService.js` (see Task 7). This does NOT apply to one-time play bookings — it's inside the `type === 'membership'` block only.

---

## TASK 6 — Admin Payment Notification Email

### Where to add it
Same `activateOnPaymentSuccess()` function in `payment.controller.js`, **at the end** after all the type-specific logic.

```js
// Notify admin of every successful payment
sendAdminPaymentAlert({
  adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL,
  payerName: payment.customerName || 'Unknown',
  paymentType: payment.type,
  amount: payment.totalAmount,
  paymentMode: payment.paymentMode,
  invoiceNumber: payment.invoiceNumber,
  timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
}).catch(console.error);
```

---

## TASK 7 — Create `server/utils/emailService.js`

This is the single file that handles all emails. All other controllers import from here.

```js
// server/utils/emailService.js
const SibApiV3Sdk = require('@getbrevo/brevo');

const getApiInstance = () => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
  return apiInstance;
};

const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL || 'noreply@redballacademy.com',
  name: process.env.BREVO_SENDER_NAME || 'Red Ball Academy',
};

/**
 * Send password reset OTP to a user
 */
async function sendPasswordResetOTP({ toEmail, toName, otp }) {
  const apiInstance = getApiInstance();
  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.sender = SENDER;
  email.to = [{ email: toEmail, name: toName }];
  email.subject = 'Your Red Ball Academy Password Reset OTP';
  email.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #DC2626;">Red Ball Academy</h2>
      <p>Hi ${toName},</p>
      <p>Your password reset OTP is:</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #DC2626; 
                  padding: 20px; background: #f8f8f8; border-radius: 8px; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p>If you did not request this, please ignore this email.</p>
      <hr/>
      <p style="font-size: 12px; color: #999;">Red Ball Box Cricket Academy</p>
    </div>
  `;
  return apiInstance.sendTransacEmail(email);
}

/**
 * Send failed login alert to admin
 */
async function sendFailedLoginAlert({ targetEmail, attemptedEmail, role, attemptCount, ip, userAgent, timestamp }) {
  const apiInstance = getApiInstance();
  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.sender = SENDER;
  email.to = [{ email: targetEmail, name: 'Admin' }];
  email.subject = `🚨 Security Alert: ${attemptCount} Failed Login Attempts — ${attemptedEmail}`;
  email.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 2px solid #DC2626; border-radius: 8px; padding: 24px;">
      <h2 style="color: #DC2626; margin-top: 0;">⚠️ Failed Login Alert</h2>
      <p>There have been <strong>${attemptCount} failed login attempts</strong> on your Red Ball Academy portal.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #666; width: 140px;">Account</td><td><strong>${attemptedEmail}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Role</td><td>${role}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Attempt Count</td><td><strong>${attemptCount}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #666;">IP Address</td><td>${ip}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Time (IST)</td><td>${timestamp}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Browser</td><td style="font-size: 12px;">${userAgent}</td></tr>
      </table>
      <p>If this was you, please ignore. If not, consider changing your password immediately.</p>
    </div>
  `;
  return apiInstance.sendTransacEmail(email);
}

/**
 * Send membership welcome email with invoice
 */
async function sendMembershipWelcomeEmail({
  toEmail, toName, planName, startDate, endDate, totalAmount, invoiceHtml, invoiceNumber
}) {
  const apiInstance = getApiInstance();
  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.sender = SENDER;
  email.to = [{ email: toEmail, name: toName }];
  email.subject = `Welcome to Red Ball Academy! Your ${planName} is Active 🏏`;
  email.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #DC2626; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">🏏 Welcome to Red Ball Academy!</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hi <strong>${toName}</strong>,</p>
        <p>Your membership has been activated successfully! Here are your membership details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8f8f8; border-radius: 8px; overflow: hidden;">
          <tr><td style="padding: 10px 16px; color: #666;">Plan</td><td style="padding: 10px 16px; font-weight: bold;">${planName}</td></tr>
          <tr style="background: white;"><td style="padding: 10px 16px; color: #666;">Valid From</td><td style="padding: 10px 16px;">${startDate}</td></tr>
          <tr><td style="padding: 10px 16px; color: #666;">Valid Until</td><td style="padding: 10px 16px;">${endDate}</td></tr>
          <tr style="background: white;"><td style="padding: 10px 16px; color: #666;">Amount Paid</td><td style="padding: 10px 16px; font-weight: bold; color: #DC2626;">₹${totalAmount}</td></tr>
          <tr><td style="padding: 10px 16px; color: #666;">Invoice No.</td><td style="padding: 10px 16px;">${invoiceNumber}</td></tr>
        </table>
        <p>Your invoice is attached below. Please keep it for your records.</p>
        <p style="margin-top: 24px;">See you on the field! 🏏</p>
        <p style="color: #DC2626; font-weight: bold;">Team Red Ball Academy</p>
      </div>
      <hr style="margin: 32px 0;"/>
      <p style="font-size: 11px; color: #999; text-align: center;">Invoice</p>
      ${invoiceHtml}
    </div>
  `;
  return apiInstance.sendTransacEmail(email);
}

/**
 * Send payment notification to admin
 */
async function sendAdminPaymentAlert({ adminEmail, payerName, paymentType, amount, paymentMode, invoiceNumber, timestamp }) {
  const apiInstance = getApiInstance();
  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.sender = SENDER;
  email.to = [{ email: adminEmail, name: 'Admin' }];
  email.subject = `💰 New Payment Received — ₹${amount} (${paymentType})`;
  email.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; 
                border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #16a34a; margin-top: 0;">✅ Payment Received</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #666; width: 140px;">Amount</td><td><strong style="color: #16a34a; font-size: 18px;">₹${amount}</strong></td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Payment Type</td><td>${paymentType}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Payer</td><td>${payerName}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Payment Mode</td><td>${paymentMode || 'N/A'}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Invoice No.</td><td>${invoiceNumber || 'N/A'}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Time (IST)</td><td>${timestamp}</td></tr>
      </table>
    </div>
  `;
  return apiInstance.sendTransacEmail(email);
}

module.exports = {
  sendPasswordResetOTP,
  sendFailedLoginAlert,
  sendMembershipWelcomeEmail,
  sendAdminPaymentAlert,
};
```

### Add to `server/.env`:
```env
BREVO_API_KEY=your-actual-brevo-api-key-here
BREVO_SENDER_EMAIL=noreply@redballacademy.com
BREVO_SENDER_NAME=Red Ball Academy
```

### Import at top of files that use it:
```js
// In auth.controller.js:
const { sendPasswordResetOTP, sendFailedLoginAlert } = require('../utils/emailService');

// In payment.controller.js:
const { sendMembershipWelcomeEmail, sendAdminPaymentAlert } = require('../utils/emailService');
```

---

## TASK 8 — Production Security Hardening

### 8.1 — Remove hardcoded JWT fallback secrets

**`server/controllers/auth.controller.js` lines 5–6:**
```js
// BEFORE (insecure fallback):
const ACCESS_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_secure_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_secure_456';

// AFTER (fail loudly if missing):
const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env');
}
```

**Same fix in `server/middleware/auth.middleware.js` line 4.**

### 8.2 — Add rate limiting

Install: `npm install express-rate-limit`

In `server/index.js`, add after the `app.use(helmet...)` lines:
```js
const rateLimit = require('express-rate-limit');

// General API rate limit
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
}));

// Stricter limit on auth routes (login, forgot-password)
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
}));

app.use('/api/auth/forgot-password', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many password reset requests. Try again in an hour.' },
}));
```

### 8.3 — Add `express-mongo-sanitize` (blocks NoSQL injection)

Install: `npm install express-mongo-sanitize`

In `server/index.js`, add after `app.use(express.json(...))`:
```js
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); // strips $ and . from user input
```

### 8.4 — Tighten CORS for production

In `server/index.js`, the CORS and socket.io origin arrays already use `process.env.CLIENT_URL`. Make sure your production `.env` sets this to your exact Vercel URL, e.g.:
```env
CLIENT_URL=https://red-ball-delta.vercel.app
```

Remove `http://localhost:5173` from the hardcoded array when `NODE_ENV=production`:
```js
const allowedOrigins = [
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173'] : []),
  'https://red-ball-delta.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);
```

### 8.5 — Remove the temp debug script

`server/index.js` lines 229–239 contain a temp script that writes to a hardcoded path (`d:\\red-ball\\server\\check-output.txt`). Delete this entire block:
```js
// --- TEMP SCRIPT ---
try {
  const fs = require('fs');
  ...
} catch (err) {}
// ---
```

### 8.6 — Ensure `.env` is in `.gitignore`

Check that `server/.env` is listed in `.gitignore`. If not, add it. The `.env` file must NEVER be committed to git since it now contains all admin credentials and API keys.

### 8.7 — Strong JWT secrets for production

Generate proper secrets and put them in production `.env`:
```env
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-byte-hex-string>
JWT_REFRESH_SECRET=<different-64-byte-hex-string>
```

---

## COMPLETE `.env` REFERENCE (what your final `.env` should look like)

```env
# Server
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-uri>

# JWT (use 64-char random hex strings in production)
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<different-strong-secret>

# Client
CLIENT_URL=https://red-ball-delta.vercel.app

# Admin seed credentials
SUPER_ADMIN_EMAIL=banshu31st@gmail.com
SUPER_ADMIN_PASSWORD=<YourPassword>
SUPER_ADMIN_NAME=Super Admin
MANAGER_EMAIL=<manager@yourdomain.com>
MANAGER_PASSWORD=<ManagerPassword>
MANAGER_NAME=Restaurant Manager
RECEPTION_EMAIL=reception@redball.com
RECEPTION_PASSWORD=<ReceptionPassword>

# 6-digit security codes (change anytime, no code changes needed)
SUPER_ADMIN_CODE=847291
MANAGER_CODE=563018

# Admin notification target
ADMIN_NOTIFICATION_EMAIL=banshu31st@gmail.com

# Razorpay
RAZORPAY_KEY_ID=<your-key>
RAZORPAY_KEY_SECRET=<your-secret>
RAZORPAY_WEBHOOK_SECRET=<your-webhook-secret>

# Brevo
BREVO_API_KEY=<your-brevo-api-key>
BREVO_SENDER_EMAIL=noreply@redballacademy.com
BREVO_SENDER_NAME=Red Ball Academy

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
```

---

## SUMMARY OF ALL FILES TO CHANGE

| File | What changes |
|------|--------------|
| `server/.env` | Add all new env vars (admin emails, codes, Brevo, notification email) |
| `server/index.js` | Use env vars for seeding; add rate limiting, mongo-sanitize; remove temp script |
| `server/models/User.js` | Add `loginAttempts`, `loginLockedUntil`, `lastFailedLoginAt`, `failedAlertSentAt` fields |
| `server/controllers/auth.controller.js` | Full login with attempt tracking + 6-digit code; forgotPassword wire up email; remove fallback secrets |
| `server/controllers/payment.controller.js` | Add welcome email + admin notification in `activateOnPaymentSuccess()` |
| `server/middleware/auth.middleware.js` | Remove fallback JWT secret |
| `server/utils/emailService.js` | **Create new file** — all Brevo email functions |
| `client/src/pages/auth/Auth.jsx` | Add 6-digit code input for admin/manager login flow |

---

## PACKAGES TO INSTALL

```bash
# In server/
npm install @getbrevo/brevo express-rate-limit express-mongo-sanitize
```

# Additional Production-Ready Improvements for Red Ball Academy

These improvements should be implemented ON TOP of the existing security/email/authentication upgrade system.

IMPORTANT:
DO NOT rewrite existing architecture.
DO NOT break:

* auth
* memberships
* payments
* QR systems
* restaurant flows
* dashboards

These are enhancement-level production improvements.

---

# PART 1 — Centralized Environment Validation

## [NEW] server/config/validateEnv.js

Create centralized environment validation.

On server startup:

* validate ALL required env variables
* crash startup immediately if missing

Required variables:

```txt id="9wd1x7"
JWT_SECRET
JWT_REFRESH_SECRET
MONGODB_URI
CLIENT_URL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
BREVO_API_KEY
SUPER_ADMIN_EMAIL
SUPER_ADMIN_CODE
MANAGER_EMAIL
MANAGER_CODE
```

Implementation:

* create helper function
* iterate required keys
* throw readable startup error if missing

In:

```txt id="1a1a4m"
server/index.js
```

import:

```js id="hv6mrm"
validateEnv();
```

BEFORE server starts.

---

# PART 2 — Helmet Security Hardening

Install:

```bash id="m3qwj8"
npm install helmet
```

## [MODIFY] server/index.js

Add:

```js id="u0j4cc"
const helmet = require('helmet');
```

Enable:

* frameguard
* HSTS
* noSniff
* XSS protection
* content security policy

IMPORTANT:
Configure CSP carefully so:

* Razorpay checkout works
* Cloudinary images work
* Vercel frontend works

DO NOT break:

* payment popup
* sockets
* QR generation

---

# PART 3 — XSS Sanitization

Install:

```bash id="h1fdxw"
npm install xss-clean
```

## [MODIFY] server/index.js

Add:

```js id="m8x9q7"
const xss = require('xss-clean');
app.use(xss());
```

IMPORTANT:
Protect:

* reviews
* contact messages
* notes
* usernames
* descriptions
* forms

Prevent malicious script injection.

---

# PART 4 — Security Audit Logging

## [NEW] server/models/SecurityEvent.js

Create centralized audit log model.

Schema:

```js id="z4h72z"
{
  type: String,
  userId: ObjectId,
  email: String,
  role: String,
  ipAddress: String,
  userAgent: String,
  metadata: Object,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
  },
},
{
  timestamps: true,
}
```

---

# Track Events

Log:

* failed login attempts
* password reset requests
* successful admin logins
* account lockouts
* suspicious QR activity
* multiple failed payment verifications
* repeated OTP requests

---

# Create Utility

## [NEW] server/utils/securityLogger.js

Functions:

```js id="r3fhx9"
logSecurityEvent()
logFailedLogin()
logPasswordReset()
logAdminLogin()
logSuspiciousActivity()
```

DO NOT duplicate logger logic across controllers.

---

# PART 5 — Cookie & JWT Hardening

## [MODIFY] auth.controller.js

Production cookies MUST use:

```js id="1gj8ka"
httpOnly: true
secure: process.env.NODE_ENV === 'production'
sameSite: 'strict'
```

Refresh token cookies should NEVER be readable by frontend JS.

---

# PART 6 — Admin Session Tracking

## [NEW] server/models/AdminSession.js

Track privileged logins.

Schema:

```js id="s2k3v1"
{
  userId: ObjectId,
  role: String,
  ipAddress: String,
  userAgent: String,
  loginAt: Date,
  logoutAt: Date,
  isActive: Boolean,
}
```

---

# Features

Track:

* superadmin logins
* restaurant manager logins

Display later inside:

```txt id="lpjlwm"
/super-admin/security
```

Potential future feature:

```txt id="z67wje"
"Logged in devices"
```

---

# PART 7 — Password Policy Enforcement

## [MODIFY] User.js

Enforce:

* minimum 8 characters
* uppercase letter
* lowercase letter
* number

Optional:

* special character

Apply during:

* registration
* password reset
* password change

Return proper validation errors.

---

# PART 8 — Email Queue Safety

IMPORTANT:
Email sending should NEVER block payment success responses.

## [MODIFY] emailService.js

Wrap ALL email sends in:

```js id="d6q2w7"
try/catch
```

and:

```js id="s2pt5j"
fire-and-forget pattern
```

for non-critical emails.

Example:

```js id="8m7b9d"
sendMembershipWelcomeEmail(...).catch(console.error)
```

DO NOT:

* fail payment activation because email failed
* fail login because alert email failed

---

# PART 9 — Webhook Verification Hardening

## [MODIFY] payment.controller.js

Ensure:

```txt id="5tx4mf"
Razorpay webhook verification
```

uses:

```txt id="sl2q2d"
req.rawBody
```

NOT:

```txt id="of0tq8"
JSON.stringify(req.body)
```

IMPORTANT:
Prevent signature mismatch bugs.

---

# PART 10 — Production Monitoring Preparation

## [NEW] server/utils/logger.js

Create centralized logger.

Functions:

```js id="0x3c9u"
logInfo()
logWarn()
logError()
```

Add timestamps.

Future-ready for:

* Winston
* Datadog
* Sentry
* Logtail

DO NOT use random console.logs across production code anymore.

---

# FINAL GOAL

Upgrade Red Ball into a:

```txt id="mqzpgj"
secure
scalable
production-ready
multi-user
commercial-grade
academy platform
```

with:

* hardened authentication
* audit logging
* secure cookies
* sanitized inputs
* security monitoring
* production-safe email handling
* admin protection
* scalable backend architecture
* proper operational safeguards
