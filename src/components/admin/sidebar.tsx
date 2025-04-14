"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Server, Users } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Servidores",
    href: "/admin/servers",
    icon: Server,
  },
  {
    title: "Jogadores",
    href: "/admin/players",
    icon: Users,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Administração
          </h2>
          <div className="space-y-1">
            <nav className="grid gap-1">
              {sidebarNavItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={index}
                    asChild
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const { isMobileMenuOpen, closeMobileMenu } = useAdmin();

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-background">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={closeMobileMenu}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Menu de navegação do painel administrativo com acesso a Dashboard,
            Servidores, Competições e Configurações
          </SheetDescription>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </>
  );
}
