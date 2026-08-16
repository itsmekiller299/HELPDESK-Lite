import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "HelpDesk Lite",
  description: "Lightweight customer support ticketing platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="aurora-bg" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
