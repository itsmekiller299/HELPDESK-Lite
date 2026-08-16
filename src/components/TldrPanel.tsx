'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Sparkles, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/Badges';
import type { TicketSummary } from '@/lib/types';

export default function TldrPanel({ ticketId }: { ticketId: number }) {
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await api.getTicketSummary(ticketId));
    } catch (err) {
      console.error(err);
      setError('Could not generate summary. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 mb-6 animate-in">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-purple-300" />
        <h2 className="text-lg font-semibold text-white">Conversation TL;DR</h2>
        <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">AI</span>
      </div>

      {!summary && (
        <button onClick={generate} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'Summarizing...' : 'Generate summary'}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-300 flex items-center gap-2"><AlertCircle size={14} />{error}</p>}

      {summary && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={summary.facts.status} />
            <PriorityBadge priority={summary.facts.priority} />
            <CategoryBadge category={summary.facts.category} />
            <span className="badge bg-white/10 text-gray-300 border border-white/10 text-xs">
              {summary.facts.replyCount} replies
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">
              {summary.facts.subject}
              {summary.facts.assignee ? ` — assigned to ${summary.facts.assignee}` : ''}
            </p>
            <p className="text-xs text-gray-500">
              Last activity: {new Date(summary.facts.last_activity).toLocaleString()}
            </p>
          </div>

          {summary.points.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Key points</p>
              <ul className="space-y-2">
                {summary.points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.questions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Open questions</p>
              <ul className="space-y-1">
                {summary.questions.map((question, index) => (
                  <li key={index} className="text-sm text-amber-300">· {question}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.participants.length > 0 && (
            <p className="text-xs text-gray-500">
              Participants: {summary.participants.join(' · ')}
            </p>
          )}

          <button onClick={generate} disabled={loading} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}