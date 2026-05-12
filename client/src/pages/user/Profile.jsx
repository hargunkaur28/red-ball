import useAuthStore from '../../store/authStore';
import PageHeader from '../../components/shared/PageHeader';

export default function Profile() {
  const { user } = useAuthStore();
  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account" />
      <div className="card max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-[#111111] text-xl font-bold">
            {user?.name?.[0]}
          </div>
          <div><h2 className="text-[#111111] font-semibold text-lg">{user?.name}</h2><p className="text-sm text-[#888888]">{user?.email}</p></div>
        </div>
        <div className="space-y-3">
          <div><label className="block text-sm text-[#666666] mb-1">Name</label><input className="input-field" defaultValue={user?.name} /></div>
          <div><label className="block text-sm text-[#666666] mb-1">Phone</label><input className="input-field" defaultValue={user?.phone} /></div>
          <div><label className="block text-sm text-[#666666] mb-1">Email</label><input className="input-field" defaultValue={user?.email} disabled /></div>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
