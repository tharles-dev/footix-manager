"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { settings, loading, error } = useSettings();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">
              Erro ao carregar configurações: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Servidor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Nome do Servidor</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.server_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Região</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.region}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.notifications?.email ? "Ativado" : "Desativado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Push</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.notifications?.push ? "Ativado" : "Desativado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">
                  Autenticação em Duas Etapas
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings?.security?.two_factor ? "Ativado" : "Desativado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Sessões Ativas</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.security?.active_sessions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banco de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Backup Automático</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.database?.auto_backup ? "Ativado" : "Desativado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Último Backup</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.database?.last_backup || "Nunca"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Nível de Acesso</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.permissions?.access_level}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Funções</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.permissions?.roles?.join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
