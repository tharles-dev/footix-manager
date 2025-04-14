import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Settings, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Servidores Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +2 desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competições</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +4 desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">
              +12 desde o último mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              +1 desde o último mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Novo servidor criado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Servidor &quot;Brasileirão 2024&quot; foi criado
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  2h atrás
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Competição finalizada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    &quot;Copa do Brasil 2024&quot; foi finalizada
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  5h atrás
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Novo usuário registrado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    João Silva se registrou
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  1d atrás
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Finalizar temporada
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Servidor &quot;Brasileirão 2024&quot;
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">2d</div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Criar nova competição
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Copa Libertadores 2024
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">3d</div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Atualizar configurações
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ajustes de simulação
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">5d</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
