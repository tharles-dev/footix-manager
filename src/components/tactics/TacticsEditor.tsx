import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormationField } from "./FormationField";
import { Player } from "@/lib/api/players";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

type PlayStyle = "equilibrado" | "contra-ataque" | "ataque total";
type Marking = "leve" | "pesada" | "muito pesada";

interface TacticsEditorProps {
  players: Player[];
  serverId: string;
  clubId: string;
  onSave: (tactics: {
    formation: string;
    starting_ids: string[];
    bench_ids: string[];
    captain_id?: string;
    free_kick_taker_id?: string;
    penalty_taker_id?: string;
    play_style: PlayStyle;
    marking: Marking;
    server_id: string;
    club_id: string;
  }) => Promise<void>;
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
}

export function TacticsEditor({
  players,
  serverId,
  clubId,
  onSave,
}: TacticsEditorProps) {
  const [formation, setFormation] = useState("4-4-2");
  const [selectedPlayers, setSelectedPlayers] = useState<{
    [key: string]: Player;
  }>({});
  const [captain, setCaptain] = useState<Player | null>(null);
  const [freeKickTaker, setFreeKickTaker] = useState<Player | null>(null);
  const [penaltyTaker, setPenaltyTaker] = useState<Player | null>(null);
  const [playStyle, setPlayStyle] =
    useState<Tactics["play_style"]>("equilibrado");
  const [marking, setMarking] = useState<Tactics["marking"]>("leve");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Limpa os jogadores selecionados quando a formação é alterada
  useEffect(() => {
    setSelectedPlayers({});
    setCaptain(null);
    setFreeKickTaker(null);
    setPenaltyTaker(null);
  }, [formation]);

  useEffect(() => {
    const fetchTactics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/club/${clubId}/tactics`);
        if (response.ok) {
          const tacticsData: Tactics = await response.json();

          // Atualizar os estados com os dados carregados
          if (tacticsData) {
            setFormation(tacticsData.formation || "4-4-2");
            setPlayStyle(tacticsData.play_style || "equilibrado");
            setMarking(tacticsData.marking || "leve");

            // Mapear jogadores titulares
            const initialSelectedPlayers: { [key: string]: Player } = {};

            // Mapeia os jogadores titulares para as posições do campo
            tacticsData.starting_ids?.forEach((playerInfo: string) => {
              const [playerId, position] = playerInfo.includes(":")
                ? playerInfo.split(":")
                : [playerInfo, ""];

              const player = players.find((p) => p.id === playerId);
              if (player) {
                const positionKey =
                  position ||
                  `POSITION-${tacticsData.starting_ids.indexOf(playerInfo)}`;
                initialSelectedPlayers[positionKey] = player;
              }
            });

            // Mapeia os jogadores reservas para as posições de reserva
            tacticsData.bench_ids?.forEach((playerInfo: string) => {
              const [playerId, position] = playerInfo.includes(":")
                ? playerInfo.split(":")
                : [playerInfo, ""];

              const player = players.find((p) => p.id === playerId);
              if (player) {
                const positionKey =
                  position ||
                  `BENCH-${tacticsData.bench_ids.indexOf(playerInfo)}`;
                initialSelectedPlayers[positionKey] = player;
              }
            });

            setSelectedPlayers(initialSelectedPlayers);

            // Definir capitão, cobrador de falta e pênalti
            if (tacticsData.captain_id) {
              setCaptain(
                players.find((p) => p.id === tacticsData.captain_id) || null
              );
            }
            if (tacticsData.free_kick_taker_id) {
              setFreeKickTaker(
                players.find((p) => p.id === tacticsData.free_kick_taker_id) ||
                  null
              );
            }
            if (tacticsData.penalty_taker_id) {
              setPenaltyTaker(
                players.find((p) => p.id === tacticsData.penalty_taker_id) ||
                  null
              );
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar táticas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (players && players.length > 0) {
      fetchTactics();
    }
  }, [players, clubId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Obter os jogadores titulares com suas posições específicas
      const startingPlayerIds = Object.entries(selectedPlayers)
        .filter(([key]) => !key.startsWith("BENCH-"))
        .map(([key, player]) => {
          // key já está no formato "POSITION-INDEX"
          return `${player.id}:${key}`;
        });

      // Obter os jogadores reservas com suas posições específicas
      const benchPlayerIds = Object.entries(selectedPlayers)
        .filter(([key]) => key.startsWith("BENCH-"))
        .map(([key, player]) => {
          // key já está no formato "BENCH-INDEX"
          return `${player.id}:${key}`;
        });

      await onSave({
        formation,
        starting_ids: startingPlayerIds,
        bench_ids: benchPlayerIds,
        captain_id: captain?.id,
        free_kick_taker_id: freeKickTaker?.id,
        penalty_taker_id: penaltyTaker?.id,
        play_style: playStyle,
        marking: marking,
        server_id: serverId,
        club_id: clubId,
      });
    } catch (error) {
      console.error("Erro ao salvar táticas:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-[400px] w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Formação</Label>
          <Select value={formation} onValueChange={setFormation}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a formação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4-4-2">4-4-2</SelectItem>
              <SelectItem value="4-3-3">4-3-3</SelectItem>
              <SelectItem value="3-5-2">3-5-2</SelectItem>
              <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
              <SelectItem value="5-3-2">5-3-2</SelectItem>
              <SelectItem value="3-4-3">3-4-3</SelectItem>
              <SelectItem value="4-1-2-1-2">4-1-2-1-2</SelectItem>
              <SelectItem value="4-2-2-2">4-2-2-2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Capitão</Label>
          <Select
            value={captain?.id || ""}
            onValueChange={(value) => {
              const player = players.find((p) => p.id === value);
              setCaptain(player || null);
            }}
            disabled={Object.keys(selectedPlayers).length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o capitão" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(selectedPlayers)
                .filter(([key]) => !key.startsWith("BENCH-"))
                .map(([, player]) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>C. de Falta</Label>
          <Select
            value={freeKickTaker?.id || ""}
            onValueChange={(value) => {
              const player = players.find((p) => p.id === value);
              setFreeKickTaker(player || null);
            }}
            disabled={Object.keys(selectedPlayers).length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cobrador de falta" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(selectedPlayers)
                .filter(([key]) => !key.startsWith("BENCH-"))
                .map(([, player]) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>C. Pênalti</Label>
          <Select
            value={penaltyTaker?.id || ""}
            onValueChange={(value) => {
              const player = players.find((p) => p.id === value);
              setPenaltyTaker(player || null);
            }}
            disabled={Object.keys(selectedPlayers).length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cobrador de pênalti" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(selectedPlayers)
                .filter(([key]) => !key.startsWith("BENCH-"))
                .map(([, player]) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FormationField
        formation={formation}
        players={players}
        selectedPlayers={selectedPlayers}
        onPlayerSelect={(position: string, playerId: string | null) => {
          if (playerId) {
            const player = players.find((p) => p.id === playerId);
            if (player) {
              setSelectedPlayers((prev) => ({
                ...prev,
                [position]: player,
              }));
            }
          } else {
            setSelectedPlayers((prev) => {
              const newState = { ...prev };
              delete newState[position];
              return newState;
            });
          }
        }}
        captain={captain}
        freeKickTaker={freeKickTaker}
        penaltyTaker={penaltyTaker}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estilo de Jogo</Label>
          <Select
            value={playStyle}
            onValueChange={(value: Tactics["play_style"]) =>
              setPlayStyle(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estilo de jogo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equilibrado">Equilibrado</SelectItem>
              <SelectItem value="contra-ataque">Contra-ataque</SelectItem>
              <SelectItem value="ataque total">Ataque Total</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Marcação</Label>
          <Select
            value={marking}
            onValueChange={(value: Tactics["marking"]) => setMarking(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a marcação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leve">Leve</SelectItem>
              <SelectItem value="pesada">Pesada</SelectItem>
              <SelectItem value="muito pesada">Muito Pesada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Táticas"
          )}
        </Button>
      </div>
    </div>
  );
}
