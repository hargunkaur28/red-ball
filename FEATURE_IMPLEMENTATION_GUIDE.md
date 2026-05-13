# Red Ball Platform - Enhanced Features Implementation Guide

This document provides comprehensive setup and usage instructions for the 6 new production-grade operational features added to the Red Ball Cricket Academy management platform.

## Overview

The platform now includes:
1. **Enhanced Razorpay Integration** - Full payment processing with signature verification
2. **Slot Booking System** - Arena/court scheduling with occupancy management
3. **Daily Operations Board** - Real-time operational visibility
4. **Attendance & Check-in System** - Member tracking and analytics
5. **Real-time Socket.IO Updates** - Live notifications and activity feeds
6. **Operational Visibility Dashboard** - Comprehensive facility insights

---

## 1. ENHANCED RAZORPAY INTEGRATION

### Setup

1. **Install Razorpay SDK:**
```bash
npm install razorpay
```

2. **Environment Variables:**
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

3. **Backend Endpoints:**
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature
- `POST /api/payments/webhook/razorpay` - Handle Razorpay webhooks
- `POST /api/payments/:id/retry` - Retry failed payment
- `PUT /api/payments/:id/refund` - Process refund

4. **Frontend Component:**
Use the `PaymentModal` component in your pages:
```jsx
import PaymentModal from '@/components/shared/PaymentModal';

<PaymentModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  paymentDetails={{
    amount: 500,
    type: 'membership',
    studentId: userId,
    description: 'Membership Fee'
  }}
  onSuccess={(payment) => console.log('Payment successful!', payment)}
/>
```

### Features
- ✅ Secure Razorpay checkout modal
- ✅ HMAC signature verification
- ✅ Payment failure handling & retry
- ✅ Automatic refund processing
- ✅ GST-compatible invoices
- ✅ Webhook event handling
- ✅ Transaction tracking

---

## 2. SLOT BOOKING SYSTEM

### Setup

1. **Models Created:**
- `Slot` - Represents available time slots
- `SlotBooking` - Represents individual bookings

2. **Backend Endpoints:**
- `GET /api/slots` - List available slots (with filters)
- `POST /api/slots` - Create slot (Admin only)
- `POST /api/slots/:id/book` - Book a slot
- `POST /api/slots/bookings/:id/check-in` - Check in
- `POST /api/slots/bookings/:id/check-out` - Check out
- `POST /api/slots/bookings/:id/cancel` - Cancel booking

3. **Configuration:**
Create slots via admin panel or API:
```bash
POST /api/slots
{
  "name": "Cricket Ground A",
  "sport": "cricket",
  "capacity": 1,
  "startTime": "14:00",
  "endTime": "15:00",
  "duration": 60,
  "date": "2024-05-13",
  "pricePerSlot": 500,
  "isPeakHour": false,
  "peakHourMultiplier": 1.5
}
```

4. **Frontend Component:**
```jsx
import SlotBooking from '@/components/shared/SlotBooking';
<SlotBooking />
```

### Features
- ✅ Real-time slot availability
- ✅ Occupancy indicators (Available → Filling Fast → Full)
- ✅ Peak hour pricing
- ✅ Booking conflict prevention
- ✅ Check-in/check-out workflow
- ✅ Color-coded status

---

## 3. DAILY OPERATIONS BOARD

### Setup

1. **Model Created:**
- `OperationEvent` - Represents scheduled activities

2. **Backend Endpoints:**
- `GET /api/operations/timeline` - Get day timeline
- `GET /api/operations/schedule` - Get weekly/monthly schedule
- `GET /api/operations/grounds` - Get ground status
- `POST /api/operations/events` - Create event
- `PUT /api/operations/events/:id` - Update event
- `POST /api/operations/events/:id/reschedule` - Reschedule
- `POST /api/operations/events/:id/start` - Start event
- `POST /api/operations/events/:id/end` - Complete event

3. **Create Events:**
```bash
POST /api/operations/events
{
  "title": "Senior Coaching Batch",
  "eventType": "coaching",
  "ground": "Cricket Ground A",
  "sport": "cricket",
  "coach": "coach_user_id",
  "startTime": "14:00",
  "endTime": "15:30",
  "date": "2024-05-13",
  "maxCapacity": 15,
  "description": "Advanced batting session"
}
```

### Features
- ✅ Drag-and-drop rescheduling
- ✅ Conflict detection
- ✅ Ground occupancy visualization
- ✅ Multi-view (daily, weekly, monthly)
- ✅ Event status tracking
- ✅ Real-time updates

---

## 4. ATTENDANCE & CHECK-IN SYSTEM

### Setup

1. **Model Created:**
- `Attendance` - Tracks member check-ins/check-outs

