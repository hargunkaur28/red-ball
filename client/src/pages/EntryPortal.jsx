import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft, BadgeCheck, Check, Clock, CreditCard, Loader2, Lock, Mail, Phone, ShieldCheck, User, Wallet } from 'lucide-react';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { toast } from 'sonner';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.entry-root {
  min-height: 100vh;
  background: #101414;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #fff;
}

.entry-shell {
  width: min(980px, 100%);
  height: min(640px, calc(100vh - 40px));
  min-height: 520px;
  display: grid;
  grid-template-columns: minmax(300px, 0.7fr) minmax(420px, 1fr);
  background: #111515;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 42px 100px rgba(0,0,0,0.58);
}

.entry-hero {
  background: #df1526;
  padding: 46px 42px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.entry-hero::after {
  content: '';
  position: absolute;
  left: -90px;
  bottom: -90px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(170,0,18,0.16);
}

.entry-brand-block {
  margin-top: auto;
  margin-bottom: auto;
  position: relative;
  z-index: 1;
}

.entry-brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.entry-mark {
  position: relative;
  width: 23px;
  height: 23px;
  flex: 0 0 auto;
}

.entry-mark::before,
.entry-mark::after {
  content: '';
  position: absolute;
  top: 3px;
  width: 15px;
  height: 19px;
  border: 2px solid rgba(255,255,255,0.88);
  border-radius: 50%;
}

.entry-mark::before { left: 1px; }
.entry-mark::after { right: 1px; }

.entry-secure {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  color: rgba(255,255,255,0.52);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.entry-kicker {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.92);
}

.entry-sport-name {
  font-size: clamp(38px, 4vw, 54px);
  line-height: 0.92;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.055em;
  text-shadow: 0 3px 0 rgba(0,0,0,0.18);
}

.entry-hero-copy {
  max-width: 310px;
  margin-top: 18px;
  color: rgba(255,255,255,0.76);
  font-size: 15px;
  line-height: 1.45;
}

.entry-stat-grid {
  display: none;
}

.entry-stat {
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
}

.entry-stat-label {
  color: rgba(255,255,255,0.62);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.entry-stat-value {
  font-size: 30px;
  font-weight: 900;
  margin-top: 4px;
}

.entry-panel {
  padding: 42px 44px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.24) transparent;
}

.entry-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.entry-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.02em;
  text-shadow: 0 3px 0 rgba(0,0,0,0.34);
}

.entry-muted {
  color: rgba(255,255,255,0.68);
  font-size: 14px;
  line-height: 1.5;
  margin-top: 8px;
}

