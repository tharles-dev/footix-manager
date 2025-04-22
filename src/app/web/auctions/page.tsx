"use client";

import { useState } from "react";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useAuctionSubscription } from "@/hooks/useAuctionSubscription";

export default function AuctionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Usar o hook de subscription para leilões em tempo real
  const { auctions, loading, error } = useAuctionSubscription();

  // Filtrar leilões com base no termo de busca
  const filteredAuctions = auctions.filter((auction) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      auction.player.name.toLowerCase().includes(searchLower) ||
      auction.seller_club.name.toLowerCase().includes(searchLower)
    );
  });

  // Separar leilões por status
  const activeAuctions = filteredAuctions.filter((a) => a.status === "active");
  const scheduledAuctions = filteredAuctions.filter(
    (a) => a.status === "scheduled"
  );
  const completedAuctions = filteredAuctions.filter(
    (a) => a.status === "completed"
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por jogador ou clube..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="completed">Finalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeAuctions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum leilão ativo no momento
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledAuctions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum leilão agendado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedAuctions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum leilão finalizado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
