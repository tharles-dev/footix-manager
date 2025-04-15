import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Player } from "@/lib/api/players";

interface FormationFieldProps {
  formation: string;
  players: Player[];
  onPlayerSelect: (position: string, playerId: string | null) => void;
  selectedPlayers: { [key: string]: Player };
  captain?: Player;
  freeKickTaker?: Player;
  penaltyTaker?: Player;
}

// Agrupamento de posições por zona
const POSITION_GROUPS = {
  DEFENDERS: ["CB", "LB", "RB"],
  MIDFIELDERS: ["DMF", "CMF", "LMF", "RMF", "AMF"],
  FORWARDS: ["SS", "CF", "LWF", "RWF"],
  GOALKEEPER: ["GK"],
};

// Mapeamento de posições compatíveis
const COMPATIBLE_POSITIONS = {
  CB: ["CB", "LB", "RB"],
  LB: ["LB", "RB"],
  RB: ["RB", "LB"],
  DMF: ["DMF", "CMF"],
  CMF: ["CMF", "DMF", "AMF"],
  LMF: ["LMF", "RMF", "LWF"],
  RMF: ["RMF", "LMF", "RWF"],
  AMF: ["AMF", "CMF", "SS"],
  SS: ["SS", "CF", "AMF"],
  CF: ["CF", "SS", "LWF", "RWF"],
  LWF: ["LWF", "RWF", "LMF"],
  RWF: ["RWF", "LWF", "RMF"],
  GK: ["GK"],
};

const FORMATIONS: { [key: string]: string[] } = {
  "4-4-2": [
    "GK",
    "LB",
    "CB",
    "CB",
    "RB",
    "LMF",
    "CMF",
    "CMF",
    "RMF",
    "CF",
    "CF",
  ],
  "4-3-3": [
    "GK",
    "LB",
    "CB",
    "CB",
    "RB",
    "CMF",
    "DMF",
    "CMF",
    "RWF",
    "CF",
    "LWF",
  ],
  "3-5-2": [
    "GK",
    "CB",
    "CB",
    "CB",
    "LMF",
    "CMF",
    "DMF",
    "CMF",
    "RMF",
    "CF",
    "CF",
  ],
};

const POSITION_CONFIGS: { [key: string]: { x: number; y: number }[] } = {
  "4-4-2": [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, // LB
    { x: 40, y: 70 }, // CB
    { x: 60, y: 70 }, // CB
    { x: 80, y: 70 }, // RB
    { x: 20, y: 45 }, // LMF
    { x: 40, y: 45 }, // CMF
    { x: 60, y: 45 }, // CMF
    { x: 80, y: 45 }, // RMF
    { x: 35, y: 20 }, // CF
    { x: 65, y: 20 }, // CF
  ],
  "4-3-3": [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, // LB
    { x: 40, y: 70 }, // CB
    { x: 60, y: 70 }, // CB
    { x: 80, y: 70 }, // RB
    { x: 35, y: 45 }, // CMF
    { x: 50, y: 45 }, // DMF
    { x: 65, y: 45 }, // CMF
    { x: 20, y: 20 }, // RWF
    { x: 50, y: 20 }, // CF
    { x: 80, y: 20 }, // LWF
  ],
  "3-5-2": [
    { x: 50, y: 90 }, // GK
    { x: 35, y: 70 }, // CB
    { x: 50, y: 70 }, // CB
    { x: 65, y: 70 }, // CB
    { x: 20, y: 45 }, // LMF
    { x: 35, y: 45 }, // CMF
    { x: 50, y: 45 }, // DMF
    { x: 65, y: 45 }, // CMF
    { x: 80, y: 45 }, // RMF
    { x: 35, y: 20 }, // CF
    { x: 65, y: 20 }, // CF
  ],
};

