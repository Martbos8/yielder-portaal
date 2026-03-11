"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

interface UserContext {
  fullName: string;
  initials: string;
  companyName: string;
}

interface PortalShellProps {
  user: UserContext;
  openTicketCount: number;
  children: React.ReactNode;
}

export function PortalShell({ user, openTicketCount, children }: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
