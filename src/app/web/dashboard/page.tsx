"use client";

import { useEffect, useState } from "react";
import { ClubCard } from "@/components/dashboard/club-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useApp } from "@/contexts/AppContext";

// Tipo para os dados do jogador
interface PlayerData {
  id: string;
  name: string;
  position: string;
  overall: number;
  age: number;
  nationality: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  avatar: string;
}

export default function DashboardPage() {
  const { club, loading: contextLoading } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [squadPlayers, setSquadPlayers] = useState<PlayerData[]>([]);

  // Dados mockados para exemplo (até carregar os dados reais)
  const recentMatch = {
    competition: "COPA LEONAR",
    homeTeam: {
      name: "PSG",
      logo: "/images/psg.png",
      score: 1,
    },
    awayTeam: {
      name: "MAN",
      logo: "/images/man.png",
      score: 1,
    },
  };

  useEffect(() => {
    async function fetchSquadPlayers() {
      if (!club) {
        return;
      }

      try {
        setLoading(true);

        // Usar o endpoint para buscar os jogadores
        const response = await fetch(`/api/club/${club.id}/players`);

        if (!response.ok) {
          throw new Error("Erro ao buscar jogadores");
        }

        const players = await response.json();

        console.log("Jogadores carregados:", players);
        setSquadPlayers(players);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    if (club) {
      fetchSquadPlayers();
    }
  }, [club]);

  // Aguardar o contexto carregar
  if (contextLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        Carregando dados do contexto...
      </div>
    );
  }

  // Aguardar os dados do clube
  if (!club) {
    return (
      <div className="flex justify-center items-center h-64">
        Carregando dados do clube...
      </div>
    );
  }

  // Aguardar os dados dos jogadores
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Carregando jogadores...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Erro: {error}</div>;
  }

  // Calcular o saldo disponível (saldo atual - despesas da temporada)
  const availableBalance = club.balance - club.season_expenses;

  return (
    <div className="space-y-4">
      <ClubCard
        name={club.name}
        logo={club.logo_url || "/images/default-club.png"}
        division={club.division || "SEM DIVISÃO"}
        ranking={0} // Será implementado posteriormente
        balance={club.balance} // Orçamento total
        sponsorship={club.season_budget_base} // Orçamento base da temporada
        bids={availableBalance} // Saldo disponível após despesas
      />

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matches">Jogos</TabsTrigger>
          <TabsTrigger value="squad">Elenco</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-2">
              {recentMatch.competition}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <Image
                    src={recentMatch.homeTeam.logo}
                    alt={recentMatch.homeTeam.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-medium">{recentMatch.homeTeam.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold">
                  {recentMatch.homeTeam.score}
                </span>
                <span className="text-muted-foreground">x</span>
                <span className="text-xl font-bold">
                  {recentMatch.awayTeam.score}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{recentMatch.awayTeam.name}</span>
                <div className="relative w-8 h-8">
                  <Image
                    src={recentMatch.awayTeam.logo}
                    alt={recentMatch.awayTeam.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <button className="w-full mt-4 text-sm text-primary hover:underline">
              Mostrar Detalhes
            </button>
          </Card>
        </TabsContent>

        <TabsContent value="squad" className="mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Elenco Completo</h3>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {squadPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>
                        {player.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{player.name}</h4>
                        <Badge variant="outline">{player.position}</Badge>
                        <Badge variant="secondary">{player.overall}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {player.age} anos • {player.nationality}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Vel:</span>{" "}
                        {player.pace}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Chu:</span>{" "}
                        {player.shooting}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Pas:</span>{" "}
                        {player.passing}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Dri:</span>{" "}
                        {player.dribbling}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Def:</span>{" "}
                        {player.defending}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Fis:</span>{" "}
                        {player.physical}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
