import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { getApplicationIdentity } from '@/lib/brand-identity'
import { AppIdentityProvider } from '@/components/layout/AppIdentityProvider'
import "./globals.css";

export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getApplicationIdentity()

  return {
    title: `${identity.name} - ERP Konveksi`,
    description: `ERP System untuk ${identity.name} Jersey Convection`,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const identity = await getApplicationIdentity()

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppIdentityProvider identity={identity}>
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3000}
          />
          {children}
        </AppIdentityProvider>
      </body>
    </html>
  );
}
