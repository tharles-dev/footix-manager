"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Trophy, Settings } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Servidores",
    href: "/admin/servers",
    icon: Users,
  },
  {
    name: "Competições",
    href: "/admin/competitions",
    icon: Trophy,
  },
  {
    name: "Configurações",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface SidebarContentProps {
  onClose?: () => void;
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <span className="text-xl font-bold">Footix Admin</span>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AdminSidebar() {
  const { isMobileMenuOpen, closeMobileMenu } = useAdmin();

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-background">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={closeMobileMenu}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Menu de navegação do painel administrativo com acesso a Dashboard,
            Servidores, Competições e Configurações
          </SheetDescription>
          <SidebarContent onClose={closeMobileMenu} />
        </SheetContent>
      </Sheet>
    </>
  );
}
