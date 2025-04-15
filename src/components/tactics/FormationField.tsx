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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FormationFieldProps {
  formation: string;
  players: Player[];
  onPlayerSelect: (position: string, playerId: string | null) => void;
  selectedPlayers: { [key: string]: Player };
  captain?: Player | null;
  freeKickTaker?: Player | null;
  penaltyTaker?: Player | null;
}

// Agrupamento de posições por zona
const POSITION_GROUPS = {
  DEFENDERS: ["CB", "LB", "RB", "DMF"],
  MIDFIELDERS: ["DMF", "CMF", "LMF", "RMF", "AMF"],
  FORWARDS: ["SS", "CF", "LWF", "RWF"],
  GOALKEEPER: ["GK"],
};

// Mapeamento de posições compatíveis
const COMPATIBLE_POSITIONS = {
  CB: ["CB", "LB", "RB", "DMF"],
  LB: ["LB", "RB"],
  RB: ["RB", "LB"],
  DMF: ["DMF", "CMF"],
  CMF: ["CMF", "DMF", "AMF"],
  LMF: ["LMF", "RMF", "LWF"],
  RMF: ["RMF", "LMF", "RWF"],
  AMF: ["AMF", "CMF", "SS"],
  SS: ["SS", "CF", "AMF"],
  CF: ["CF", "SS", "LWF", "RWF"],
  LWF: ["LWF", "RWF", "LMF", "CF"],
  RWF: ["RWF", "LWF", "RMF", "CF"],
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
  "4-2-3-1": [
    "GK",
    "LB",
    "CB",
    "CB",
    "RB",
    "DMF",
    "DMF",
    "RWF",
    "AMF",
    "LWF",
    "CF",
  ],
  "5-3-2": [
    "GK",
    "LB",
    "CB",
    "CB",
    "CB",
    "RB",
    "CMF",
    "DMF",
    "CMF",
    "CF",
    "CF",
  ],
  "3-4-3": [
    "GK",
    "CB",
    "CB",
    "CB",
    "LMF",
    "CMF",
    "CMF",
    "RMF",
    "LWF",
    "CF",
    "RWF",
  ],
  "4-1-2-1-2": [
    "GK",
    "LB",
    "CB",
    "CB",
    "RB",
    "DMF",
    "CMF",
    "CMF",
    "AMF",
    "CF",
    "CF",
  ],
  "4-2-2-2": [
    "GK",
    "LB",
    "CB",
    "CB",
    "RB",
    "DMF",
    "DMF",
    "AMF",
    "AMF",
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
  "4-2-3-1": [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, // LB
    { x: 40, y: 70 }, // CB
    { x: 60, y: 70 }, // CB
    { x: 80, y: 70 }, // RB
    { x: 35, y: 55 }, // DMF
    { x: 65, y: 55 }, // DMF
    { x: 20, y: 35 }, // RWF
    { x: 50, y: 35 }, // AMF
    { x: 80, y: 35 }, // LWF
    { x: 50, y: 20 }, // CF
  ],
  "5-3-2": [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, // LB
    { x: 35, y: 70 }, // CB
    { x: 50, y: 70 }, // CB
    { x: 65, y: 70 }, // CB
    { x: 80, y: 70 }, // RB
    { x: 35, y: 45 }, // CMF
    { x: 50, y: 45 }, // DMF
    { x: 65, y: 45 }, // CMF
    { x: 35, y: 20 }, // CF
    { x: 65, y: 20 }, // CF
  ],
  "3-4-3": [
    { x: 50, y: 90 }, // GK
    { x: 35, y: 70 }, // CB
    { x: 50, y: 70 }, // CB
    { x: 65, y: 70 }, // CB
    { x: 20, y: 45 }, // LMF
    { x: 35, y: 45 }, // CMF
    { x: 65, y: 45 }, // CMF
    { x: 80, y: 45 }, // RMF
    { x: 20, y: 20 }, // LWF
    { x: 50, y: 20 }, // CF
    { x: 80, y: 20 }, // RWF
  ],
  "4-1-2-1-2": [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, // LB
    { x: 40, y: 70 }, // CB
    { x: 60, y: 70 }, // CB
    { x: 80, y: 70 }, // RB
    { x: 50, y: 55 }, // DMF
    { x: 35, y: 45 }, // CMF
    { x: 65, y: 45 }, // CMF
    { x: 50, y: 35 }, // AMF
    { x: 35, y: 20 }, // CF
    { x: 65, y: 20 }, // CF
  ],
  "4-2-2-2": [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, // LB
    { x: 40, y: 70 }, // CB
    { x: 60, y: 70 }, // CB
    { x: 80, y: 70 }, // RB
    { x: 35, y: 55 }, // DMF
    { x: 65, y: 55 }, // DMF
    { x: 35, y: 35 }, // AMF
    { x: 65, y: 35 }, // AMF
    { x: 35, y: 20 }, // CF
    { x: 65, y: 20 }, // CF
  ],
};

// Componente de barra de progresso estilo bateria
const BatteryProgress = ({
  value,
  color,
}: {
  value: number;
  color: string;
}) => {
  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <div className="w-1 h-3 bg-transparent rounded-r-full" />
    </div>
  );
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
  const [isBenchDialogOpen, setIsBenchDialogOpen] = useState(false);
  const [selectedBenchPosition, setSelectedBenchPosition] = useState<
    number | null
  >(null);

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

  // Número de jogadores reservas permitidos
  const MAX_BENCH_PLAYERS = 7;

  // Cria posições para os reservas
  const benchPositions = Array.from(
    { length: MAX_BENCH_PLAYERS },
    (_, i) => `BENCH-${i + 11}`
  );

  const getCompatiblePlayers = (position: string) => {
    console.log("getCompatiblePlayers chamado para posição:", position);
    console.log("Jogadores disponíveis:", players);
    console.log("Jogadores já selecionados:", selectedPlayerIds);

    const compatiblePositions =
      COMPATIBLE_POSITIONS[position as keyof typeof COMPATIBLE_POSITIONS] || [];

    console.log(
      "Posições compatíveis para",
      position,
      ":",
      compatiblePositions
    );

    // Filtra jogadores que:
    // 1. Têm posição compatível
    // 2. Não estão já selecionados em outra posição
    // 3. Não são o jogador atual da posição (para permitir troca)
    const filteredPlayers = players.filter((player) => {
      const isCompatible = compatiblePositions.includes(player.position);
      const isNotSelected = !selectedPlayerIds.has(player.id);
      const isCurrentPosition = selectedPlayers[position]?.id === player.id;

      console.log(`Jogador ${player.name} (${player.position}):`, {
        isCompatible,
        isNotSelected,
        isCurrentPosition,
        selected: isNotSelected || isCurrentPosition,
      });

      return isCompatible && (isNotSelected || isCurrentPosition);
    });

    console.log("Jogadores filtrados:", filteredPlayers);
    return filteredPlayers;
  };

  const handlePositionClick = (position: string, index: number) => {
    console.log(
      "handlePositionClick chamado para posição:",
      position,
      "índice:",
      index
    );
    setSelectedPosition(`${position}-${index}`);
    setIsDialogOpen(true);
  };

  const handleBenchPositionClick = (index: number) => {
    console.log("handleBenchPositionClick chamado para índice:", index);
    setSelectedBenchPosition(index);
    setIsBenchDialogOpen(true);
  };

  const handlePlayerSelect = (playerId: string | null) => {
    console.log("handlePlayerSelect chamado com playerId:", playerId);
    console.log("Posição selecionada:", selectedPosition);

    if (selectedPosition) {
      // Se estiver removendo um jogador
      if (playerId === null) {
        console.log("Removendo jogador da posição:", selectedPosition);
        onPlayerSelect(selectedPosition, null);
      } else {
        // Se estiver selecionando um novo jogador
        const player = players.find((p) => p.id === playerId);
        console.log("Jogador selecionado:", player);

        if (player) {
          // Verifica se o jogador já está em outra posição
          const currentPosition = Object.entries(selectedPlayers).find(
            ([, p]) => p.id === playerId
          );

          console.log("Posição atual do jogador:", currentPosition);

          if (currentPosition) {
            // Remove o jogador da posição anterior
            console.log(
              "Removendo jogador da posição anterior:",
              currentPosition[0]
            );
            onPlayerSelect(currentPosition[0], null);
          }

          // Adiciona o jogador na nova posição
          console.log("Adicionando jogador na nova posição:", selectedPosition);
          onPlayerSelect(selectedPosition, playerId);
        }
      }

      setIsDialogOpen(false);
      setSelectedPosition(null);
    }
  };

  const handleBenchPlayerSelect = (playerId: string | null) => {
    console.log("handleBenchPlayerSelect chamado com playerId:", playerId);
    console.log("Posição de reserva selecionada:", selectedBenchPosition);

    if (selectedBenchPosition !== null) {
      const benchPosition = `BENCH-${selectedBenchPosition + 11}`;
      console.log("Posição de reserva formatada:", benchPosition);

      // Se estiver removendo um jogador
      if (playerId === null) {
        console.log("Removendo jogador da posição de reserva:", benchPosition);
        onPlayerSelect(benchPosition, null);
      } else {
        // Se estiver selecionando um novo jogador
        const player = players.find((p) => p.id === playerId);
        console.log("Jogador de reserva selecionado:", player);

        if (player) {
          // Verifica se o jogador já está em outra posição
          const currentPosition = Object.entries(selectedPlayers).find(
            ([, p]) => p.id === playerId
          );

          console.log("Posição atual do jogador de reserva:", currentPosition);

          if (currentPosition) {
            // Remove o jogador da posição anterior
            console.log(
              "Removendo jogador da posição anterior:",
              currentPosition[0]
            );
            onPlayerSelect(currentPosition[0], null);
          }

          // Adiciona o jogador na posição de reserva
          console.log(
            "Adicionando jogador na posição de reserva:",
            benchPosition
          );
          onPlayerSelect(benchPosition, playerId);
        }
      }

      setIsBenchDialogOpen(false);
      setSelectedBenchPosition(null);
    }
  };

  // Função para gerar as iniciais do nome do jogador
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Função para determinar a cor do overall
  const getOverallColor = (overall: number) => {
    if (overall >= 80) return "bg-green-500";
    if (overall >= 70) return "bg-blue-500";
    if (overall >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Função para determinar a cor do form
  const getFormColor = (form: number) => {
    if (form >= 80) return "bg-green-500";
    if (form >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <>
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#1a472a] border-2 border-white/20 mb-6">
        <div className="absolute inset-0 bg-[url('/assets/field.png')] bg-cover bg-center">
          {positions.map((position, index) => {
            const coords = positionCoords[index];
            const positionKey = `${position}-${index}`;
            const selectedPlayer = selectedPlayers[positionKey];

            console.log(`Renderizando posição ${positionKey}:`, selectedPlayer);

            return (
              <div
                key={positionKey}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                }}
              >
                {selectedPlayer ? (
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => handlePositionClick(position, index)}
                  >
                    <div className="relative mb-2">
                      <Avatar className="h-14 w-14 border-2 border-white transition-transform group-hover:scale-110">
                        <AvatarImage
                          src={`/assets/player_dummy.png`}
                          alt={selectedPlayer.name}
                        />
                        <AvatarFallback>
                          {getInitials(selectedPlayer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white",
                          getOverallColor(selectedPlayer.overall)
                        )}
                      >
                        {selectedPlayer.overall}
                      </div>
                      <div className="absolute -top-2 -left-2 flex gap-1.5">
                        {captain?.id === selectedPlayer.id && (
                          <span className="bg-yellow-400 text-xs px-1.5 py-0.5 rounded-full">
                            C
                          </span>
                        )}
                        {freeKickTaker?.id === selectedPlayer.id && (
                          <span className="bg-blue-400 text-xs px-1.5 py-0.5 rounded-full">
                            FK
                          </span>
                        )}
                        {penaltyTaker?.id === selectedPlayer.id && (
                          <span className="bg-green-400 text-xs px-1.5 py-0.5 rounded-full">
                            P
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-white font-medium max-w-[100px] truncate text-center">
                      {selectedPlayer.name}
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-14 h-14 p-0 flex items-center justify-center bg-white/20 hover:bg-white/30 border-2 border-white/40 transition-colors"
                    onClick={() => handlePositionClick(position, index)}
                  >
                    <span className="text-sm text-white/90">{position}</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Área de reservas */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Banco de Reservas</h3>
        <div className="grid grid-cols-7 gap-2">
          {benchPositions.map((position, index) => {
            const selectedPlayer = selectedPlayers[position];

            console.log(`Renderizando reserva ${position}:`, selectedPlayer);

            return (
              <div key={position} className="flex flex-col items-center">
                {selectedPlayer ? (
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => handleBenchPositionClick(index)}
                  >
                    <div className="relative mb-2">
                      <Avatar className="h-12 w-12 border-2 border-white transition-transform group-hover:scale-110">
                        <AvatarImage
                          src={`/assets/player_dummy.png`}
                          alt={selectedPlayer.name}
                        />
                        <AvatarFallback>
                          {getInitials(selectedPlayer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          getOverallColor(selectedPlayer.overall)
                        )}
                      >
                        {selectedPlayer.overall}
                      </div>
                      <div className="absolute -top-2 -left-2 flex gap-1">
                        {captain?.id === selectedPlayer.id && (
                          <span className="bg-yellow-400 text-xs px-1 py-0.5 rounded-full">
                            C
                          </span>
                        )}
                        {freeKickTaker?.id === selectedPlayer.id && (
                          <span className="bg-blue-400 text-xs px-1 py-0.5 rounded-full">
                            FK
                          </span>
                        )}
                        {penaltyTaker?.id === selectedPlayer.id && (
                          <span className="bg-green-400 text-xs px-1 py-0.5 rounded-full">
                            P
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-white font-medium max-w-[80px] truncate text-center">
                      {selectedPlayer.name}
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-white/20 hover:bg-white/30 border-2 border-white/40 transition-colors"
                    onClick={() => handleBenchPositionClick(index)}
                  >
                    <span className="text-xs text-white/90">R{index + 1}</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle>
              Selecionar Jogador - {selectedPosition?.split("-")[0]}
            </DialogTitle>
            <DialogDescription>
              Escolha um jogador disponível para a posição{" "}
              {selectedPosition?.split("-")[0]}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {selectedPosition && (
                <>
                  {selectedPlayers[selectedPosition] && (
                    <div className="mb-6">
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
                    console.log(
                      `Renderizando grupo ${group} para posição ${selectedPosition}`
                    );
                    const groupPlayers = getCompatiblePlayers(
                      selectedPosition.split("-")[0]
                    ).filter((player) => positions.includes(player.position));

                    console.log(
                      `Jogadores filtrados para grupo ${group}:`,
                      groupPlayers
                    );

                    if (groupPlayers.length === 0) return null;

                    return (
                      <div key={group} className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {group}
                        </h4>
                        {groupPlayers.map((player) => (
                          <Button
                            key={player.id}
                            variant="outline"
                            className="w-full justify-between p-3 h-20"
                            onClick={() => handlePlayerSelect(player.id)}
                          >
                            <div className="flex items-center gap-4 w-full">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={`/assets/player_dummy.png`}
                                  alt={player.name}
                                />
                                <AvatarFallback>
                                  {getInitials(player.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start w-full space-y-2">
                                <span className="font-medium">
                                  {player.name}
                                </span>
                                <div className="flex gap-2 justify-between w-full">
                                  <Badge variant="outline" className="text-xs">
                                    {player.position}
                                  </Badge>
                                  <BatteryProgress
                                    value={player.form || 50}
                                    color={getFormColor(player.form || 50)}
                                  />
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      getOverallColor(player.overall)
                                    )}
                                  >
                                    {player.overall}
                                  </Badge>
                                </div>
                              </div>
                            </div>
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

      {/* Dialog para seleção de jogadores reservas */}
      <Dialog open={isBenchDialogOpen} onOpenChange={setIsBenchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle>
              Selecionar Reserva - R
              {selectedBenchPosition !== null ? selectedBenchPosition + 1 : ""}
            </DialogTitle>
            <DialogDescription>
              Escolha um jogador para o banco de reservas
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {selectedBenchPosition !== null && (
                <>
                  {selectedPlayers[`BENCH-${selectedBenchPosition + 11}`] && (
                    <div className="mb-6">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleBenchPlayerSelect(null)}
                      >
                        Remover{" "}
                        {
                          selectedPlayers[`BENCH-${selectedBenchPosition + 11}`]
                            .name
                        }
                      </Button>
                    </div>
                  )}
                  {Object.entries(POSITION_GROUPS).map(([group, positions]) => {
                    console.log(
                      `Renderizando grupo ${group} para reserva ${selectedBenchPosition}`
                    );

                    // Para reservas, permitimos qualquer jogador que não esteja já selecionado
                    const groupPlayers = players.filter((player) => {
                      const isInGroup = positions.includes(player.position);
                      const isNotSelected = !selectedPlayerIds.has(player.id);
                      const isCurrentPosition =
                        selectedPlayers[`BENCH-${selectedBenchPosition + 11}`]
                          ?.id === player.id;

                      console.log(`Jogador ${player.name} para reserva:`, {
                        isInGroup,
                        isNotSelected,
                        isCurrentPosition,
                        selected:
                          isInGroup && (isNotSelected || isCurrentPosition),
                      });

                      return isInGroup && (isNotSelected || isCurrentPosition);
                    });

                    console.log(
                      `Jogadores filtrados para grupo ${group} (reservas):`,
                      groupPlayers
                    );

                    if (groupPlayers.length === 0) return null;

                    return (
                      <div key={group} className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {group}
                        </h4>
                        {groupPlayers.map((player) => (
                          <Button
                            key={player.id}
                            variant="outline"
                            className="w-full justify-between p-3 h-20"
                            onClick={() => handleBenchPlayerSelect(player.id)}
                          >
                            <div className="flex items-center gap-4 w-full">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={`/assets/player_dummy.png`}
                                  alt={player.name}
                                />
                                <AvatarFallback>
                                  {getInitials(player.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start w-full space-y-2">
                                <span className="font-medium">
                                  {player.name}
                                </span>
                                <div className="flex gap-2 justify-between w-full">
                                  <Badge variant="outline" className="text-xs">
                                    {player.position}
                                  </Badge>
                                  <BatteryProgress
                                    value={player.form || 50}
                                    color={getFormColor(player.form || 50)}
                                  />
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      getOverallColor(player.overall)
                                    )}
                                  >
                                    {player.overall}
                                  </Badge>
                                </div>
                              </div>
                            </div>
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
