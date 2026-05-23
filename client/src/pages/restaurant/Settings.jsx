import { useMutation } from '@tanstack/react-query';
import api from '../../lib/axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

export default function RestaurantSettings() {
  const changePasswordMutation = useMutation({
    mutationFn: (payload) => api.put('/auth/change-password', payload),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      document.getElementById('restaurant-password-form').reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const currentPassword = fd.get('currentPassword');
    const newPassword = fd.get('newPassword');
    const confirmPassword = fd.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="pb-24">
      <PageHeader title="Settings" subtitle="Security and Preferences" />
      
      <div className="grid grid-cols-1 gap-6">
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