export function FormationField({
  formation,
  players,
  onPlayerSelect,
  selectedPlayers,
  captain,
  freeKickTaker,
  penaltyTaker,
}: FormationFieldProps) {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set()
  );

  // Atualiza o conjunto de IDs quando selectedPlayers muda
  useEffect(() => {
    const ids = new Set(
      Object.values(selectedPlayers).map((player) => player.id)
    );
    setSelectedPlayerIds(ids);
  }, [selectedPlayers]);

  const positions = FORMATIONS[formation] || [];
  const positionCoords = POSITION_CONFIGS[formation] || [];

  // Cria um mapeamento de posições para índices
  const positionToIndex: { [key: string]: number } = {};
  positions.forEach((pos, index) => {
    positionToIndex[`${pos}-${index}`] = index;
  });

  const getCompatiblePlayers = (position: string) => {
    const compatiblePositions =
      COMPATIBLE_POSITIONS[position as keyof typeof COMPATIBLE_POSITIONS] || [];

    // Filtra jogadores que:
    // 1. Têm posição compatível
    // 2. Não estão já selecionados em outra posição
    // 3. Não são o jogador atual da posição (para permitir troca)
    return players.filter((player) => {
      const isCompatible = compatiblePositions.includes(player.position);
      const isNotSelected = !selectedPlayerIds.has(player.id);
      const isCurrentPosition = selectedPlayers[position]?.id === player.id;

      return isCompatible && (isNotSelected || isCurrentPosition);
    });
  };

  const handlePositionClick = (position: string, index: number) => {
    setSelectedPosition(`${position}-${index}`);
    setIsDialogOpen(true);
  };

  const handlePlayerSelect = (playerId: string | null) => {
    if (selectedPosition) {
      // Se estiver removendo um jogador
      if (playerId === null) {
        onPlayerSelect(selectedPosition, null);
      } else {
        // Se estiver selecionando um novo jogador
        const player = players.find((p) => p.id === playerId);
        if (player) {
          // Verifica se o jogador já está em outra posição
          const currentPosition = Object.entries(selectedPlayers).find(
            ([, p]) => p.id === playerId
          );

          if (currentPosition) {
            // Remove o jogador da posição anterior
            onPlayerSelect(currentPosition[0], null);
          }

          // Adiciona o jogador na nova posição
          onPlayerSelect(selectedPosition, playerId);
        }
      }

      setIsDialogOpen(false);
      setSelectedPosition(null);
    }
  };

  return (
    <>
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#1a472a] border-2 border-white/20">
        <div className="absolute inset-0 bg-[url('/assets/field.png')] bg-cover bg-center">
          {positions.map((position, index) => {
            const coords = positionCoords[index];
            const positionKey = `${position}-${index}`;
            const selectedPlayer = selectedPlayers[positionKey];

            return (
              <div
                key={positionKey}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                }}
              >
                <Button
                  variant={selectedPlayer ? "default" : "outline"}
                  className="w-[100px] h-[40px] relative group"
                  onClick={() => handlePositionClick(position, index)}
                >
                  {selectedPlayer ? (
                    <>
                      <span className="text-sm font-medium">
                        {selectedPlayer.name}
                      </span>
                      <span className="absolute -top-2 -right-2 flex gap-1">
                        {captain?.id === selectedPlayer.id && (
                          <span className="bg-yellow-400 text-xs px-1 rounded">
                            C
                          </span>
                        )}
                        {freeKickTaker?.id === selectedPlayer.id && (
                          <span className="bg-blue-400 text-xs px-1 rounded">
                            FK
                          </span>
                        )}
                        {penaltyTaker?.id === selectedPlayer.id && (
                          <span className="bg-green-400 text-xs px-1 rounded">
                            P
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm opacity-70">+ {position}</span>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Selecionar Jogador - {selectedPosition?.split("-")[0]}
            </DialogTitle>
            <DialogDescription>
              Escolha um jogador disponível para a posição{" "}
              {selectedPosition?.split("-")[0]}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {selectedPosition && (
                <>
                  {selectedPlayers[selectedPosition] && (
                    <div className="mb-4">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handlePlayerSelect(null)}
                      >
                        Remover {selectedPlayers[selectedPosition].name}
                      </Button>
                    </div>
                  )}
                  {Object.entries(POSITION_GROUPS).map(([group, positions]) => {
                    const groupPlayers = getCompatiblePlayers(
                      selectedPosition.split("-")[0]
                    ).filter((player) => positions.includes(player.position));

                    if (groupPlayers.length === 0) return null;

                    return (
                      <div key={group} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          {group}
                        </h4>
                        {groupPlayers.map((player) => (
                          <Button
                            key={player.id}
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => handlePlayerSelect(player.id)}
                          >
                            <span>{player.name}</span>
                            <span className="text-sm opacity-70">
                              {player.position}
                            </span>
                          </Button>
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
