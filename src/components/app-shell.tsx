import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BedDouble,
  Compass,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessagesSquare,
  Route as RouteIcon,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/assistant", label: "Assistant", icon: MessagesSquare },
  { to: "/plan", label: "Journeys", icon: RouteIcon },
  { to: "/stays", label: "Stays", icon: BedDouble },
  { to: "/guide", label: "Guide me", icon: Compass },
  { to: "/file-complaint", label: "Complaints", icon: LifeBuoy },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { displayName, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <div className="voyage min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-2">
          <BrandLogo />
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="surface-panel mt-4 p-3">
          <p className="truncate text-sm font-medium">{displayName ?? "Traveller"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="soft" size="sm" className="mt-3 w-full" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <header className="glass sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo />
        </Link>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>

      <nav className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t px-1 py-2 lg:hidden">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium transition",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
