import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppFooter from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "SHE Software Solutions | HelpDesk Lite",
  description: "HelpDesk Lite support workspace by SHE Software Solutions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <div className="aurora-bg" />
        <AuthProvider>
          {children}
          <AppFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
