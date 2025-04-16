"use client";
import { useState, useEffect, useCallback } from "react";
import { PlayerCard } from "@/components/transfers/PlayerCard";
import { TransferFilters } from "@/components/transfers/TransferFilters";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useSearchParams, useRouter } from "next/navigation";

interface Player {
  id: string;
  name: string;
  overall: number;
  position: string;
  nationality: string;
  club?: {
    name: string;
    user?: {
      name: string;
    };
  };
  salario_atual: number;
  valor_mercado: number;
  valor_clausula?: number;
  image?: string;
}

interface Filters {
  position?: string;
  minOverall?: number;
  maxOverall?: number;
  minValue?: number;
  maxValue?: number;
  minAge?: number;
  maxAge?: number;
  search?: string;
  transferAvailability?: string;
  onlyFree?: boolean;
  hasContract?: boolean;
}

export default function TransfersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Função para buscar jogadores na API
  const fetchPlayers = useCallback(
    async (appliedFilters: Filters = filters, pageNumber = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (appliedFilters.position)
          params.append("position", appliedFilters.position);
        if (appliedFilters.minOverall)
          params.append("min_overall", String(appliedFilters.minOverall));
        if (appliedFilters.maxOverall)
          params.append("max_overall", String(appliedFilters.maxOverall));
        if (appliedFilters.minValue)
          params.append("min_value", String(appliedFilters.minValue));
        if (appliedFilters.maxValue)
          params.append("max_value", String(appliedFilters.maxValue));
        if (appliedFilters.minAge)
          params.append("min_age", String(appliedFilters.minAge));
        if (appliedFilters.maxAge)
          params.append("max_age", String(appliedFilters.maxAge));
        if (appliedFilters.search)
          params.append("search", appliedFilters.search);
        if (appliedFilters.transferAvailability)
          params.append(
            "transfer_availability",
            appliedFilters.transferAvailability
          );
        if (appliedFilters.onlyFree) params.append("only_free", "true");
        if (appliedFilters.hasContract !== undefined)
          params.append("has_contract", String(appliedFilters.hasContract));
        params.append("page", String(pageNumber));
        params.append("limit", "20");

        const res = await fetch(`/api/transfer/players?${params.toString()}`);
        if (!res.ok) throw new Error("Erro ao buscar jogadores");

        const data = await res.json();
        setPlayers(data.players || []);
        setTotalPages(Math.ceil(data.total / 20) || 1);
      } catch (err: unknown) {
        let message = "Erro desconhecido";
        if (err instanceof Error) message = err.message;
        setError(message);
        setPlayers([]);
        toast({
          variant: "destructive",
          title: "Erro ao buscar jogadores",
          description: message,
        });
      } finally {
        setLoading(false);
      }
    },
    [filters, toast]
  );

  // Inicializar filtros com base nos parâmetros da URL
  useEffect(() => {
    const position = searchParams.get("position");
    const minOverall = searchParams.get("min_overall");
    const maxOverall = searchParams.get("max_overall");
    const minValue = searchParams.get("min_value");
    const maxValue = searchParams.get("max_value");
    const minAge = searchParams.get("min_age");
    const maxAge = searchParams.get("max_age");
    const search = searchParams.get("search");
    const transferAvailability = searchParams.get("transfer_availability");
    const onlyFree = searchParams.get("only_free") === "true";
    const hasContract = searchParams.get("has_contract") === "true";
    const page = searchParams.get("page");

    if (
      position ||
      minOverall ||
      maxOverall ||
      minValue ||
      maxValue ||
      minAge ||
      maxAge ||
      search ||
      transferAvailability ||
      onlyFree ||
      hasContract
    ) {
      setFilters({
        position: position || undefined,
        minOverall: minOverall ? parseInt(minOverall) : undefined,
        maxOverall: maxOverall ? parseInt(maxOverall) : undefined,
        minValue: minValue ? parseInt(minValue) : undefined,
        maxValue: maxValue ? parseInt(maxValue) : undefined,
        minAge: minAge ? parseInt(minAge) : undefined,
        maxAge: maxAge ? parseInt(maxAge) : undefined,
        search: search || undefined,
        transferAvailability: transferAvailability || undefined,
        onlyFree: onlyFree || undefined,
        hasContract: hasContract || undefined,
      });
    }

    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [searchParams]);

  // Buscar ao carregar a página e ao mudar filtros/página
  useEffect(() => {
    const page = searchParams.get("page");
    if (page) {
      setCurrentPage(parseInt(page));
    }
    fetchPlayers(filters, currentPage);
  }, [filters, searchParams, currentPage, fetchPlayers]);

  const handlePlayerAction = (player: Player) => {
    // Implementar lógica de ação do jogador (negociação, proposta, etc)
    console.log("Ação para jogador:", player.id);
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);

    // Atualizar URL com os novos filtros
    const params = new URLSearchParams();
    if (newFilters.position && newFilters.position !== "all")
      params.append("position", newFilters.position);
    if (newFilters.minOverall !== undefined)
      params.append("min_overall", String(newFilters.minOverall));
    if (newFilters.maxOverall !== undefined)
      params.append("max_overall", String(newFilters.maxOverall));
    if (newFilters.minValue !== undefined)
      params.append("min_value", String(newFilters.minValue));
    if (newFilters.maxValue !== undefined)
      params.append("max_value", String(newFilters.maxValue));
    if (newFilters.minAge !== undefined)
      params.append("min_age", String(newFilters.minAge));
    if (newFilters.maxAge !== undefined)
      params.append("max_age", String(newFilters.maxAge));
    if (newFilters.search) params.append("search", newFilters.search);
    if (
      newFilters.transferAvailability &&
      newFilters.transferAvailability !== "all"
    )
      params.append("transfer_availability", newFilters.transferAvailability);
    if (newFilters.onlyFree) params.append("only_free", "true");
    if (newFilters.hasContract !== undefined)
      params.append("has_contract", String(newFilters.hasContract));
    params.append("page", "1");

    router.push(`/web/transfers?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/web/transfers?${params.toString()}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mercado de Transferências</h1>
        <Button
          onClick={() => setIsFiltersOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <TransferFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApplyFilters={handleApplyFilters}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : players.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum jogador encontrado</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onActionClick={() => handlePlayerAction(player)}
            />
          ))}
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {players.length} jogadores de {totalPages * 20}
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
