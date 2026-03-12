import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mijn Yielder",
    template: "%s | Mijn Yielder",
  },
  description: "Uw IT-omgeving in één overzicht — beheer hardware, software, contracten en tickets vanuit één dashboard.",
  icons: {
    icon: "/yielder-monogram.png",
    apple: "/yielder-monogram.png",
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Mijn Yielder",
    title: "Mijn Yielder",
    description: "Uw IT-omgeving in één overzicht — beheer hardware, software, contracten en tickets vanuit één dashboard.",
  },
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL(process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://portaal.yielder.nl"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
