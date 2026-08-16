'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Ticket, BookOpen, BarChart3, LogOut, Menu, X, Bell, Moon, Sun, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const light = localStorage.getItem('theme') === 'light';
    setIsLight(light);
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    void api.getNotifications().then(data => setNotifications(Array.isArray(data) ? data : [])).catch(() => setNotifications([]));
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isLight;
    setIsLight(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'light' : 'dark');
    document.documentElement.dataset.theme = nextTheme ? 'light' : 'dark';
  };

  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  const openNotification = async (notification: Notification) => {
    setNotificationsOpen(false);
    if (!notification.is_read) {
      await api.markNotificationRead(notification.id).catch(() => undefined);
      setNotifications(current => current.map(item => item.id === notification.id ? { ...item, is_read: 1 } : item));
    }
  };

  if (!user) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Agent'] },
    { href: '/tickets', label: 'Tickets', icon: Ticket, roles: ['Admin', 'Agent', 'Customer'] },
    { href: '/kb', label: 'Knowledge Base', icon: BookOpen, roles: ['Admin', 'Agent', 'Customer'] },
    { href: '/admin', label: 'Analytics', icon: BarChart3, roles: ['Admin', 'Agent'] },
    { href: '/profile', label: 'Profile', icon: UserRound, roles: ['Admin', 'Agent', 'Customer'] },
  ];

  const visibleLinks = links.filter(l => l.roles.includes(user.role));

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-4 py-3" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--gradient-primary)', color: '#fff' }}>
            <Ticket size={18} />
          </div>
          <span className="text-lg font-bold text-white">HelpDesk Lite</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {visibleLinks.map(link => {
            const Icon = link.icon;
            const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications" className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white" style={{ color: '#fff' }}>{unreadCount}</span>}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto glass-card p-2 z-50">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400">Notifications</p>
                {notifications.length === 0 ? <p className="p-2 text-sm text-gray-400">You’re all caught up.</p> : notifications.map(notification => (
                  <Link key={notification.id} href={notification.ticket_id ? `/tickets/${notification.ticket_id}` : '/tickets'} onClick={() => void openNotification(notification)} className={`block rounded-lg p-3 text-sm hover:bg-white/10 ${notification.is_read ? 'text-gray-400' : 'text-white bg-white/5'}`}>
                    {notification.message}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button onClick={toggleTheme} aria-label="Toggle color theme" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="text-right">
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-xs text-gray-400">{user.role}</div>
          </div>
          <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <LogOut size={18} />
          </button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-3 pb-2 border-t border-white/10 pt-3 space-y-1">
          {visibleLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10"
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 w-full">
            {isLight ? <Moon size={16} /> : <Sun size={16} />} {isLight ? 'Dark mode' : 'Light mode'}
          </button>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 w-full">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
