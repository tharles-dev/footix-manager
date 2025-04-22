import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/";
import { useApp } from "@/contexts/AppContext";

// Definindo a interface para o leilão
interface Auction {
  id: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  starting_bid: number;
  current_bid: number;
  scheduled_start_time: string;
  countdown_minutes: number;
  player: {
    id: string;
    name: string;
    position: string;
    overall: number;
    potential: number;
    age: number;
    nationality: string;
  };
  seller_club: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  current_bidder: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  bid_history: {
    id: string;
    bid_amount: number;
    created_at: string;
    club: {
      id: string;
      name: string;
      logo_url: string | null;
    };
  }[];
}

// Definindo a interface para o payload de mudanças
interface RealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Auction;
  old: Auction;
}

export function useAuctionSubscription(auctionId?: string) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { club } = useApp();
  const supabase = createBrowserClient();

  // Função para buscar leilões
  const fetchAuctions = useCallback(async () => {
    if (!club?.server_id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/server/${club.server_id}/auctions`);

      if (!response.ok) {
        throw new Error("Erro ao carregar leilões");
      }

      const data = await response.json();
      setAuctions(data.data || []);
    } catch (err) {
      console.error("Erro ao buscar leilões:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar leilões");
    } finally {
      setLoading(false);
    }
  }, [club?.server_id]);

  // Função para buscar detalhes de um leilão específico
  const fetchAuctionDetails = useCallback(async () => {
    if (!club?.server_id || !auctionId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/server/${club.server_id}/auctions/${auctionId}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar detalhes do leilão");
      }

      const data = await response.json();
      setAuctions([data.data]);
    } catch (err) {
      console.error("Erro ao buscar detalhes do leilão:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar detalhes do leilão"
      );
    } finally {
      setLoading(false);
    }
  }, [club?.server_id, auctionId]);

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    if (!club?.server_id) return;

    // Buscar dados iniciais
    if (auctionId) {
      fetchAuctionDetails();
    } else {
      fetchAuctions();
    }

    console.log("Configurando subscription para leilões", {
      auctionId,
      serverId: club.server_id,
    });

    // Configurar subscription
    const channel = supabase
      .channel("auctions_changes")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*", // Escutar todos os eventos (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "auctions",
          // Removendo o filtro de server_id que pode estar causando problemas
          // e usando apenas o filtro de ID quando estamos em uma página de detalhes
          filter: auctionId ? `id=eq.${auctionId}` : undefined,
        },
        (payload: RealtimePayload) => {
          console.log("Mudança detectada na tabela auctions:", payload);

          // Quando houver mudança, buscar dados atualizados
          if (auctionId) {
            console.log("Atualizando detalhes do leilão após mudança");
            fetchAuctionDetails();
          } else {
            console.log("Atualizando lista de leilões após mudança");
            fetchAuctions();
          }
        }
      )
      .subscribe((status) => {
        console.log("Status da subscription:", status);
      });

    // Limpar subscription quando o componente for desmontado
    return () => {
      console.log("Removendo canal de subscription");
      supabase.removeChannel(channel);
    };
  }, [
    club?.server_id,
    auctionId,
    fetchAuctionDetails,
    fetchAuctions,
    supabase,
  ]);

  return {
    auctions,
    loading,
    error,
    refetch: auctionId ? fetchAuctionDetails : fetchAuctions,
  };
}
