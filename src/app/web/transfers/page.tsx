"use client";
import { useState } from "react";
import { PlayerCard } from "@/components/transfers/PlayerCard";
import { TransferFilters } from "@/components/transfers/TransferFilters";

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
  nationality?: string;
  onlyFree?: boolean;
}

export default function TransfersPage() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const handlePlayerAction = (playerId: string) => {
    // Implementar lógica de ação do jogador (negociação, proposta, etc)
    console.log("Ação para jogador:", playerId);
  };

  const handleApplyFilters = (filters: Filters) => {
    setLoading(true);
    // Implementar chamada à API com os filtros
    console.log("Aplicando filtros:", filters);
    // Simular carregamento
    setTimeout(() => {
      // Aqui virá a chamada à API que atualizará os players
      setPlayers([]); // Temporariamente limpando a lista até implementar a chamada à API
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mercado de Transferências</h1>
        <button
          onClick={() => setIsFiltersOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
            />
          </svg>
          Filtros
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum jogador encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onActionClick={() => handlePlayerAction(player.id)}
            />
          ))}
        </div>
      )}

      <TransferFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
}
