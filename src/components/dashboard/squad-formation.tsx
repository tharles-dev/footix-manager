"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";

interface Player {
  id: string;
  name: string;
  position: string;
  avatar: string;
  overall: number;
}

interface SquadFormationProps {
  formation: string;
  players: Player[];
}

export function SquadFormation({ formation, players }: SquadFormationProps) {
  const getFormationPositions = (formation: string) => {
    const [def, mid, att] = formation.split("-").map(Number);
    return {
      defenders: def,
      midfielders: mid,
      attackers: att,
    };
  };

  const positions = getFormationPositions(formation);

  const renderPlayerCard = (player: Player) => (
    <div key={player.id} className="absolute transform -translate-x-1/2">
      <div className="flex flex-col items-center">
        <div className="relative w-10 h-10 mb-1">
          <Image
            src={player.avatar}
            alt={player.name}
            fill
            className="rounded-full object-cover border-2 border-primary"
          />
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-1 text-xs font-bold">
            {player.overall}
          </div>
        </div>
        <span className="text-xs font-medium text-center max-w-[80px] truncate">
          {player.name}
        </span>
      </div>
    </div>
  );

  return (
    <Card className="relative aspect-[2/3] bg-[url('/images/field.png')] bg-cover bg-center p-4">
      {/* Goleiro */}
      <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2">
        {players[0] && renderPlayerCard(players[0])}
      </div>

      {/* Defensores */}
      <div className="absolute bottom-[30%] left-0 right-0 flex justify-around">
        {players
          .slice(1, positions.defenders + 1)
          .map((player) => renderPlayerCard(player))}
      </div>

      {/* Meio-campistas */}
      <div className="absolute bottom-[50%] left-0 right-0 flex justify-around">
        {players
          .slice(
            positions.defenders + 1,
            positions.defenders + positions.midfielders + 1
          )
          .map((player) => renderPlayerCard(player))}
      </div>

      {/* Atacantes */}
      <div className="absolute bottom-[70%] left-0 right-0 flex justify-around">
        {players
          .slice(
            positions.defenders + positions.midfielders + 1,
            positions.defenders +
              positions.midfielders +
              positions.attackers +
              1
          )
          .map((player) => renderPlayerCard(player))}
      </div>
    </Card>
  );
}
