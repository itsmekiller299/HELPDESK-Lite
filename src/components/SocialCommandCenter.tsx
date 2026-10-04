'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, Moon, Sun, LogOut } from 'lucide-react';

const PRIMARY_COLOR = '#FF66C4';
const ACCENT_COLOR = '#B9F27D';
const BG_COLOR = 'rgba(20, 25, 35, 0.8)';

export default function SocialCommandCenter() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [socialData, setSocialData] = useState<{ accounts: unknown; mentions: unknown; sentiments: unknown } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const light = localStorage.getItem('theme') === 'light';
    setIsLight(light);
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }, []);

  const fetchSocialData = async () => {
    try {
      const [accounts, mentions, sentiments] = await Promise.all([
        fetch('/api/social/accounts').then(r => r.json()),
        fetch('/api/social/mentions').then(r => r.json()),
        fetch('/api/social/sentiment-summary').then(r => r.json()),
      ]);
      setSocialData({ accounts, mentions, sentiments });
    } catch (err) {
      console.error('Failed to fetch social data:', err);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isLight;
    setIsLight(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'light' : 'dark');
    document.documentElement.dataset.theme = nextTheme ? 'light' : 'dark';
  };

  const toggleMenu = () => setMobileOpen(!mobileOpen);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMobileOpen(false);
    window.location.assign('/login');
  };

  if (!user) return null;

  const visibleLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/social-command-center', label: 'Social Command Center', icon: 'Broadcast' },
    { href: '/tickets', label: 'Tickets', icon: 'Ticket' },
    { href: '/kb', label: 'Knowledge Base', icon: 'BookOpen' },
    { href: '/profile', label: 'Profile', icon: 'UserRound' },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-4 py-3" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-lg font-bold text-white">HelpDesk Lite</span>
        </Link>

        <div className="hidden md-flex items-center gap-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href) ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                                <Icon />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md-flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications" className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white" style={{ color: '#fff' }}>12</span>
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto glass-card p-2 z-50">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400">Notifications</p>
                <p className="p-2 text-sm text-gray-400">You’re all caught up.</p>
              </div>
            )}
          </div>
          <button onClick={toggleTheme} aria-label="Toggle color theme" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="text-right">
            <div className="text-sm font-medium text-white">Alex Smith</div>
            <div className="text-xs text-gray-400">Enterprise Admin</div>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Menu size={18} />
          </button>
        </div>

        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-gray-400">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-3 pb-2 border-t border-white/10 pt-3 space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10"
              >
                                <Icon />
                {link.label}
              </Link>
            );
          })}
          <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 w-full">
            {isLight ? <Moon size={16} /> : <Sun size={16} />} {isLight ? 'Dark mode' : 'Light mode'}
          </button>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 w-full">
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}