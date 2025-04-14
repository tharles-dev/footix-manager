"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SupabaseSession } from "@/lib/supabase/types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<SupabaseSession>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Footix Admin</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/dashboard"
                className={`block p-2 rounded ${
                  pathname === "/admin/dashboard"
                    ? "bg-gray-700"
                    : "hover:bg-gray-700"
                }`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/servers"
                className={`block p-2 rounded ${
                  pathname === "/admin/servers"
                    ? "bg-gray-700"
                    : "hover:bg-gray-700"
                }`}
              >
                Servidores
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className={`block p-2 rounded ${
                  pathname === "/admin/users"
                    ? "bg-gray-700"
                    : "hover:bg-gray-700"
                }`}
              >
                Usuários
              </Link>
            </li>
            <li>
              <Link
                href="/admin/logs"
                className={`block p-2 rounded ${
                  pathname === "/admin/logs"
                    ? "bg-gray-700"
                    : "hover:bg-gray-700"
                }`}
              >
                Logs
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 mt-auto border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 bg-gray-100">
        <header className="bg-white shadow">
          <div className="px-4 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {pathname === "/admin/dashboard" && "Dashboard"}
              {pathname === "/admin/servers" && "Servidores"}
              {pathname === "/admin/users" && "Usuários"}
              {pathname === "/admin/logs" && "Logs"}
            </h2>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
