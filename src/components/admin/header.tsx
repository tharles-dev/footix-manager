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

export function AdminHeader() {
  const { toggleMobileMenu } = useAdmin();
  const router = useRouter();

  const handleLogout = () => {
    // TODO: Implementar logout com Supabase
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      {/* Menu mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMobileMenu}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Título da página */}
      <div className="ml-4 flex-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>

      {/* Ações do usuário */}
      <div className="flex items-center space-x-4">
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
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
