import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { toast } from 'sonner';
import { Loader2, Truck } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

export default function RestaurantSettings() {
  // ── password change ──────────────────────────────────────────────────────────
  const changePasswordMutation = useMutation({
    mutationFn: (payload) => api.put('/auth/change-password', payload),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      document.getElementById('restaurant-password-form').reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const currentPassword = fd.get('currentPassword');
    const newPassword = fd.get('newPassword');
    const confirmPassword = fd.get('confirmPassword');
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  // ── delivery settings ────────────────────────────────────────────────────────
  const { data: deliveryData, isLoading: deliveryLoading } = useQuery({
    queryKey: ['delivery-settings'],
    queryFn: () => api.get('/kitchen/delivery-settings').then(r => r.data),
  });

  const [delivery, setDelivery] = useState({
    deliveryChargeEnabled: false,
    freeDeliveryMinAmount: 0,
    deliveryChargeBelowMin: 0,
  });

  useEffect(() => {
    if (deliveryData) setDelivery({ ...deliveryData });
  }, [deliveryData]);

  const updateDeliveryMutation = useMutation({
    mutationFn: (payload) => api.put('/kitchen/delivery-settings', payload),
    onSuccess: () => toast.success('Delivery settings saved.'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save delivery settings.'),
  });

  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    updateDeliveryMutation.mutate({
      deliveryChargeEnabled: delivery.deliveryChargeEnabled,
      freeDeliveryMinAmount: Number(delivery.freeDeliveryMinAmount) || 0,
      deliveryChargeBelowMin: Number(delivery.deliveryChargeBelowMin) || 0,
    });
  };

  return (
    <div className="pb-24">
      <PageHeader title="Settings" subtitle="Security and Preferences" />

      <div className="grid grid-cols-1 gap-6">
        {/* Delivery Charge */}
        <div className="card">
          <h3 className="text-sm font-medium text-[#111] mb-1 flex items-center gap-2">
            <Truck size={16} className="text-[#C8102E]" /> Delivery Charge
          </h3>
          <p className="text-xs text-[#999] mb-4">
            Applies only to delivery orders. Table and pickup orders are never charged.
          </p>
          {deliveryLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#999]"><Loader2 size={14} className="animate-spin" /> Loading…</div>
          ) : (
            <form onSubmit={handleDeliverySubmit}>
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setDelivery(d => ({ ...d, deliveryChargeEnabled: !d.deliveryChargeEnabled }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${delivery.deliveryChargeEnabled ? 'bg-[#C8102E]' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${delivery.deliveryChargeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-[#333]">
                  {delivery.deliveryChargeEnabled ? 'Delivery charge enabled' : 'Delivery charge disabled (all delivery orders are free)'}
                </span>
              </div>

              {delivery.deliveryChargeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl border border-[#EAEAEA]">
                  <div>
                    <label className="block text-xs font-medium text-[#666] mb-1">
                      Free delivery above (₹)
                    </label>
                    <input
                      type="number" min={0} step={1}
                      className="input-field"
                      value={delivery.freeDeliveryMinAmount}
                      onChange={e => setDelivery(d => ({ ...d, freeDeliveryMinAmount: e.target.value }))}
                      placeholder="e.g. 299"
                    />
                    <p className="text-[11px] text-[#999] mt-1">Orders above this amount get free delivery.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] mb-1">
                      Delivery charge below minimum (₹)
                    </label>
                    <input
                      type="number" min={0} step={1}
                      className="input-field"
                      value={delivery.deliveryChargeBelowMin}
                      onChange={e => setDelivery(d => ({ ...d, deliveryChargeBelowMin: e.target.value }))}
                      placeholder="e.g. 15"
                    />
                    <p className="text-[11px] text-[#999] mt-1">Charged when order is below the minimum.</p>
                  </div>
                  {/* Live preview */}
                  <div className="md:col-span-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-xs text-blue-700 space-y-1">
                    <p className="font-bold">Preview:</p>
                    <p>• Delivery cart ₹{Math.max(0, Number(delivery.freeDeliveryMinAmount) - 1)} → Charge ₹{Number(delivery.deliveryChargeBelowMin) || 0}</p>
                    <p>• Delivery cart ₹{Number(delivery.freeDeliveryMinAmount) || 0} → Charge ₹0 (free)</p>
                    <p>• Pickup/Table → No delivery charge</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={updateDeliveryMutation.isPending} className="btn-primary gap-2">
                {updateDeliveryMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Save Delivery Settings
              </button>
            </form>
          )}
        </div>

        {/* Security / Change Password */}
        <div className="card">
          <h3 className="text-sm font-medium text-[#111] mb-4">Security</h3>
          <form id="restaurant-password-form" onSubmit={handlePasswordSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#666] mb-1">Current Password</label>
                <input name="currentPassword" type="password" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-[#666] mb-1">New Password</label>
                <input name="newPassword" type="password" required minLength="8" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-[#666] mb-1">Confirm New Password</label>
                <input name="confirmPassword" type="password" required minLength="8" className="input-field" />
              </div>
            </div>
            <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary mt-4 gap-2">
              {changePasswordMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
