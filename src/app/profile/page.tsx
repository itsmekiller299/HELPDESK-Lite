'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (user) setName(user.name);
  }, [loading, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name, ...(password ? { password } : {}) });
      updateUser(updated);
      setPassword('');
      setMessage('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return <div className="min-h-screen"><Navbar /><main className="max-w-xl mx-auto px-4 pt-24 pb-8"><div className="glass-card p-6"><h1 className="text-2xl font-bold text-white">Your profile</h1><p className="text-sm text-gray-400 mt-1">Update your name or password.</p><form onSubmit={handleSubmit} className="space-y-4 mt-6"><div><label className="block text-sm text-gray-300 mb-1">Email</label><input className="glass-input opacity-70" value={user.email} disabled /></div><div><label className="block text-sm text-gray-300 mb-1">Name</label><input className="glass-input" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={80} /></div><div><label className="block text-sm text-gray-300 mb-1">New password <span className="text-gray-500">(optional)</span></label><input className="glass-input" type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} placeholder="At least 8 characters" autoComplete="current-password" /></div>{error && <p className="text-sm text-red-300">{error}</p>}{message && <p className="text-sm text-teal-300">{message}</p>}<button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></form></div></main></div>;
}
