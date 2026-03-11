"use client";

import { useRouter } from "next/navigation";
import { MaterialIcon } from "./icon";
import { NotificationPanel } from "./notification-panel";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/types/database";

interface HeaderProps {
  onMenuToggle: () => void;
  companyName: string;
  initials: string;
  openTicketCount: number;
  notifications?: Notification[];
}

export function Header({ onMenuToggle, companyName, initials, openTicketCount, notifications = [] }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }
  return (
    <header
      className="flex items-center justify-between whitespace-nowrap
        bg-surface-warm/85 backdrop-blur-xl px-5 md:px-10 py-4
        shrink-0 z-30 relative border-b border-yielder-navy/[0.06]"
    >
      {/* Links: hamburger + logo (mobile) */}
      <div className="flex items-center gap-4 text-yielder-navy">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-slate-500 hover:text-slate-700
            transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-50"
        >
          <MaterialIcon name="menu" />
        </button>
      </div>

      {/* Midden: bedrijfsnaam */}
      {companyName && (
        <div className="hidden md:flex flex-1 justify-center">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 bg-warm-100 px-4 py-1.5 rounded-full">
            <span className="size-1.5 rounded-full bg-yielder-navy" />
            {companyName}
          </span>
        </div>
      )}

      {/* Rechts: notificaties + avatar */}
      <div className="flex items-center justify-end gap-4">
        <NotificationPanel
          notifications={notifications}
          openTicketCount={openTicketCount}
        />
        <DropdownMenu>
          <DropdownMenuTrigger className="size-10 rounded-xl bg-yielder-navy flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:bg-yielder-navy-dark transition-colors shadow-[0_2px_8px_rgba(31,59,97,0.2)]">
            {initials}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={handleSignOut}
              variant="destructive"
            >
              <MaterialIcon name="logout" size={18} />
              <span>Uitloggen</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