2. **Backend Endpoints:**
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/user/:userId` - Get user history
- `GET /api/attendance/stats` - Get analytics
- `POST /api/attendance/check-in` - Check in user
- `POST /api/attendance/check-out` - Check out user

3. **Check-in Methods:**
```bash
# Manual check-in (Receptionist)
POST /api/attendance/check-in
{
  "userId": "user_id",
  "method": "manual",
  "sport": "cricket",
  "ground": "Ground A",
  "notes": "Optional notes"
}

# QR Scan check-in
POST /api/attendance/check-in
{
  "userId": "user_id",
  "method": "qr-scan"
}
```

### Features
- ✅ Multiple check-in methods (manual, QR, membership ID)
- ✅ Duration tracking
- ✅ Peak attendance analytics
- ✅ Attendance trends
- ✅ No-show detection
- ✅ Real-time counters

---

## 5. REAL-TIME SOCKET.IO UPDATES

### Setup

The Socket.IO integration is already configured in the main server. Events are automatically emitted for:

**Payment Events:**
```
payment:success - Payment confirmed
payment:failed - Payment failed
payment:refunded - Refund processed
```

**Slot Events:**
```
slot:booked - New booking created
slot:availability-updated - Slot availability changed
ground:occupancy-updated - Ground occupancy changed
```

**Operations Events:**
```
operation:started - Event started
operation:completed - Event completed
operation:rescheduled - Event rescheduled
```

**Attendance Events:**
```
attendance:checked-in - Member checked in
attendance:checked-out - Member checked out
```

**General Events:**
```
dashboard:refresh - Refresh dashboard
activity:new - New activity in feed
```

### Usage in Frontend:
```jsx
import { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

useEffect(() => {
  socket.on('payment:success', (data) => {
    console.log('Payment successful:', data);
    // Update UI
  });

  socket.on('attendance:checked-in', (data) => {
    console.log('Member checked in:', data);
  });

  return () => socket.off();
}, []);
```

---

## 6. OPERATIONAL VISIBILITY DASHBOARD

### Access

Navigate to: `/admin/operations` or `/admin/dashboard`

### Dashboard Features

**At-a-glance Metrics:**
- Active players (real-time count)
- Today's revenue
- Active bookings
- Pending dues
- Expiring memberships
- Low inventory items

**Ground Status:**
- Live occupancy levels
- Current activity
- Next scheduled event
- Ground status (Active/Idle)

**Alerts & Reminders:**
- Expiring memberships
- Low stock items
- Failed payments
- No-shows
- Maintenance alerts

**Recent Activity Feeds:**
- Today's attendance
- Recent payments
- Order updates
- System notifications

### Real-time Updates
- Dashboard auto-refreshes every 5-15 seconds
- WebSocket events trigger immediate UI updates
- No manual refresh needed

---

## INTEGRATION CHECKLIST

- [ ] Install Razorpay SDK: `npm install razorpay`
- [ ] Set environment variables for Razorpay
- [ ] Create initial slots via admin panel
- [ ] Test payment flow with Razorpay test keys
- [ ] Configure Socket.IO event listeners
- [ ] Add operational dashboard to navigation
- [ ] Train staff on check-in procedures
- [ ] Set up QR codes for quick check-in (optional)
- [ ] Configure attendance reminders
- [ ] Test real-time notifications

---

## API AUTHENTICATION

All endpoints require:
- **JWT Token** in Authorization header
- **Role-based access control**:
  - Admin/Superadmin: Full access
  - Receptionist: Check-in, bookings, payments
  - Staff: Read-only operations

---

## DATABASE INDEXES

The following indexes have been added for performance:
```
- Attendance: userId, date | status | createdAt
- Slot: date, sport | name
- SlotBooking: slotId, status | userId | createdAt
- OperationEvent: date, ground | status | createdAt
```

---

## WEBHOOK CONFIGURATION

For Razorpay webhooks, configure in your Razorpay Dashboard:
- Endpoint: `https://yourdomain.com/api/payments/webhook/razorpay`
- Events: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.created`

---

## MONITORING & TROUBLESHOOTING

### Check Payment Status
```bash
GET /api/payments/:id/invoice
```

### Verify Slot Availability
```bash
GET /api/slots?date=2024-05-13&sport=cricket
```

### Monitor Operations
```bash
GET /api/operations/grounds
```

### Check Attendance Records
```bash
GET /api/attendance/today
```

---

## PERFORMANCE TIPS

1. **Use pagination** for large lists
2. **Cache slot data** on frontend (5-minute TTL)
3. **Batch operations** for bulk check-ins
4. **Use indexes** for date-range queries
5. **Implement rate limiting** for payment endpoints

---

## SUPPORT & CUSTOMIZATION

Each feature can be extended:
- Add custom validation rules
- Implement additional payment methods
- Add more check-in methods
- Extend notification system
- Add custom reports

---

For questions or issues, contact the development team.
