"use client";

import { ClubCard } from "@/components/dashboard/club-card";
import { SquadFormation } from "@/components/dashboard/squad-formation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import Image from "next/image";

// Dados mockados para exemplo
const clubData = {
  name: "Paris Saint-Germain",
  logo: "/images/psg.png",
  division: "PRIMEIRA DIVISÃO",
  ranking: 3,
  balance: 99714299.5,
  sponsorship: 76944.8,
  bids: 4450.0,
};

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

const squadPlayers = [
  {
    id: "1",
    name: "Alisson",
    position: "GOL",
    avatar: "/images/players/alisson.png",
    overall: 89,
  },
  // Adicione mais jogadores conforme necessário
];

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <ClubCard {...clubData} />

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
          <SquadFormation formation="4-3-3" players={squadPlayers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
