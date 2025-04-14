"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Trophy,
  BadgeDollarSign,
  Gavel,
  Menu,
} from "lucide-react";

const routes = [
  {
    href: "/web/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/web/competitions",
    label: "Campeonatos",
    icon: Trophy,
  },
  {
    href: "/web/transfers",
    label: "Negociações",
    icon: BadgeDollarSign,
  },
  {
    href: "/web/auctions",
    label: "Leilões",
    icon: Gavel,
  },
  {
    href: "/web/menu",
    label: "Menu",
    icon: Menu,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t">
      <div className="grid h-full grid-cols-5 mx-auto">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-accent group",
              pathname === route.href && "text-primary"
            )}
          >
            <route.icon className="w-5 h-5" />
            <span className="text-xs">{route.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
