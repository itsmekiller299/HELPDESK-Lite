'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Search, BookOpen, Plus, X } from 'lucide-react';
import { CategoryBadge } from '@/components/Badges';
import type { Article } from '@/lib/types';

export default function KBPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const fetchArticles = async () => {
    try {
      const data = await api.getKB(search || undefined, categoryFilter || undefined);
      setArticles(Array.isArray(data) ? data : []);
    } catch {} finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void fetchArticles();
    // fetchArticles intentionally changes whenever the selected filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createKB({ title: newTitle, body: newBody, category: newCategory });
      setNewTitle('');
      setNewBody('');
      setNewCategory('General');
      setShowCreate(false);
      fetchArticles();
    } catch {}
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
            <p className="text-gray-400 mt-1">Find answers and guides</p>
          </div>
          {user.role === 'Admin' && (
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
              {showCreate ? <X size={18} /> : <Plus size={18} />}
              {showCreate ? 'Cancel' : 'New Article'}
            </button>
          )}
        </div>

        {showCreate && user.role === 'Admin' && (
          <div className="glass p-6 mb-6 animate-in">
            <h3 className="text-lg font-semibold text-white mb-4">Create Article</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="glass-input" placeholder="Article title" required />
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)} className="glass-input min-h-[120px] resize-y" placeholder="Article content..." required />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="glass-input">
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="General">General</option>
              </select>
              <button type="submit" className="btn-primary">Create Article</button>
            </form>
          </div>
        )}

        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input pl-10" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="glass-input w-full sm:w-40">
              <option value="">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Billing">Billing</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        {fetching ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-white mb-2">No articles found</h3>
            <p className="text-gray-400 text-sm">No knowledge base articles match your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(article => (
              <div key={article.id} className="glass-card p-5 cursor-pointer" onClick={() => setExpanded(expanded === article.id ? null : article.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{article.title}</h3>
                      <CategoryBadge category={article.category} />
                    </div>
                    {expanded === article.id ? (
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{article.body}</p>
                    ) : (
                      <p className="text-gray-400 text-sm line-clamp-2">{article.body}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