.entry-back {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.entry-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.badge-member { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.28); }
.badge-checked-in { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.28); }
.badge-no-membership { background: rgba(245,158,11,0.13); color: #fbbf24; border: 1px solid rgba(245,158,11,0.28); }

.entry-action-btn, .plan-card, .entry-google, .entry-submit {
  width: 100%;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.12s;
}

.entry-action-btn, .entry-submit {
  min-height: 48px;
  border: 0;
  padding: 13px 15px;
  font-size: 13px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.entry-action-btn:active, .plan-card:active, .entry-submit:active { transform: scale(0.99); }
.entry-action-btn:disabled, .plan-card.disabled, .entry-submit:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-checkin { background: #10b981; color: #fff; }
.btn-checkout { background: #ef4444; color: #fff; }
.entry-submit { background: #C8102E; color: #fff; box-shadow: 0 14px 30px rgba(200,16,46,0.28); }
.entry-submit:hover { background: #a90e27; }

.entry-divider {
  height: 0;
  margin: 22px 0 0;
}

.entry-plans-title {
  font-size: 12px;
  font-weight: 900;
  color: rgba(255,255,255,0.72);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  margin-bottom: 14px;
}

.plan-list { display: grid; gap: 10px; }

.plan-card {
  min-height: 64px;
  padding: 12px 18px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.035);
  color: #fff;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 13px;
  align-items: center;
  text-align: left;
}

.plan-card:hover, .plan-card.selected {
  border-color: rgba(200,16,46,0.62);
  background: rgba(200,16,46,0.1);
}

.plan-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.09);
  color: rgba(255,255,255,0.86);
}

.plan-name { display: block; font-size: 18px; line-height: 1.1; font-weight: 900; margin-bottom: 5px; letter-spacing: -0.04em; text-shadow: 0 2px 0 rgba(0,0,0,0.35); }
.plan-duration { display: block; font-size: 12px; color: rgba(255,255,255,0.74); }
.plan-price { font-size: 20px; font-weight: 900; color: #ff2d4f; white-space: nowrap; letter-spacing: -0.04em; }

.plan-card.membership-plan .plan-icon {
  background: transparent;
  color: rgba(255,255,255,0.18);
}

.plan-card.all-services-plan {
  position: relative;
  border-color: rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.045);
}

.plan-card.all-services-plan::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 14px 0 0 14px;
  background: #f5a400;
}

.plan-card.all-services-plan .plan-icon {
  background: transparent;
  color: #f5b400;
}

.checkout-summary {
  border: 1px solid rgba(255,255,255,0.11);
  background: rgba(255,255,255,0.045);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 18px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: rgba(255,255,255,0.62);
  font-size: 13px;
  margin-top: 10px;
}
.summary-row:first-child { margin-top: 0; }
.summary-row strong { color: #fff; }

.entry-form {
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
}

.auth-mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  margin-bottom: 14px;
}

.auth-mode-btn {
  border: 0;
  border-radius: 9px;
  min-height: 38px;
  background: transparent;
  color: rgba(255,255,255,0.55);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.auth-mode-btn.active {
  background: #fff;
  color: #111;
}

.field-label {
  display: block;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.42);
  margin-bottom: 7px;
}

.field-inner { position: relative; }
.field-inner svg {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.35);
}

.field-input {
  width: 100%;
  border: 1px solid rgba(255,255,255,0.11);
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  color: #fff;
  min-height: 48px;
  padding: 13px 14px 13px 40px;
  outline: none;
  font-family: 'Inter', sans-serif;
}
.field-input:focus { border-color: rgba(200,16,46,0.62); }

.entry-google {
  min-height: 48px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  overflow: hidden;
}

.entry-google-fallback {
  gap: 10px;
  font-size: 14px;
  font-weight: 800;
}

.entry-google:not([disabled]):hover {
  border-color: rgba(200,16,46,0.45);
  background: rgba(255,255,255,0.075);
}

.entry-google[disabled] {
  opacity: 0.58;
  cursor: not-allowed;
}

.google-mark {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: conic-gradient(from -45deg, #4285f4 0 25%, #34a853 0 50%, #fbbc05 0 75%, #ea4335 0);
  display: inline-block;
  flex: 0 0 auto;
}

.entry-divider-text {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.36);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 12px 0 14px;
}

.entry-divider-text::before,
.entry-divider-text::after {
  content: '';
  height: 1px;
  background: rgba(255,255,255,0.08);
}

.checkout-note {
  display: flex;
  gap: 10px;
  color: rgba(255,255,255,0.52);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 14px;
}

.timer-display {
  text-align: center;
  margin: 18px 0;
}
.timer-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin-bottom: 6px;
}
.timer-value {
  font-size: 44px;
  font-weight: 900;
  color: #60a5fa;
  font-variant-numeric: tabular-nums;
}

.entry-loading, .entry-error {
  width: min(480px, 100%);
  min-height: 340px;
  background: #111;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 28px;
}

.success-checkmark {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 26px auto 16px;
}

@keyframes entry-spin { to { transform: rotate(360deg); } }
.animate-spin { animation: entry-spin 0.75s linear infinite; }

@media (max-width: 860px) {
  .entry-root { padding: 20px; align-items: flex-start; }
  .entry-shell { grid-template-columns: 1fr; height: auto; min-height: 0; }
  .entry-hero { min-height: 360px; padding: 36px 28px; }
  .entry-panel { min-height: auto; padding: 22px; }
  .entry-brand-block { margin: 40px 0; }
}

