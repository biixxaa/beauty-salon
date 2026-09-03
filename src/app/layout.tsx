import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

export const metadata: Metadata = {
  title: "TerazBeauty | Discover & Book Premium Beauty Salons & Barbershops",
  description: "Find the best beauty salons, spas, nail technicians, and barbershops in Addis Ababa. AI consultations, online booking, and secure payments via Telebirr & CBE Birr.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
