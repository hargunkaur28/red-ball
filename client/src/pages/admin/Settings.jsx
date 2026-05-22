import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

export default function Settings() {
  const qc = useQueryClient();

  // Fetch session configs
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['session-configs'],
    queryFn: () => api.get('/session-config').then(r => r.data.data),
  });

  const globalConfig = configs.find(c => c.key === 'default') || {
    allowedDurationMinutes: 75,
    overtimeThresholdMinutes: 0,
    lateFeePerMinuteOverride: '',
    autoCheckoutAfterMinutes: 240,
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put('/session-config', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-configs'] });
      toast.success('Session configuration saved!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    }
  });

  const handleGlobalConfigSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      key: 'default',
      type: 'global',
      allowedDurationMinutes: Number(fd.get('allowedDurationMinutes')),
      overtimeThresholdMinutes: Number(fd.get('overtimeThresholdMinutes')),
      lateFeePerMinuteOverride: fd.get('lateFeePerMinuteOverride') ? Number(fd.get('lateFeePerMinuteOverride')) : null,
      autoCheckoutAfterMinutes: Number(fd.get('autoCheckoutAfterMinutes')),
    };
    updateMutation.mutate(payload);
  };

  return (
    <div className="pb-24">
      <PageHeader title="Settings" subtitle="Academy configuration" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-[#111] mb-4">Academy Info</h3>
          <div className="space-y-3">
            <div><label className="block text-sm text-[#666] mb-1">Academy Name</label><input className="input-field" defaultValue="Red Ball Cricket Academy" /></div>
            <div><label className="block text-sm text-[#666] mb-1">Address</label><input className="input-field" defaultValue="123 Sports Complex" /></div>
            <div><label className="block text-sm text-[#666] mb-1">GSTIN</label><input className="input-field" placeholder="Enter GSTIN" /></div>
            <div><label className="block text-sm text-[#666] mb-1">Phone</label><input className="input-field" placeholder="+91 XXXXXXXXXX" /></div>
            <button className="btn-primary mt-2">Save Changes</button>
          </div>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-[#111] mb-4">GST Settings</h3>
          <div className="space-y-3">
            <div><label className="block text-sm text-[#666] mb-1">Default GST %</label><input type="number" className="input-field" defaultValue="18" /></div>
            <div><label className="block text-sm text-[#666] mb-1">Restaurant GST %</label><input type="number" className="input-field" defaultValue="5" /></div>
            <button className="btn-primary mt-2">Update GST</button>
          </div>
        </div>

        {/* Global Session Configuration */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-[#111]">Global Session Configuration</h3>
              <p className="text-xs text-[#888] mt-1">Default session rules applied to all memberships and QR check-ins.</p>
            </div>
            {globalConfig.configVersion && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium border border-blue-100">
                v{globalConfig.configVersion}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#888]" />
            </div>
          ) : (
            <form onSubmit={handleGlobalConfigSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Allowed Session Duration (mins) <span className="text-red-500">*</span></label>
                  <input name="allowedDurationMinutes" type="number" required min="5" max="1440" defaultValue={globalConfig.allowedDurationMinutes} className="input-field" />
                  <p className="text-[10px] text-[#888] mt-1">Base time before overtime triggers.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Overtime Grace Period (mins)</label>
                  <input name="overtimeThresholdMinutes" type="number" min="0" defaultValue={globalConfig.overtimeThresholdMinutes} className="input-field" />
                  <p className="text-[10px] text-[#888] mt-1">Buffer before late fees apply.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Global Late Fee / Minute (₹)</label>
                  <input name="lateFeePerMinuteOverride" type="number" min="0" step="0.01" defaultValue={globalConfig.lateFeePerMinuteOverride || ''} className="input-field" placeholder="Leave empty to use sport's hourly rate" />
                  <p className="text-[10px] text-[#888] mt-1">Overrides default sport calculations.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Auto-Checkout After (mins) <span className="text-red-500">*</span></label>
                  <input name="autoCheckoutAfterMinutes" type="number" required min="30" defaultValue={globalConfig.autoCheckoutAfterMinutes} className="input-field" />
                  <p className="text-[10px] text-[#888] mt-1">Forces check-out if user forgets.</p>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary gap-2">
                  {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Save Session Settings
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
