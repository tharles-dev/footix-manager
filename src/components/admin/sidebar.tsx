"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";
import { Button } from "@/components/ui/button";

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

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileMenuOpen, closeMobileMenu } = useAdmin();

  const handleLogout = () => {
    // TODO: Implementar logout com Supabase
    router.push("/login");
  };

  return (
    <>
      {/* Sidebar para desktop */}
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-background">
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

        {/* Footer */}
        <div className="border-t p-4">
          <button
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeMobileMenu}
          ></div>

          {/* Menu */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Link href="/admin" className="flex items-center space-x-2">
                <span className="text-xl font-bold">Footix Admin</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={closeMobileMenu}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={closeMobileMenu}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t p-4">
              <button
                className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
