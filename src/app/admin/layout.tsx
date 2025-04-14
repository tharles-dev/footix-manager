import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AdminProvider } from "@/contexts/admin-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Sidebar - oculta em mobile */}
          <div className="hidden md:flex">
            <AdminSidebar />
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}
