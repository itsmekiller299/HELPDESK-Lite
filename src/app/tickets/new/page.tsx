'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { Article, ClassificationSuggestion } from '@/lib/types';

export default function NewTicketPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<ClassificationSuggestion | null>(null);
  const [kbSuggestions, setKbSuggestions] = useState<Article[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (subject.length > 3 || description.length > 10) {
      const timer = setTimeout(async () => {
        try {
          const [classifyResult, kbResult] = await Promise.all([
            api.suggestClassify(subject, description),
            api.suggestKB(subject, description),
          ]);
          setSuggestion(classifyResult as ClassificationSuggestion);
          setKbSuggestions(Array.isArray(kbResult) ? kbResult : []);
        } catch {}
      }, 500);
      debounceTimer.current = timer;
    } else {
      setSuggestion(null);
      setKbSuggestions([]);
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [subject, description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.createTicket({
        subject,
        description,
        category: category || undefined,
        priority: priority || undefined,
      });
      router.push(`/tickets/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <Link href="/tickets" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Menu
        </Link>

        <div className="glass p-6 animate-in">
          <h1 className="text-2xl font-bold text-white mb-6">Report on Issue</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="glass-input"
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="glass-input min-h-[150px] resize-y"
                placeholder="Provide details about your issue..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category
                  {suggestion && !category && (
                    <span className="ml-2 text-xs text-purple-400">
                      <Sparkles size={12} className="inline mr-1" />
                      Auto-suggested: {suggestion.suggestedCategory}
                    </span>
                  )}
                </label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="glass-input">
                  <option value="">Auto-detect</option>
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Priority
                  {suggestion && !priority && (
                    <span className="ml-2 text-xs text-purple-400">
                      <Sparkles size={12} className="inline mr-1" />
                      Auto-suggested: {suggestion.suggestedPriority}
                    </span>
                  )}
                </label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="glass-input">
                  <option value="">Auto-detect</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>

        {kbSuggestions.length > 0 && (
          <div className="glass-card p-6 mt-6 animate-in">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-teal-400" />
              <h3 className="text-white font-semibold">Suggested Articles</h3>
              <span className="badge bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs">Ticket Deflection</span>
            </div>
            <div className="space-y-3">
              {kbSuggestions.map(article => (
                <div key={article.id} className="glass-sm p-4">
                  <h4 className="text-white font-medium text-sm mb-1">{article.title}</h4>
                  <p className="text-gray-400 text-xs line-clamp-2">{article.body}</p>
                  <Link href="/kb" className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block">
                    Read full article →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
