import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-white/80">
      <div className="max-w-7xl mx-auto px-4 py-7 text-sm sm:px-6 sm:pb-10">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-0">
          <div>
            <p className="mt-1 text-gray-400 text-sm sm:text-base">HelpDesk Lite support workspace</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-gray-400 text-sm sm:text-base">
            <Link href="/dashboard" className="hover:text-purple-300">Dashboard</Link>
            <Link href="/tickets" className="hover:text-purple-300">Tickets</Link>
            <Link href="/kb" className="hover:text-purple-300">Knowledge Base</Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs sm:text-sm text-gray-500">© 2024 SHE Software Solutions. All rights reserved.</p>
      </div>
    </footer>
  );
}
