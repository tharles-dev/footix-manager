import { Suspense, useEffect, useState } from "react";
import { Player, getSquadPlayers } from "@/lib/api/players";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SquadListProps {
  clubId: string;
}

function SquadList({ clubId }: SquadListProps) {
  const [players, setPlayers] = useState<Player[]>([]);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player, index) => (
        <PlayerCard key={player.id} {...player} index={index} />
      ))}
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
