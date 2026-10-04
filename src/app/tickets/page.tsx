'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { StatusBadge, PriorityBadge, SLABadge } from '@/components/Badges';
import Link from 'next/link';
import { Plus, Search, Ticket } from 'lucide-react';
import type { Ticket as TicketType } from '@/lib/types';

export default function TicketsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.getTickets().then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setFetching(false);
      }).catch(() => setFetching(false));
    }
  }, [user]);

  const filtered = useMemo(() => {
    let result = tickets;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    return result;
  }, [search, statusFilter, tickets]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Tickets</h1>
            <p className="text-gray-400 mt-1">{user.role === 'Customer' ? 'Track your support requests' : 'All support tickets'}</p>
          </div>
          <Link href="/tickets/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Issue
          </Link>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input w-full sm:w-40">
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>
        </div>

        {fetching ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Ticket size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-white mb-2">No tickets found</h3>
            <p className="text-gray-400 text-sm">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No tickets yet. Create one to get started!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket, i) => (
              <Link key={`${ticket.id}-${i}`} href={`/tickets/${ticket.id}`}>
                <div className="glass-card p-4 cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-mono">#{ticket.id}</span>
                        <h3 className="text-white font-semibold truncate">{ticket.subject}</h3>
                      </div>
                      <p className="text-gray-400 text-sm truncate">{ticket.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      {ticket.sla && <SLABadge sla={ticket.sla} />}
                      <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
