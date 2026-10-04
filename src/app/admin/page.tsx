'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { BarChart3, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { AnalyticsData } from '@/lib/types';

const COLORS = ['#d94c9a', '#f06cb5', '#ef9aca', '#111111', '#9c9ca4'];

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role === 'Customer')) {
      router.replace(user ? '/tickets' : '/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role !== 'Customer') {
      api.getAnalytics().then(d => {
        setData(d as AnalyticsData);
        setFetching(false);
      }).catch(() => setFetching(false));
    }
  }, [user]);

  if (loading || !user || user.role === 'Customer') return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Ticket overview and SLA metrics</p>
        </div>

        {fetching ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        ) : !data ? (
          <div className="glass-card p-12 text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No data available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-5">
                <div className="text-sm text-gray-400 mb-1">Total Tickets</div>
                <div className="text-3xl font-bold text-white">{data.totalTickets}</div>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm text-gray-400">SLA On Track</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{data.sla.onTrack}</div>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-yellow-400" />
                  <span className="text-sm text-gray-400">At Risk</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{data.sla.atRisk}</div>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-sm text-gray-400">Breached</span>
                </div>
                <div className="text-3xl font-bold text-red-400">{data.sla.breached}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tickets by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="status" stroke="var(--chart-axis)" fontSize={12} />
                    <YAxis stroke="var(--chart-axis)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                    />
                    <Bar dataKey="count" fill="url(#gradient)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f06cb5" />
                        <stop offset="100%" stopColor="#d94c9a" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tickets by Priority</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.byPriority}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="priority" stroke="var(--chart-axis)" fontSize={12} />
                    <YAxis stroke="var(--chart-axis)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.byPriority.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tickets by Category</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.byCategory} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="category" label={({ category, percent }: { category?: string; percent?: number }) => `${category ?? ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {data.byCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Tickets</h3>
                <div className="space-y-3">
                  {data.recentTickets.map((ticket, i) => (
                    <div key={`ticket-${ticket.id}-${i}`} className="glass-sm p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-mono">#{ticket.id}</span>
                        <span className="text-sm text-white font-medium truncate">{ticket.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{ticket.customer_name}</span>
                        <span>•</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