@media (max-width: 520px) {
  .entry-root { padding: 0; align-items: stretch; }
  .entry-shell { min-height: 100vh; border-radius: 0; border: 0; }
  .entry-hero { padding: 22px 18px; }
  .entry-panel { padding: 20px 16px 26px; }
  .plan-card { grid-template-columns: 1fr auto; }
  .plan-icon { display: none; }
  .entry-sport-name { font-size: 40px; }
  .entry-hero-copy { font-size: 15px; }
  .entry-title { font-size: 24px; }
  .plan-name { font-size: 16px; }
  .plan-price { font-size: 18px; }
}
`;

const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const isAllServicesPlan = (plan) => {
  return (plan?.sportsIncluded || []).some((sport) => {
    const key = (sport || '').trim().toLowerCase();
    return key === 'all' || key === 'all-services';
  });
};

const loadRazorpayScript = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existing) {
    existing.addEventListener('load', () => resolve(true), { once: true });
    existing.addEventListener('error', reject, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
  document.body.appendChild(script);
});

export default function EntryPortal() {
  const { qrSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, register, googleAuth, checkAuth, setPendingEntryIntent, clearPendingEntryIntent } = useAuthStore();
  const googleButtonRef = useCallback((node) => {
    if (!node) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !node) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          setActionLoading(true);
          try {
            const authData = await googleAuth(credential);
            setDetails((current) => ({
              ...current,
              name: authData.user?.name || current.name,
              email: authData.user?.email || current.email,
              phone: authData.user?.phone || current.phone,
            }));
            toast.success('Signed in with Google.');

            const storedIntent = localStorage.getItem('pendingEntryIntent');
            if (storedIntent) {
              try {
                const intent = JSON.parse(storedIntent);
                if (intent.flow === 'one-time-access' && intent.sportSlug) {
                  navigate(`/one-time-booking?sport=${intent.sportSlug}`);
                  return;
                } else if (intent.flow === 'membership') {
                  const target = intent.planId ? `/user/membership?planId=${intent.planId}` : '/user/membership';
                  navigate(target);
                  return;
                }
              } catch (e) {
                console.error(e);
              }
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
          } finally {
            setActionLoading(false);
          }
        },
      });
      node.innerHTML = '';
      window.google.accounts.id.renderButton(node, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        width: node.offsetWidth || 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', renderGoogleButton);
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        document.body.appendChild(script);
      }
    }
  }, [googleAuth]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [successMessage, setSuccessMessage] = useState(null);
  const [successDetails, setSuccessDetails] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [authMode, setAuthMode] = useState('signup');
  const [details, setDetails] = useState({ name: '', email: '', phone: '', password: '' });

  const handleSelectOption = (option) => {
    if (!isAuthenticated) {
      const intent = {
        flow: option.type === 'one-time' ? 'one-time-access' : 'membership',
        sportSlug: data?.sport?.slug,
        planId: option.plan?._id || null,
        redirectTo: `/entry/${qrSlug}`
      };
      setPendingEntryIntent(intent);
    }
    setSelectedOption(option);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get(`/sports/entry-check/${qrSlug}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Invalid or expired QR code. Please scan a valid QR code.');
      } else {
        setError(err.response?.data?.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }, [qrSlug]);

  useEffect(() => {
    checkAuth().finally(fetchStatus);
  }, [checkAuth, fetchStatus]);

  useEffect(() => {
    if (!user) return;
    setDetails((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    if (!loading && !isAuthenticated && data?.sport?.slug) {
      window.location.replace(`/sports/${data.sport.slug}`);
    }
  }, [loading, isAuthenticated, data?.sport?.slug]);

  useEffect(() => {
    if (!data?.hasActiveCheckIn || !data?.activeCheckIn?.checkInTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(data.activeCheckIn.checkInTime).getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.hasActiveCheckIn, data?.activeCheckIn?.checkInTime]);

  const optionSummary = useMemo(() => {
    if (!selectedOption) return null;
    if (selectedOption.type === 'one-time') {
      const base = data?.sport?.hourlyPrice || 0;
      return {
        title: 'One-Time Access',
        subtitle: `${data?.sport?.name || 'Sport'} entry for 1 hour`,
        base,
        total: Math.round(base * 1.18 * 100) / 100,
      };
    }
    const price = selectedOption.plan?.price || 0;
    const total = Math.round(price * 1.18 * 100) / 100;
    return {
      title: selectedOption.plan?.name || 'Membership',
      subtitle: `${selectedOption.plan?.durationValue || ''} ${selectedOption.plan?.durationUnit || ''}`.trim(),
      base: price,
      total,
    };
  }, [data?.sport?.hourlyPrice, data?.sport?.name, selectedOption]);

  const visiblePlans = useMemo(() => {
    const hiddenNames = new Set(['all services monthly']);
    const sportSlug = (data?.sport?.slug || '').trim().toLowerCase();
    const sportName = (data?.sport?.name || '').trim().toLowerCase();

    const planRank = (plan) => {
      const included = (plan.sportsIncluded || []).map((sport) => (sport || '').trim().toLowerCase());
      const isCurrentSport = included.some((sport) => sport === sportSlug || sport === sportName);
      const isAllServices = included.some((sport) => sport === 'all' || sport === 'all-services');
      if (isCurrentSport) return 0;
      if (isAllServices) return 1;
      return 2;
    };

    const durationRank = (plan) => {
      if (plan.durationUnit === 'months') return plan.durationValue || 99;
      if (plan.durationUnit === 'years') return (plan.durationValue || 1) * 12;
      if (plan.durationUnit === 'days') return (plan.durationValue || 999) / 30;
      return 99;
    };

    return (data?.plans || [])
      .filter((plan) => {
        const name = (plan.name || '').trim().toLowerCase();
        const unit = (plan.durationUnit || '').trim().toLowerCase();
        const duration = (plan.duration || '').trim().toLowerCase();
        if (hiddenNames.has(name)) return false;
        if (unit === 'minutes' || duration.includes('minute')) return false;
        return true;
      })
      .sort((a, b) => {
        const rankDiff = planRank(a) - planRank(b);
        if (rankDiff !== 0) return rankDiff;
        const durationDiff = durationRank(a) - durationRank(b);
        if (durationDiff !== 0) return durationDiff;
        return (a.price || 0) - (b.price || 0);
      });
  }, [data?.plans, data?.sport?.name, data?.sport?.slug]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const { data: res } = await api.post(`/sports/entry-checkin/${qrSlug}`);
      setSuccessMessage('Checked In Successfully');
      setSuccessDetails({
        type: 'check-in',
        sport: res.attendance?.sport || data?.sport?.name,
        timestamp: res.attendance?.checkInTime,
      });
      toast.success('You are now checked in.');
      setTimeout(() => navigate('/user'), 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const { data: res } = await api.post(`/sports/entry-checkout/${qrSlug}`);
      setSuccessMessage('Check-out successful. See you next time.');
      setSuccessDetails({
        type: 'check-out',
        sport: res.attendance?.sport || data?.sport?.name,
        timestamp: res.attendance?.checkOutTime,
        lateAmount: res.attendance?.lateAmount || 0,
        overtimeMinutes: res.attendance?.overtimeMinutes || 0,
      });
      toast.success('Checked out successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const ensureSignedIn = async () => {
    if (isAuthenticated) return true;

    if (authMode === 'signin') {
      if (!details.email || !details.password) {
        toast.error('Enter your email and password to sign in.');
        return false;
      }
      await login(details.email, details.password);
      toast.success('Signed in. Opening payment...');
      return true;
    }

    if (!details.name || !details.email || !details.phone || !details.password) {
      toast.error('Add your name, email, phone, and password to continue.');
      return false;
    }
    await register(details);
    toast.success('Account created. Opening payment...');
    return true;
  };

  const openRazorpay = async ({ orderResponse, description, verifyPayload, verifyUrl }) => {
    await loadRazorpayScript();
    if (!orderResponse?.rzpOrder?.id || !orderResponse?.keyId) {
      throw new Error('Payment gateway is not configured for this order.');
    }

    const rzp = new window.Razorpay({
      key: orderResponse.keyId,
      amount: orderResponse.rzpOrder.amount,
      currency: orderResponse.rzpOrder.currency,
      name: 'Red Ball Academy',
      description,
      order_id: orderResponse.rzpOrder.id,
      handler: async (response) => {
        try {
          await api.post(verifyUrl, {
            ...verifyPayload,
            customerDetails: details,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setSelectedOption(null);
          setSuccessMessage('Checked In Successfully');
          setSuccessDetails({
            type: 'check-in',
            sport: data?.sport?.name,
            timestamp: new Date().toISOString(),
          });
          toast.success('Payment successful.');
          setTimeout(() => navigate('/user'), 2400);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Payment verification failed');
        }
      },
      prefill: {
        name: details.name || user?.name || '',
        email: details.email || user?.email || '',
        contact: details.phone || user?.phone || '',
      },
      theme: { color: '#C8102E' },
      modal: {
        ondismiss: () => toast.message('Payment cancelled. You can try again from this page.'),
      },
    });
    rzp.open();
  };

  const handleStartPayment = async () => {
    if (!selectedOption) return;
    setActionLoading(true);
    try {
      const signedIn = await ensureSignedIn();
      if (!signedIn) return;
      if (selectedOption.type === 'one-time') {
        const { data: orderResponse } = await api.post(`/sports/entry-pay-instant/${qrSlug}`, { customerDetails: details });
        await openRazorpay({
          orderResponse,
          description: `One-Time Play - ${data.sport.name}`,
          verifyPayload: {},
          verifyUrl: `/sports/entry-pay-verify/${qrSlug}`,
        });
      } else {
        const { data: orderResponse } = await api.post(`/sports/entry-buy-membership/${qrSlug}`, {
          planId: selectedOption.plan._id,
          customerDetails: details,
        });
        await openRazorpay({
          orderResponse,
          description: `Membership - ${selectedOption.plan.name}`,
          verifyPayload: { planId: selectedOption.plan._id },
          verifyUrl: `/sports/entry-verify-membership/${qrSlug}`,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to initiate payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleUnavailable = () => {
    toast.error('Google sign-in is not configured yet. Add VITE_GOOGLE_CLIENT_ID in the client env and GOOGLE_CLIENT_ID on the server.');
  };

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="entry-root">
          <div className="entry-loading">
            <Loader2 size={28} className="animate-spin" />
            <strong>Validating your access...</strong>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{css}</style>
        <div className="entry-root">
          <div className="entry-error">
            <div className="entry-title">QR unavailable</div>
            <div className="entry-muted">{error}</div>
            <button className="entry-submit" onClick={() => navigate('/')}>Go Home</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="entry-root">
        <div className="entry-shell">
          <aside className="entry-hero">
            <div className="entry-brand-block">
              <div className="entry-brand-row">
                <span className="entry-mark" aria-hidden="true" />
                <div className="entry-kicker">Red Ball Academy</div>
              </div>
              <div className="entry-sport-name">{data?.sport?.name || 'Sport'}</div>
              <p className="entry-hero-copy">Choose walk-in access or a membership, confirm your details, and complete secure Razorpay payment before entry.</p>
            </div>
            <div className="entry-secure">
              <Lock size={13} />
              Secure encrypted transaction
            </div>
            <div className="entry-stat-grid">
              <div className="entry-stat">
                <div className="entry-stat-label">Current Players</div>
                <div className="entry-stat-value">{data?.sport?.activeOccupancy || 0}</div>
              </div>
              {optionSummary && (
                <div className="entry-stat">
                  <div className="entry-stat-label">Selected</div>
                  <div className="entry-stat-value" style={{ fontSize: 22 }}>{optionSummary.title}</div>
                </div>
              )}
            </div>
          </aside>

          <main className="entry-panel">
            <AnimatePresence mode="wait">
              {successMessage ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  style={{ textAlign: 'center', padding: '80px 0' }}
                >
                  <div className="success-checkmark"><Check size={34} /></div>
                  <div className="entry-title">{successMessage}</div>
                  {successDetails?.sport && (
                    <div className="entry-muted" style={{ marginTop: 14 }}>
                      {successDetails.sport}
                      {successDetails.timestamp ? ` • ${new Date(successDetails.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}` : ''}
                    </div>
                  )}
                  {successDetails?.lateAmount > 0 && (
                    <div className="entry-status-badge badge-no-membership" style={{ marginTop: 18, marginBottom: 0 }}>
                      <ShieldCheck size={14} /> Late fee {formatMoney(successDetails.lateAmount)} pending collection
                    </div>
                  )}
                  <button className="entry-submit" style={{ marginTop: 24 }} onClick={() => navigate('/user')}>
                    Back to Dashboard
                  </button>
                </motion.div>
              ) : selectedOption ? (
                <motion.section key="checkout" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                  <div className="entry-topbar">
                    <button className="entry-back" onClick={() => setSelectedOption(null)} aria-label="Back to options"><ArrowLeft size={18} /></button>
                    <div>
                      <div className="entry-title">Confirm details</div>
                      <div className="entry-muted">Your selected entry option is ready for Razorpay.</div>
                    </div>
                  </div>

                  <div className="checkout-summary">
                    <div className="summary-row"><span>Option</span><strong>{optionSummary.title}</strong></div>
                    <div className="summary-row"><span>Access</span><strong>{optionSummary.subtitle}</strong></div>
                    <div className="summary-row"><span>Base amount</span><strong>{formatMoney(optionSummary.base)}</strong></div>
                    <div className="summary-row"><span>Estimated total with GST</span><strong>{formatMoney(optionSummary.total)}</strong></div>
                  </div>

                  {!isAuthenticated && (
                    <>
                      {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                        <div className="w-full flex justify-center mt-3 mb-3">
                          <div ref={googleButtonRef} />
                        </div>
                      ) : (
                        <button type="button" className="entry-google entry-google-fallback" onClick={handleGoogleUnavailable}>
                          <span className="google-mark" />
                          Sign up or sign in with Google
                        </button>
                      )}
                      <div className="entry-divider-text">or enter details</div>
                    </>
                  )}

                  <div className="entry-form">
                    {!isAuthenticated && (
                      <div className="auth-mode-switch" role="tablist" aria-label="Choose account action">
                        <button type="button" className={`auth-mode-btn ${authMode === 'signup' ? 'active' : ''}`} onClick={() => setAuthMode('signup')}>Sign Up</button>
                        <button type="button" className={`auth-mode-btn ${authMode === 'signin' ? 'active' : ''}`} onClick={() => setAuthMode('signin')}>Sign In</button>
                      </div>
                    )}
                    {(!isAuthenticated && authMode === 'signup') && (
                      <EntryField icon={<User size={15} />} label="Full Name" value={details.name} onChange={(value) => setDetails((d) => ({ ...d, name: value }))} />
                    )}
                    <EntryField icon={<Mail size={15} />} label="Email" type="email" value={details.email} onChange={(value) => setDetails((d) => ({ ...d, email: value }))} />
                    {(!isAuthenticated && authMode === 'signup') && (
                      <EntryField icon={<Phone size={15} />} label="Phone" type="tel" value={details.phone} onChange={(value) => setDetails((d) => ({ ...d, phone: value }))} />
                    )}
                    {!isAuthenticated && (
                      <EntryField icon={authMode === 'signin' ? <Lock size={15} /> : <ShieldCheck size={15} />} label={authMode === 'signin' ? 'Password' : 'Create Password'} type="password" value={details.password} onChange={(value) => setDetails((d) => ({ ...d, password: value }))} />
                    )}
                  </div>

                  <button className="entry-submit" disabled={actionLoading} onClick={handleStartPayment}>
                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <><Wallet size={18} /> Continue to Razorpay</>}
                  </button>
                  <div className="checkout-note">
                    <ShieldCheck size={16} />
                    <span>We use these details only for your account, payment receipt, and entry record.</span>
                  </div>
                </motion.section>
              ) : (
                <motion.section key="options" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}>
                  <div className="entry-topbar">
                    <div>
                      <div className="entry-title">{data?.hasActiveCheckIn ? 'Confirm checkout' : 'Smart entry'}</div>
                      <div className="entry-muted">
                        {data?.hasActiveCheckIn
                          ? 'You already have an active session for this sport. Confirm checkout to close it.'
                          : 'Pick the access type you want to use today.'}
                      </div>
                    </div>
                  </div>

                  {data?.hasActiveCheckIn && (
                    <>
                      <div className="entry-status-badge badge-checked-in"><Clock size={14} /> Currently Checked In</div>
                      <div className="checkout-summary">
                        <div className="summary-row"><span>Sport</span><strong>{data?.sport?.name || 'Sport'}</strong></div>
                        <div className="summary-row"><span>Checked in</span><strong>{data?.activeCheckIn?.checkInTime ? new Date(data.activeCheckIn.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</strong></div>
                        <div className="summary-row"><span>Session duration</span><strong>{elapsedTime}</strong></div>
                        <div className="summary-row"><span>Allowed time</span><strong>{data?.sport?.allowedDurationMinutes || 75} mins</strong></div>
                      </div>
                      <button className="entry-action-btn btn-checkout" onClick={handleCheckOut} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Check-Out'}
                      </button>
                    </>
                  )}

                  {!data?.hasActiveCheckIn && (data?.hasMembership || data?.hasPrepaidPass) && data?.validationAllowed === false && (
                    <div className="bg-red-50/10 border border-red-500/30 rounded-xl p-4 mb-4 text-center">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <h4 className="text-red-300 font-semibold text-lg">Entry Not Permitted</h4>
                      <p className="text-red-200/80 text-sm mt-1">{data.validationReason}</p>
                    </div>
                  )}

                  {!data?.hasActiveCheckIn && (data?.hasMembership || data?.hasPrepaidPass) && data?.validationAllowed !== false && (
                    <>
                      <div className="entry-status-badge badge-member">
                        <BadgeCheck size={14} /> {data?.hasPrepaidPass ? 'Prepaid Pass Ready' : 'Active Member'}
                      </div>
                      <button className="entry-action-btn btn-checkin" onClick={handleCheckIn} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Check-In'}
                      </button>
                    </>
                  )}

                  {!data?.hasActiveCheckIn && !data?.hasMembership && !data?.hasPrepaidPass && (
                    <div className="bg-red-50/10 border border-red-500/30 rounded-xl p-5 mt-4 mb-4 text-center">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                      <h4 className="text-red-300 font-bold text-xl mb-2">Access Denied / Wrong QR</h4>
                      <p className="text-red-200/80 text-sm mb-6">
                        You don't have an active membership or pass for <strong>{data?.sport?.name}</strong>.
                      </p>
                      <button
                        onClick={() => navigate(`/sports/${data?.sport?.slug}`)}
                        className="w-full py-3 px-4 rounded-xl bg-[#df1526] hover:bg-[#df1526]/80 active:scale-[0.98] transition-all text-white text-sm font-bold shadow-lg shadow-red-950/20 flex items-center justify-center gap-2"
                      >
                        Book {data?.sport?.name} Slots
                      </button>
                    </div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}

function EntryField({ icon, label, value, onChange, type = 'text' }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <span className="field-inner">
        {icon}
        <input className="field-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="off" />
      </span>
    </label>
  );
}
