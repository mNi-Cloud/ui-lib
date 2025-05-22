import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { NextAuthProvider } from "@/registry/new-york/blocks/session-provider/session-provider";
import { ThemeProvider } from "@/registry/new-york/blocks/theme-provider/theme-provider";
import { Header } from "@/registry/new-york/blocks/header/header";
import { Content } from "@/registry/new-york/blocks/content/content";
import { Session } from "@/registry/new-york/blocks/session/session";
import SideNav from "@/registry/new-york/blocks/sidenav/sidenav";
import { SidebarInset, SidebarProvider } from "@/registry/new-york/ui/sidebar";
import { LayoutGrid } from "lucide-react";
import { Toaster } from "sonner";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Service Name",
  description: "Service Description",
};

const headerMenu = {
  icon: LayoutGrid,
  title: "Service Name",
  subtitle: "v1alpha1",
  href: "/service"
}

const navItems = [
  {
    name: "Resource Category",
    href: "/service",
    items: [
      { name: "Home", href: "/service" },
      { name: "Resource Type 1", href: "/service/resource1" },
      { name: "Resource Type 2", href: "/service/resource2" }
    ]
  }
];


export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <NextIntlClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SidebarProvider>
                <SideNav headerMenu={headerMenu} navItems={navItems} />
                <SidebarInset>
                  <Header />
                  <Session />
                  <Content>
                    <main>
                      <Toaster richColors />
                      {children}
                    </main>
                  </Content>
                </SidebarInset>
              </SidebarProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}