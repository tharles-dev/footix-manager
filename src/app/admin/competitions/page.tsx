"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompetitions } from "@/hooks/useApi";
import { Competition } from "@/lib/api/services";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

export default function CompetitionsPage() {
  // Usando um ID de servidor fixo para exemplo
  // Em um cenário real, isso viria de um contexto ou parâmetro de rota
  const serverId = "default-server-id";
  const { competitions, loading, error } = useCompetitions(serverId);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Competições</h1>
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          Erro ao carregar competições: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Competições</h1>

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
        ) : competitions.length === 0 ? (
          <div className="col-span-full rounded-md border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma competição encontrada.
            </p>
          </div>
        ) : (
          competitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))
        )}
      </div>
    </div>
  );
}

function CompetitionCard({ competition }: { competition: Competition }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{competition.name}</CardTitle>
        <Trophy className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Temporada</span>
          <span className="text-sm text-muted-foreground">
            {competition.season}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Clubes</span>
          <span className="text-sm text-muted-foreground">
            {competition.club_ids.length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            Em andamento
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
