import { Suspense, useEffect, useState } from "react";
import { Player, getSquadPlayers } from "@/lib/api/players";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TacticsEditor } from "@/components/tactics/TacticsEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface SquadListProps {
  clubId: string;
  serverId: string;
}

interface Tactics {
  formation: string;
  starting_ids: string[];
  bench_ids: string[];
  captain_id?: string;
  free_kick_taker_id?: string;
  penalty_taker_id?: string;
  play_style: "equilibrado" | "contra-ataque" | "ataque total";
  marking: "leve" | "pesada" | "muito pesada";
  startingPlayers?: Player[];
  benchPlayers?: Player[];
}

function SquadList({ clubId, serverId }: SquadListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showTacticsEditor, setShowTacticsEditor] = useState(false);
  const [tactics, setTactics] = useState<Tactics | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      const squadPlayers = await getSquadPlayers(clubId);

      // Ordenar jogadores por posição
      const positionOrder = [
        "GK",
        "CB",
        "LB",
        "RB",
        "DMF",
        "CMF",
        "RMF",
        "LMF",
        "AMF",
        "RWF",
        "LWF",
        "SS",
        "CF",
      ];

      const sortedPlayers = [...squadPlayers].sort((a, b) => {
        const posA = positionOrder.indexOf(a.position);
        const posB = positionOrder.indexOf(b.position);

        // Se a posição não estiver na lista, colocar no final
        if (posA === -1) return 1;
        if (posB === -1) return -1;

        return posA - posB;
      });

      setPlayers(sortedPlayers);
    };
    fetchPlayers();
  }, [clubId]);

  useEffect(() => {
    const fetchTactics = async () => {
      try {
        const response = await fetch(`/api/club/${clubId}/tactics`);
        if (response.ok) {
          const tacticsData = await response.json();
          setTactics(tacticsData);
        }
      } catch (error) {
        console.error("Erro ao buscar táticas:", error);
      }
    };

    if (players.length > 0) {
      fetchTactics();
    }
  }, [clubId, players]);

  const handleSaveTactics = async (tactics: {
    formation: string;
    starting_ids: string[];
    bench_ids: string[];
    captain_id?: string;
    free_kick_taker_id?: string;
    penalty_taker_id?: string;
    play_style: "equilibrado" | "contra-ataque" | "ataque total";
    marking: "leve" | "pesada" | "muito pesada";
    server_id: string;
  }) => {
    try {
      const response = await fetch(`/api/club/${clubId}/tactics`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tactics),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar táticas");
      }

      console.log("Táticas salvas com sucesso");

      // Atualizar as táticas locais após salvar
      const updatedTactics = await response.json();
      setTactics(updatedTactics);
    } catch (error) {
      console.error("Erro ao salvar táticas:", error);
    }
  };

  // Preparar os dados para o TacticsEditor
  const getTacticsEditorProps = () => {
    if (!tactics) {
      return {
        initialFormation: "4-4-2",
        startingPlayerIds: [],
        benchPlayerIds: [],
      };
    }

    return {
      initialFormation: tactics.formation || "4-4-2",
      startingPlayerIds: tactics.starting_ids || [],
      benchPlayerIds: tactics.bench_ids || [],
      captainId: tactics.captain_id,
      freeKickTakerId: tactics.free_kick_taker_id,
      penaltyTakerId: tactics.penalty_taker_id,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showTacticsEditor} onOpenChange={setShowTacticsEditor}>
          <DialogTrigger asChild>
            <Button>Configurar Tática</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Tática</DialogTitle>
              <DialogDescription>
                Configure a formação, escalação e funções especiais dos
                jogadores.
              </DialogDescription>
            </DialogHeader>
            <TacticsEditor
              clubId={clubId}
              players={players}
              serverId={serverId}
              onSave={handleSaveTactics}
              {...getTacticsEditorProps()}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player, index) => (
          <PlayerCard key={player.id} {...player} index={index} />
        ))}
      </div>
    </div>
  );
}

function SquadListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[200px] w-full" />
      ))}
    </div>
  );
}

export function SquadListWrapper({ clubId, serverId }: SquadListProps) {
  return (
    <Suspense fallback={<SquadListSkeleton />}>
      <SquadList clubId={clubId} serverId={serverId} />
    </Suspense>
  );
}
