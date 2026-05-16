import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, MapPin, Activity, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';

export default function LiveOccupancy() {
  const { data: stats } = useQuery({
    queryKey: ['analytics', 'occupancy'],
    queryFn: () => api.get('/analytics/occupancy').then(r => r.data),
    refetchInterval: 10000,
  });

  const arenas = stats?.arenas || [
    { name: 'Cricket Turf A', players: 4, capacity: 10, status: 'active' },
    { name: 'Badminton Court 1', players: 2, capacity: 4, status: 'active' },
    { name: 'Swimming Pool', players: 8, capacity: 20, status: 'active' },
  ];

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Live Academy Occupancy</h3>
          <p className="text-sm text-gray-500">Real-time player activity across all arenas</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full text-green-600 border border-green-100">
          <Activity size={16} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">Live Now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Active Players</span>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-gray-900">{stats?.activePlayers || 14}</div>
            <Users className="text-[#C8102E]" size={24} />
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Checked-In</span>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-gray-900">{stats?.checkedIn || 8}</div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Ongoing Sessions</span>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-gray-900">{stats?.ongoingSessions || 3}</div>
            <Activity className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Arena Load</span>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-gray-900">{stats?.load || '35%'}</div>
            <MapPin className="text-amber-500" size={24} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Arena Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {arenas.map((arena, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${arena.players > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-xs font-bold text-gray-700">{arena.name}</span>
              </div>
              <span className="text-[10px] font-black text-gray-400">{arena.players}/{arena.capacity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
