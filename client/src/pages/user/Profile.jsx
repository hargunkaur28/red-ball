import useAuthStore from '../../store/authStore';

export default function Profile() {
  const { user } = useAuthStore();
  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#df1526]">Red Ball Academy</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl tracking-tight text-white">Profile</h1>
        <p className="mt-2 text-sm text-white/50">Manage your account</p>
      </div>

      <div className="max-w-xl rounded-[28px] border border-[#222A2A] bg-[#111515] p-5 sm:p-8 shadow-2xl shadow-black/25">
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#df1526] to-[#8f061c] text-2xl font-black text-white shadow-lg shadow-red-950/30">
            {initial}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
            <p className="mt-1 text-sm text-white/48">{user?.email || 'No email added'}</p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/58">Name</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#df1526] focus:bg-white/[0.06]"
              defaultValue={user?.name || ''}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/58">Phone</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#df1526] focus:bg-white/[0.06]"
              defaultValue={user?.phone || ''}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/58">Email</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/45 outline-none"
              defaultValue={user?.email || ''}
              disabled
            />
          </label>

          <button className="rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-[#df1526] hover:text-white">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
