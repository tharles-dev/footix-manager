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
  }) => void;
  initialFormation?: string;
  startingPlayerIds?: string[];
  benchPlayerIds?: string[];
  captainId?: string;
  freeKickTakerId?: string;
  penaltyTakerId?: string;
}

export function TacticsEditor({
  players,
  serverId,
  clubId,
  onSave,
  initialFormation = "4-4-2",
  startingPlayerIds = [],
  benchPlayerIds = [],
  captainId,
  freeKickTakerId,
  penaltyTakerId,
}: TacticsEditorProps) {
  const [formation, setFormation] = useState(initialFormation);
  const [selectedPlayers, setSelectedPlayers] = useState<{
    [key: string]: Player;
  }>({});
  const [captain, setCaptain] = useState<Player | null>(null);
  const [freeKickTaker, setFreeKickTaker] = useState<Player | null>(null);
  const [penaltyTaker, setPenaltyTaker] = useState<Player | null>(null);
  const [playStyle, setPlayStyle] = useState<PlayStyle>("equilibrado");
  const [marking, setMarking] = useState<Marking>("leve");

  useEffect(() => {
    if (players && players.length > 0) {
      const initialSelectedPlayers: { [key: string]: Player } = {};

      // Mapeia os jogadores titulares para as posições do campo
      startingPlayerIds.forEach((playerId, index) => {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          initialSelectedPlayers[`POSITION-${index}`] = player;
        }
      });

      // Mapeia os jogadores reservas para as posições de reserva
      benchPlayerIds.forEach((playerId, index) => {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          initialSelectedPlayers[`BENCH-${index}`] = player;
        }
      });

      setSelectedPlayers(initialSelectedPlayers);

      if (captainId) {
        setCaptain(players.find((p) => p.id === captainId) || null);
      }
      if (freeKickTakerId) {
        setFreeKickTaker(players.find((p) => p.id === freeKickTakerId) || null);
      }
      if (penaltyTakerId) {
        setPenaltyTaker(players.find((p) => p.id === penaltyTakerId) || null);
      }
    }
  }, [
    players,
    startingPlayerIds,
    benchPlayerIds,
    captainId,
    freeKickTakerId,
    penaltyTakerId,
  ]);

  const handleSave = () => {
    // Obter os jogadores titulares (posições do campo)
    const startingPlayerIds = Object.entries(selectedPlayers)
      .filter(([key]) => {
        // Verifica se a chave contém uma posição de campo (não é reserva)
        return !key.startsWith("BENCH-");
      })
      .map(([, player]) => player.id);

    // Obter os jogadores reservas
    const benchPlayerIds = Object.entries(selectedPlayers)
      .filter(([key]) => key.startsWith("BENCH-"))
      .map(([, player]) => player.id);

    onSave({
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
  };

  console.log("players", players);

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
            onValueChange={(value: PlayStyle) => setPlayStyle(value)}
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
            onValueChange={(value: Marking) => setMarking(value)}
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

      <Button onClick={handleSave}>Salvar Táticas</Button>
    </div>
  );
}
