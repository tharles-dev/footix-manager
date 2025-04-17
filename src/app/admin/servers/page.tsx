"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServers } from "@/hooks/useApi";
import { Server } from "@/lib/api/services";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  Settings,
  LayoutDashboard,
  Users,
  Trophy,
  Building,
  Trash2,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { deleteServer } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ServersPage() {
  const { servers, loading, error } = useServers();
  const [localServers, setLocalServers] = useState<Server[]>([]);

  // Sincroniza o estado local com os servidores carregados
  useEffect(() => {
    if (servers) {
      setLocalServers(servers);
    }
  }, [servers]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Servidores</h1>
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          Erro ao carregar servidores: {error.message}
        </div>
      </div>
    );
  }

  const handleServerDelete = (deletedServerId: string) => {
    setLocalServers((current) =>
      current.filter((server) => server.id !== deletedServerId)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Servidores</h1>
        <Button asChild>
          <Link href="/admin/servers/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Criar Servidor
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : localServers.length === 0 ? (
          <div className="col-span-full rounded-md border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Nenhum servidor encontrado.</p>
          </div>
        ) : (
          localServers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onDelete={() => handleServerDelete(server.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ServerCard({
  server,
  onDelete,
}: {
  server: Server;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmServerName, setConfirmServerName] = useState("");
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmServerName !== server.name) {
      toast({
        title: "Erro",
        description:
          "O nome do servidor não corresponde. Por favor, verifique e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);
      await deleteServer(server.id);
      toast({
        title: "Sucesso",
        description: "Servidor excluído com sucesso",
        variant: "default",
      });
      onDelete(); // Chama a função para atualizar a lista
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao excluir servidor",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmServerName("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{server.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Ativo
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Usuários</span>
          <span className="text-sm text-muted-foreground">
            {server.current_members} / {server.max_members}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Orçamento Inicial</span>
          <span className="text-sm text-muted-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(server.initial_budget)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/admin/servers/${server.id}/edit`}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="w-full">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Painel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/servers/${server.id}/competitions`}
                  className="flex items-center"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Gerenciar Competições</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/servers/${server.id}/players`}
                  className="flex items-center"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Gerenciar Jogadores</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/servers/${server.id}/clubs`}
                  className="flex items-center"
                >
                  <Building className="mr-2 h-4 w-4" />
                  <span>Gerenciar Clubes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/servers/${server.id}/auctions`}
                  className="flex items-center"
                >
                  <Gavel className="mr-2 h-4 w-4" />
                  <span>Gerenciar Leilões</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="flex w-full items-center text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Excluir Servidor</span>
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-4">
                          <div>
                            Esta é uma ação destrutiva que não pode ser
                            desfeita. Todos os dados associados a este servidor
                            serão permanentemente excluídos.
                          </div>
                          <div>
                            Para confirmar, digite o nome do servidor:{" "}
                            <strong>{server.name}</strong>
                          </div>
                          <div className="space-y-2 pt-2">
                            <Label htmlFor="confirmServerName">
                              Nome do servidor
                            </Label>
                            <Input
                              id="confirmServerName"
                              value={confirmServerName}
                              onChange={(e) =>
                                setConfirmServerName(e.target.value)
                              }
                              placeholder="Digite o nome do servidor para confirmar"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setConfirmServerName("")}
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={
                          isDeleting || confirmServerName !== server.name
                        }
                        className={cn(
                          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                          confirmServerName !== server.name &&
                            "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isDeleting ? "Excluindo..." : "Excluir Servidor"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
