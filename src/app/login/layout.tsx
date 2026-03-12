import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inloggen",
  description: "Log in op Mijn Yielder om uw IT-omgeving te beheren.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Inloggen | Mijn Yielder",
    description: "Log in op Mijn Yielder om uw IT-omgeving te beheren.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
