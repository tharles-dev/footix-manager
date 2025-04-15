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
}

function SquadList({ clubId }: SquadListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showTacticsEditor, setShowTacticsEditor] = useState(false);

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

  const handleSaveTactics = async (tactics: {
    formation: string;
    startingPlayerIds: string[];
    benchPlayerIds: string[];
    captainId?: string;
    freeKickTakerId?: string;
    penaltyTakerId?: string;
  }) => {
    // TODO: Implementar salvamento das táticas
    console.log("Táticas salvas:", tactics);
    setShowTacticsEditor(false);
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
              formation="4-4-2"
              startingPlayerIds={[]}
              benchPlayerIds={[]}
              onSave={handleSaveTactics}
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

export function SquadListWrapper({ clubId }: SquadListProps) {
  return (
    <Suspense fallback={<SquadListSkeleton />}>
      <SquadList clubId={clubId} />
    </Suspense>
  );
}
