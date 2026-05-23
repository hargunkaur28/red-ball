import { useState, useRef } from 'react';
import { Camera, Lock, Eye, EyeOff, Save, KeyRound } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const fileInputRef = useRef(null);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 5MB.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name field cannot be empty.');
      return;
    }

    setProfileLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      await updateProfile(formData);
      toast.success('Profile details updated successfully.', {
        style: { background: '#0D0D0D', color: '#FFF', border: '1px solid rgba(223,21,38,0.3)' }
      });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      toast.error('Password must be 8+ characters with uppercase, lowercase, and a number.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully.', {
        style: { background: '#0D0D0D', color: '#FFF', border: '1px solid rgba(223,21,38,0.3)' }
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#df1526]">Red Ball Academy</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl tracking-tight text-white">Profile</h1>
        <p className="mt-2 text-sm text-white/50">Manage your account details and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Profile Details */}
        <div className="rounded-[28px] border border-[#222A2A] bg-[#111515] p-5 sm:p-8 shadow-2xl shadow-black/25 flex flex-col justify-between">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#df1526]"></span>
              Personal Information
            </h3>

            {/* Avatar section */}
            <div className="flex items-center gap-6">
              <div 
                onClick={handleAvatarClick}
                className="relative group h-24 w-24 rounded-full bg-gradient-to-br from-[#df1526] to-[#8f061c] border-2 border-white/10 flex items-center justify-center text-3xl font-black text-white cursor-pointer overflow-hidden shadow-lg hover:shadow-red-900/35 transition-all duration-300 shrink-0"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : user?.photo ? (
                  <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
                
                {/* Overlay camera icon */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity duration-300">
                  <Camera size={18} className="text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white text-base leading-tight">{user?.name || 'User'}</h4>
                <p className="text-xs text-white/45 mt-1">{user?.email || 'No email added'}</p>
                <button 
                  type="button"
                  onClick={handleAvatarClick}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                >
                  Upload New Image
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Full Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Shine"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition focus:border-[#df1526] focus:bg-white/[0.06] placeholder-white/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Phone Number</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7410258963"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition focus:border-[#df1526] focus:bg-white/[0.06] placeholder-white/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Email Address (Read-only)</span>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5 text-white/35 cursor-not-allowed outline-none"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
                    <Lock size={16} />
                  </div>
                </div>
              </label>
            </div>

            <button 
              type="submit"
              disabled={profileLoading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-black transition hover:bg-[#df1526] hover:text-white disabled:opacity-50"
            >
              {profileLoading ? (
                <div className="w-5 h-5 border-2 border-black/35 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card 2: Security & Password */}
        <div className="rounded-[28px] border border-[#222A2A] bg-[#111515] p-5 sm:p-8 shadow-2xl shadow-black/25 flex flex-col justify-between">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#df1526]"></span>
              Security & Credentials
            </h3>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Current Password</span>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-12 text-white outline-none transition focus:border-[#df1526] focus:bg-white/[0.06] placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">New Password</span>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-12 text-white outline-none transition focus:border-[#df1526] focus:bg-white/[0.06] placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Confirm New Password</span>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-12 text-white outline-none transition focus:border-[#df1526] focus:bg-white/[0.06] placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            <button 
              type="submit"
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-black transition hover:bg-[#df1526] hover:text-white disabled:opacity-50"
            >
              {passwordLoading ? (
                <div className="w-5 h-5 border-2 border-black/35 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound size={16} />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
