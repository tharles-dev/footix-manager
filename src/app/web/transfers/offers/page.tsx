"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useSearchParams, useRouter } from "next/navigation";
import { TransferOfferCard } from "@/components/transfers/TransferOfferCard";
import { TransferOffer, TransferOfferResponse } from "@/types/transfer";
import { ArrowLeft } from "lucide-react";

export default function TransferOffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<TransferOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("pending");
  const [offerType, setOfferType] = useState<"sent" | "received">("received");
  const { toast } = useToast();

  // Inicializa o estado com os parâmetros da URL
  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    const status = searchParams.get("status") || "pending";
    const type =
      (searchParams.get("type") as "sent" | "received") || "received";

    setCurrentPage(page);
    setActiveTab(status);
    setOfferType(type);
  }, [searchParams]);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/transfer/offers?page=${currentPage}&status=${activeTab}&type=${offerType}`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar ofertas");
      }

      const data: TransferOfferResponse = await response.json();
      console.log("Ofertas carregadas:", data.offers);

      // Verificar se há ofertas com dados incompletos
      const validOffers = data.offers.filter(
        (offer) => offer.player && offer.from_club && offer.to_club
      );

      console.log("Ofertas válidas:", validOffers);
      setOffers(validOffers);
      setTotalPages(data.pagination.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar ofertas");
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ofertas de transferência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, offerType, toast]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    updateUrl({ status: value });
  };

  const handleTypeChange = (value: string) => {
    setOfferType(value as "sent" | "received");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page: page.toString() });
  };

  const updateUrl = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    router.push(`?${newParams.toString()}`);
  };

  const handleAccept = async (offerId: string) => {
    try {
      const response = await fetch("/api/transfer/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transferRequestId: offerId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao aceitar oferta");
      }

      toast({
        title: "Sucesso",
        description: "Oferta aceita com sucesso",
      });

      fetchOffers();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível aceitar a oferta",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (offerId: string) => {
    try {
      const response = await fetch("/api/transfer/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transferRequestId: offerId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao rejeitar oferta");
      }

      toast({
        title: "Sucesso",
        description: "Oferta rejeitada com sucesso",
      });

      fetchOffers();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível rejeitar a oferta",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (offerId: string) => {
    try {
      const response = await fetch("/api/transfer/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transferRequestId: offerId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao cancelar oferta");
      }

      toast({
        title: "Sucesso",
        description: "Oferta cancelada com sucesso",
      });

      fetchOffers();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível cancelar a oferta",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => fetchOffers()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/web/transfers")}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Ofertas de Transferência</h1>
        </div>
        <Tabs value={offerType} onValueChange={handleTypeChange}>
          <TabsList>
            <TabsTrigger value="received">Recebidas</TabsTrigger>
            <TabsTrigger value="sent">Enviadas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="accepted">Aceitas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma oferta encontrada
            </div>
          ) : (
            <div className="grid gap-4">
              {offers.map((offer) => (
                <TransferOfferCard
                  key={offer.id}
                  offer={offer}
                  onAccept={() => handleAccept(offer.id)}
                  onReject={() => handleReject(offer.id)}
                  onCancel={() => handleCancel(offer.id)}
                  isSentByUser={offerType === "sent"}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
