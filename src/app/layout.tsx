import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'StudentIQ Exam Engine | NTA Mock Tests for Coaching Centers',
    template: '%s | StudentIQ Exam Engine',
  },
  description: 'The coaching-connected exam engine for JEE, NEET & MHT-CET. Create NTA-identical mock tests, auto-generate papers, and sync analytics to your coaching dashboard.',
  keywords: ['JEE mock test', 'NEET practice', 'MHT CET online test', 'coaching software', 'exam engine', 'StudentIQ'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
