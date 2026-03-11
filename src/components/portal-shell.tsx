"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useRealtime } from "@/hooks/use-realtime";

interface UserContext {
  fullName: string;
  initials: string;
  companyName: string;
}

interface PortalShellProps {
  user: UserContext;
  openTicketCount: number;
  criticalUpgradeCount?: number;
  children: React.ReactNode;
}

export function PortalShell({ user, openTicketCount, criticalUpgradeCount = 0, children }: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Subscribe to realtime changes — refresh server data when changes occur
  useRealtime([
    {
      table: "tickets",
      events: ["INSERT", "UPDATE", "DELETE"],
      onEvent: () => router.refresh(),
    },
    {
      table: "agreements",
      events: ["INSERT", "UPDATE", "DELETE"],
      onEvent: () => router.refresh(),
    },
    {
      table: "hardware_assets",
      events: ["INSERT", "UPDATE", "DELETE"],
      onEvent: () => router.refresh(),
    },
  ]);

  return (
    <div className="relative h-screen w-full flex flex-col overflow-hidden">
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        companyName={user.companyName}
        initials={user.initials}
        openTicketCount={openTicketCount}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          fullName={user.fullName}
          companyName={user.companyName}
          initials={user.initials}
          criticalUpgradeCount={criticalUpgradeCount}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
