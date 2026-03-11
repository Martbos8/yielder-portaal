"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { MaterialIcon } from "./icon";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: "space_dashboard", label: "Dashboard" },
  { href: "/hardware", icon: "laptop_mac", label: "Hardware" },
  { href: "/tickets", icon: "confirmation_number", label: "Tickets" },
  { href: "/contracten", icon: "verified_user", label: "Contracten" },
  { href: "/facturen", icon: "receipt_long", label: "Facturen" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  companyName: string;
  initials: string;
}

export function Sidebar({ isOpen, onClose, fullName, companyName, initials }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:relative z-40 w-64 h-full flex-shrink-0
          bg-sidebar/75 backdrop-blur-xl
          border-r border-sidebar-border
          flex flex-col justify-between overflow-y-auto
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-8 rounded-xl bg-yielder-navy/[0.06] flex items-center justify-center">
              <Image
                src="/yielder-monogram.png"
                alt="Yielder"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <h2 className="text-[15px] font-bold leading-tight tracking-tight text-foreground">
              Mijn <span className="text-yielder-navy">Yielder</span>
            </h2>
          </div>

          {/* Navigatie */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    relative flex items-center gap-3 px-3 py-2 rounded-lg
                    font-medium transition-colors cursor-pointer
                    border-l-2
                    ${
                      isActive
                        ? "bg-sidebar-accent text-yielder-navy border-l-yielder-navy"
                        : "text-slate-600 border-l-transparent hover:bg-yielder-navy/[0.04]"
                    }
                  `}
                >
                  <MaterialIcon
                    name={item.icon}
                    className={
                      isActive
                        ? "text-yielder-navy opacity-100"
                        : "text-yielder-navy/70"
                    }
                  />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-yielder-navy flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {fullName}
              </p>
              {companyName && (
                <p className="text-xs text-muted-foreground truncate">
                  {companyName}
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
              title="Uitloggen"
            >
              <MaterialIcon name="logout" size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
