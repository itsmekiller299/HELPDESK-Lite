'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import TldrPanel from '@/components/TldrPanel';
import { ArrowLeft, Paperclip, Send } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge, SLABadge, CategoryBadge } from '@/components/Badges';
import type { Agent, Ticket } from '@/lib/types';

type Comment = {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  content: string;
  is_internal: boolean | number;
  created_at: string;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_data?: string | null;
};

function isComment(comment: unknown): comment is Comment {
  return typeof comment === 'object' && comment !== null && 'id' in comment && typeof (comment as Comment).id === 'number';
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; type: string; data: string } | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [ticketId, setTicketId] = useState<number>(0);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    params.then(p => setTicketId(Number(p.id)));
  }, [params]);

  useEffect(() => {
    if (!ticketId || !user) return;
    Promise.all([
      api.getTicket(ticketId),
      api.getComments(ticketId),
      user.role !== 'Customer' ? api.getAgents() : Promise.resolve([]),
    ]).then(([ticketData, commentsData, agentsData]) => {
      setTicket(ticketData as Ticket);
      // Ignore invalid entries so one malformed comment cannot crash the ticket page.
      setComments(Array.isArray(commentsData) ? commentsData.filter(isComment) : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setFetching(false);
    }).catch(() => {
      setFetching(false);
      router.replace('/tickets');
    });
  }, [ticketId, user, router]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment(ticketId, newComment, isInternal, attachment || undefined);
      if (isComment(comment)) {
        setComments(currentComments => [...currentComments, comment]);
      }
      setNewComment('');
      setIsInternal(false);
      setAttachment(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachment = (file: File | undefined) => {
    setAttachmentError('');
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type) || file.size > 650 * 1024) {
      setAttachmentError('Choose a PNG, JPEG, PDF, or text file smaller than 650 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachment({ name: file.name, type: file.type, data: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await api.updateTicket(ticketId, { status: newStatus });
      setTicket(updated as Ticket);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (agentId: number | null) => {
    try {
      const updated = await api.updateTicket(ticketId, { assigned_to: agentId });
      setTicket(updated as Ticket);
    } catch (err) {
      console.error(err);
    }
  };

  const VALID_TRANSITIONS: Record<string, string[]> = {
    Open: ['InProgress'],
    InProgress: ['Resolved'],
    Resolved: ['Closed', 'Reopened'],
    Closed: ['Reopened'],
    Reopened: ['InProgress'],
  };

  if (loading || !user || fetching) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24">
          <div className="glass-card p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading ticket...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const transitions = VALID_TRANSITIONS[ticket.status] || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <Link href="/tickets" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Tickets
        </Link>

        <div className="glass-card p-6 mb-6 animate-in">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500 font-mono">#{ticket.id}</span>
                <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
              </div>
              <p className="text-gray-300 leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
            {ticket.sla && <SLABadge sla={ticket.sla} />}
            {ticket.auto_suggested ? (
              <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30">Auto-suggested</span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
            {ticket.assignee && <span>| Assigned to: {ticket.assignee.name}</span>}
          </div>

          {user.role !== 'Customer' && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              {transitions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-400">Change status:</span>
                  {transitions.map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)} className="btn-secondary text-xs py-1 px-3">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400">Assign to:</span>
                <select
                  value={ticket.assigned_to || ''}
                  onChange={e => handleAssign(e.target.value ? Number(e.target.value) : null)}
                  className="glass-input w-auto text-sm py-1"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a, i) => (
                    <option key={a.id ?? i} value={a.id ?? i}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <TldrPanel ticketId={ticket.id} />

        <div className="glass-card p-6 mb-6 animate-in">
          <h2 className="text-lg font-semibold text-white mb-4">Conversation</h2>

          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No comments yet. Start the conversation below.</p>
          ) : (
            <div className="space-y-3 mb-6">
              {comments.map((comment, i) => (
                <div
                  key={comment.id ?? i}
                  className={`p-4 rounded-xl ${
                    comment.is_internal
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : comment.user_id === user.id
                      ? 'bg-purple-500/10 border border-purple-500/20 ml-8'
                      : 'bg-white/5 border border-white/10 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{comment.user_name}</span>
                    <span className="text-xs text-gray-500">{comment.user_role}</span>
                    {comment.is_internal && (
                      <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">Internal Note</span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                  {comment.attachment_name && comment.attachment_data && (
                    <a href={comment.attachment_data} download={comment.attachment_name} className="mt-3 inline-flex items-center gap-2 text-xs text-purple-300 hover:text-purple-200">
                      <Paperclip size={14} /> {comment.attachment_name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {ticket.status !== 'Closed' && (
            <form onSubmit={handleComment} className="space-y-3">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="glass-input min-h-[100px] resize-y"
                placeholder="Type your reply..."
              />
              <div className="flex items-center justify-between">
                {user.role !== 'Customer' && (
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    Internal note (not visible to customer)
                  </label>
                )}
                <button type="submit" disabled={submitting || !newComment.trim()} className="btn-primary flex items-center gap-2 ml-auto">
                  <Send size={16} />
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white">
                  <Paperclip size={14} /> Attach file
                  <input type="file" className="sr-only" accept="image/png,image/jpeg,application/pdf,text/plain" onChange={event => handleAttachment(event.target.files?.[0])} />
                </label>
                {attachment && <span className="ml-3 text-xs text-teal-300">{attachment.name}</span>}
                {attachmentError && <p className="mt-1 text-xs text-red-300">{attachmentError}</p>}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
