"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui/use-toast";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Gavel, Calendar } from "lucide-react";
import { useAuctionSubscription } from "@/hooks/useAuctionSubscription";
import { useCountdown } from "@/hooks/useCountdown";

export default function AuctionDetailsPage({
  params,
}: {
  params: { auction_id: string };
}) {
  const router = useRouter();
  const { club } = useApp();
  const [bidAmount, setBidAmount] = useState<number>(0);
  const { toast } = useToast();

  // Usar o hook de subscription para leilões em tempo real
  const { auctions, loading, error, refetch } = useAuctionSubscription(
    params.auction_id
  );

  // O primeiro item do array é o leilão atual
  const auction = auctions[0];

  // Usar o hook de countdown para controlar o tempo do leilão
  const { isStarted, isFinished, endTime } = useCountdown(
    auction?.scheduled_start_time || "",
    auction?.countdown_minutes || 0
  );

  // Atualizar o valor do próximo lance quando o leilão mudar
  useEffect(() => {
    if (auction) {
      const nextBidAmount = Math.ceil(auction.current_bid * 1.1);
      setBidAmount(nextBidAmount + 1);
    }
  }, [auction]);

  // Função para formatar a data e hora do leilão agendado
  const formatScheduledDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month} às ${hours}:${minutes}`;
  };

  // Função para dar lance
  const handleBid = async () => {
    if (!auction || !club?.server_id) return;

    // Verifica se o leilão está ativo
    if (auction.status !== "active") {
      toast({
        title: "Erro",
        description: "Este leilão não está ativo",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o leilão já começou
    if (!isStarted) {
      toast({
        title: "Erro",
        description: "O leilão ainda não começou",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o leilão já terminou
    if (isFinished) {
      toast({
        title: "Erro",
        description: "Este leilão já foi finalizado",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o tempo atual é menor que o tempo de término
    const now = new Date();
    if (now >= endTime) {
      toast({
        title: "Erro",
        description: "O tempo para dar lance expirou",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/server/${club.server_id}/auctions/${auction.id}/bid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: bidAmount }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao dar lance");
      }

      const data = await response.json();

      // Atualizar o valor do próximo lance
      const nextBidAmount = Math.ceil(data.data.current_bid * 1.1);
      setBidAmount(nextBidAmount + 1);

      // Atualizar os detalhes do leilão
      refetch();

      toast({
        title: "Sucesso",
        description: "Lance realizado com sucesso",
      });
    } catch (err) {
      console.error("Erro ao dar lance:", err);
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao dar lance",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="text-center py-8 text-destructive">
        {error || "Leilão não encontrado"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes do Leilão</h1>
        <Button variant="outline" onClick={() => router.push("/web/auctions")}>
          Voltar
        </Button>
      </div>

      <AuctionCard
        auction={auction}
        hideViewDetails={true}
        hideBidButton={true}
      />

      {auction.status === "scheduled" && (
        <div className="bg-card rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            Informações do Leilão Agendado
          </h2>
          <div className="flex items-center text-sm text-blue-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">
              Início: {formatScheduledDateTime(auction.scheduled_start_time)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            O leilão começará automaticamente no horário agendado. Você poderá
            dar lances assim que o leilão estiver ativo.
          </p>
        </div>
      )}

      {auction.status === "active" && (
        <div className="bg-card rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Dar Lance</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={Math.ceil(auction.current_bid * 1.1)}
              step={Math.ceil(auction.current_bid * 0.1)}
              className="w-full sm:w-48"
            />
            <Button
              onClick={handleBid}
              className="w-full sm:w-auto gap-2"
              disabled={!isStarted || isFinished || auction.status !== "active"}
            >
              <Gavel className="h-4 w-4" />
              Dar Lance
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Lance mínimo:{" "}
            {formatCurrency(Math.ceil(auction.current_bid * 1.1) + 1)}
          </p>
        </div>
      )}

      <div className="bg-card rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Histórico de Lances</h2>
        {auction.bid_history && auction.bid_history.length > 0 ? (
          <div className="space-y-4">
            {auction.bid_history.map(
              (bid: {
                id: string;
                bid_amount: number;
                created_at: string;
                club: {
                  id: string;
                  name: string;
                  logo_url: string | null;
                };
              }) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {bid.club.logo_url ? (
                        <Image
                          src={bid.club.logo_url}
                          alt={bid.club.name}
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                      ) : (
                        <span className="text-xs font-medium">
                          {bid.club.name.substring(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{bid.club.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(bid.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(bid.bid_amount)}</p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum lance realizado ainda.</p>
        )}
      </div>
    </div>
  );
}
