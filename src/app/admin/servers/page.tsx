"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServers } from "@/hooks/useApi";
import { Server } from "@/lib/api/services";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServersPage() {
  const { servers, loading, error } = useServers();

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Servidores</h1>

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
        ) : servers.length === 0 ? (
          <div className="col-span-full rounded-md border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Nenhum servidor encontrado.</p>
          </div>
        ) : (
          servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))
        )}
      </div>
    </div>
  );
}

function ServerCard({ server }: { server: Server }) {
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
            {server.max_members} / {server.max_members}
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
      </CardContent>
    </Card>
  );
}
