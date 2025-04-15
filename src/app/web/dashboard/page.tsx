"use client";

import { useState, useEffect } from "react";
import { ClubCard } from "@/components/dashboard/club-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useApp } from "@/contexts/AppContext";
import { PackOpening } from "@/components/pack/PackOpening";
import { SquadListWrapper } from "@/components/squad/SquadList";

export default function DashboardPage() {
  const { club, loading: contextLoading, user } = useApp();
  const [showPack, setShowPack] = useState(false);
  const [packPlayers, setPackPlayers] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPlayers, setHasPlayers] = useState(false);

  // Verificar se o clube tem jogadores
  useEffect(() => {
    if (club?.id) {
      const checkPlayers = async () => {
        try {
          const response = await fetch(`/api/club/${club.id}/players`, {
            cache: "no-store",
          });

          if (response.ok) {
            const players = await response.json();
            setHasPlayers(players && players.length > 0);

            // Se não tiver jogadores, mostrar a opção de abrir o pack
            if (!players || players.length === 0) {
              setShowPack(true);
            }
          }
        } catch (err) {
          console.error("Erro ao verificar jogadores:", err);
        }
      };

      checkPlayers();
    }
  }, [club?.id]);

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

  const handleOpenPack = async () => {
    try {
      // Desabilitar o botão e mostrar estado de carregamento
      setLoading(true);

      const response = await fetch(
        `/api/club/${club?.id}/players/initial-pack`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": user?.id || "",
            "server-id": club?.server_id || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao abrir pack");
      }

      const data = await response.json();

      // Adicionar um pequeno delay para melhorar a experiência
      setTimeout(() => {
        setPackPlayers(data.data.players);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error("Erro ao abrir pack:", err);
      setError(err instanceof Error ? err.message : "Erro ao abrir pack");
      setLoading(false);
    }
  };

  const handlePackComplete = () => {
    setShowPack(false);
    // Atualizar o estado de hasPlayers para true
    setHasPlayers(true);
  };

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

  if (error) {
    return <div className="text-red-500 p-4">Erro: {error}</div>;
  }

  // Calcular o saldo disponível
  const availableBalance = club.balance - club.season_expenses;

  return (
    <div className="space-y-4">
      {showPack && packPlayers.length === 0 && (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Bem-vindo ao seu novo clube!
          </h2>
          <p className="mb-6">
            Você receberá um pack com 18 jogadores para começar sua jornada.
          </p>
          <button
            onClick={handleOpenPack}
            disabled={loading}
            className={`bg-primary text-primary-foreground px-6 py-3 rounded-lg transition-all duration-300 ${
              loading
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-primary/90 hover:scale-105"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sorteando...
              </span>
            ) : (
              "Abrir Pack Inicial"
            )}
          </button>
        </Card>
      )}

      {showPack && packPlayers.length > 0 && (
        <PackOpening players={packPlayers} onComplete={handlePackComplete} />
      )}

      {!showPack && (
        <>
          <ClubCard
            name={club.name}
            logo={club.logo_url || "/images/default-club.png"}
            division={club.division || "SEM DIVISÃO"}
            ranking={0}
            balance={club.balance}
            sponsorship={club.season_budget_base}
            bids={availableBalance}
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
                    <span className="font-medium">
                      {recentMatch.homeTeam.name}
                    </span>
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
                    <span className="font-medium">
                      {recentMatch.awayTeam.name}
                    </span>
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
              {hasPlayers ? (
                <SquadListWrapper clubId={club.id} serverId={club.server_id} />
              ) : (
                <Card className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-4">
                    Elenco Completo
                  </h3>
                  <p className="mb-6">
                    Seu clube ainda não possui jogadores. Abra o pack inicial
                    para começar!
                  </p>
                  <button
                    onClick={() => setShowPack(true)}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg transition-all duration-300 hover:bg-primary/90 hover:scale-105"
                  >
                    Abrir Pack Inicial
                  </button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
