"use client";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdmin } from "@/contexts/admin-context";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AdminHeader() {
  const { toggleMobileMenu, isMobileMenuOpen } = useAdmin();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleMobileMenuToggle = () => {
    console.log("Menu mobile antes:", isMobileMenuOpen);
    toggleMobileMenu();
    console.log("Menu mobile depois:", !isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Fazer logout no Supabase
      const supabase = createClient();
      await supabase.auth.signOut();

      // Chamar o endpoint de logout para limpar cookies
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Redirecionar para a página de login
      router.push("/auth/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      {/* Menu mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={handleMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Título da página */}
      <div className="ml-4 flex-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>

      {/* Ações do usuário */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/01.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Saindo..." : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
