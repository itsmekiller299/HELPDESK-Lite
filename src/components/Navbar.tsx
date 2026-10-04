'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Ticket, BookOpen, BarChart3, LogOut, Menu, X, Bell, Moon, Sun, UserRound, Plus } from 'lucide-react';
import SheLogo from '@/components/SheLogo';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isLight, setIsLight] = useState(true);

  useEffect(() => {
    const light = localStorage.getItem('theme') !== 'dark';
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
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-4 py-2.5" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md" aria-label="SHE Software Solutions — HelpDesk Lite">
          <SheLogo />
          <span className="hidden sm:block text-sm font-semibold text-white whitespace-nowrap tracking-tight">HelpDesk Lite</span>
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
                    ? 'bg-purple-500/10 text-purple-500'
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
                {notifications.length === 0 ? <p className="p-2 text-sm text-gray-400">You&rsquo;re all caught up.</p> : notifications.map(notification => (
                  <Link key={notification.id} href={notification.ticket_id ? `/tickets/${notification.ticket_id}` : '/tickets'} onClick={() => void openNotification(notification)} className={`block rounded-lg p-3 text-sm hover:bg-white/10 ${notification.is_read ? 'text-gray-400' : 'text-white bg-white/5'}`}>
                    {notification.message}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/tickets/new" className="btn-primary min-h-0 px-3 py-2 text-sm gap-1.5">
            <Plus size={15} /> New ticket
          </Link>
          <button onClick={toggleTheme} aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
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

        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} className="md:hidden flex items-center gap-2 p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-all">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-4 pb-2 border-t border-white/10 pt-3 space-y-2">
          {visibleLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 transition-all"
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          <Link href="/tickets/new" onClick={() => setMobileOpen(false)} className="btn-primary w-full mt-3 text-sm gap-2 justify-center">
            <Plus size={16} /> New ticket
          </Link>
          <button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-white/10 w-full">
            {isLight ? <Moon size={16} /> : <Sun size={16} />} {isLight ? 'Dark mode' : 'Light mode'}
          </button>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-white/10 w-full">
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}