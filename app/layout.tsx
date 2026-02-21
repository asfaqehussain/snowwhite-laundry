import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";
import { PageLoader } from "@/components/ui/page-loader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Snow White Washing Company",
  description: "Laundry Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans antialiased bg-slate-50 text-slate-900 selection:bg-brand-100 selection:text-brand-900`}
      >
        <AuthProvider>
          <PageLoader />
          {children}
          <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontFamily: 'var(--font-inter)', fontSize: '14px' } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
