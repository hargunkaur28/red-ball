import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { toast } from 'sonner';

export default function UsersRoles() {
  const [roleFilter, setRoleFilter] = useState('');
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['users', roleFilter], queryFn: () => api.get(`/admin/users?role=${roleFilter}`).then(r => r.data) });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); },
  });

  const columns = [
    { key: 'name', label: 'Name', sortable: true, render: r => <span className="text-[#111111] font-medium">{r.name}</span> },
    { key: 'email', label: 'Email', render: r => <span className="text-[#666666]">{r.email}</span> },
    { key: 'role', label: 'Role', render: r => <span className="badge badge-info">{r.role}</span> },
    { key: 'status', label: 'Status', render: r => <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>{r.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: '', render: r => <button className="btn-ghost text-xs" onClick={() => toggleMutation.mutate(r._id)}>{r.isActive ? 'Deactivate' : 'Activate'}</button> },
  ];

  const roles = ['', 'superadmin', 'admin', 'manager', 'receptionist', 'user'];

  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Manage user accounts and permissions" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {roles.map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${roleFilter === r ? 'bg-black text-white' : 'btn-ghost'}`}>{r || 'All'}</button>
        ))}
      </div>
      <DataTable columns={columns} data={data?.users || []} />
    </div>
  );
}
