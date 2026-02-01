import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { NoteContextProvider } from "@/components/hooks/useNote";
import { ToolsProvider } from "@/components/hooks/useTools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paperly | Class Note",
  description:
    "Write, draw, and save handwritten notes with stylus support directly in your browser.",
  keywords: [
    "handwriting note app",
    "stylus note app",
    "apple pencil web app",
    "browser note app",
    "handwriting notes",
    "digital notebook",
    "canvas drawing app",
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevents pinch-to-zoom which can interfere with drawing
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NoteContextProvider>
          <ToolsProvider>{children}</ToolsProvider>
        </NoteContextProvider>
      </body>
    </html>
  );
}
