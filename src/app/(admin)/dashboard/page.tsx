"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  totalServers: number;
  totalClubs: number;
  activeServers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalServers: 0,
    totalClubs: 0,
    activeServers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      // Buscar estatísticas básicas
      const [
        { count: totalUsers },
        { count: totalServers },
        { count: totalClubs },
        { count: activeServers },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("servers").select("*", { count: "exact", head: true }),
        supabase.from("clubs").select("*", { count: "exact", head: true }),
        supabase
          .from("servers")
          .select("*", { count: "exact", head: true })
          .eq("status", "andamento"),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        totalServers: totalServers || 0,
        totalClubs: totalClubs || 0,
        activeServers: activeServers || 0,
      });

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">
            Total de Usuários
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalUsers}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">
            Total de Servidores
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalServers}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">
            Servidores Ativos
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.activeServers}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total de Clubes</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalClubs}
          </p>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Criar Novo Servidor
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              Gerenciar Temporadas
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700">
              Ver Logs do Sistema
            </button>
          </div>
        </div>
      </div>

      {/* Área de notificações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Notificações do Sistema
          </h2>
          <div className="mt-4">
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Sistema em fase de desenvolvimento. Algumas funcionalidades
                    podem estar indisponíveis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
