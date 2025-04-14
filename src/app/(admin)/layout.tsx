"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SupabaseSession } from "@/lib/supabase/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  LayoutDashboard,
  Server,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<SupabaseSession>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Verificar se o usuário é administrador
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        // Aqui você pode adicionar sua lógica para verificar se é admin
        setIsAdmin(userData?.role === "admin");
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    router.push("/admin/login");
  };

  // Se estiver carregando, mostra um spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Se não estiver logado ou não for admin, redireciona para a página de login
  if (!session || !isAdmin) {
    if (pathname !== "/admin/login") {
      router.push("/admin/login");
    }
    return <>{children}</>;
  }

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Servidores",
      href: "/admin/servers",
      icon: Server,
    },
    {
      name: "Usuários",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Logs",
      href: "/admin/logs",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold">Footix Admin</h1>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center p-2 rounded transition-colors",
                    pathname === item.href
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 mt-auto border-t border-gray-700">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow">
          <div className="px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-800">
                {menuItems.find((item) => item.href === pathname)?.name ||
                  "Admin"}
              </h2>
            </div>
            <div className="flex items-center">
              {session?.user && (
                <UserAvatar
                  user={{
                    email: session.user.email || "",
                    user_metadata: session.user.user_metadata || {},
                  }}
                />
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
