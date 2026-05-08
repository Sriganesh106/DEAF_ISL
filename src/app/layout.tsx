import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Silent Learn - Deaf Interactive Learning Platform",
  description: "A visual learning platform for Deaf students in India. Learn with Indian Sign Language (ISL) detection, AR experiences, and interactive lessons.",
  keywords: ["Deaf Education", "Indian Sign Language", "ISL", "AR Learning", "Accessibility", "Sign Language Detection", "Visual Learning"],
  authors: [{ name: "Silent Learn Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Silent Learn - Deaf Interactive Learning Platform",
    description: "Learning without sound barriers. ISL detection, AR lessons, and visual education for Deaf students.",
    url: "https://silentlearn.com",
    siteName: "Silent Learn",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Silent Learn - Deaf Interactive Learning Platform",
    description: "Learning without sound barriers. Visual education for Deaf students in India.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
