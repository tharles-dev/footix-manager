import { useEffect, useState } from "react";
import { Player, getSquadPlayers } from "@/lib/api/players";
import { FormationField } from "./FormationField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface TacticsEditorProps {
  clubId: string;
  formation: string;
  onSave: (tactics: {
    formation: string;
    startingPlayerIds: string[];
    benchPlayerIds: string[];
    captainId?: string;
    freeKickTakerId?: string;
    penaltyTakerId?: string;
  }) => void;
}

const FORMATIONS = ["4-4-2", "4-3-3", "3-5-2"];

export function TacticsEditor({
  clubId,
  formation: initialFormation,
  onSave,
}: TacticsEditorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [formation, setFormation] = useState(initialFormation);
  // As chaves de posição agora incluem o índice para diferenciar posições do mesmo tipo
  // Exemplo: "CMF-0", "CMF-1", etc.
  const [selectedPlayers, setSelectedPlayers] = useState<{
    [key: string]: Player;
  }>({});
  const [captain, setCaptain] = useState<Player>();
  const [freeKickTaker, setFreeKickTaker] = useState<Player>();
  const [penaltyTaker, setPenaltyTaker] = useState<Player>();

  useEffect(() => {
    const fetchPlayers = async () => {
      const squadPlayers = await getSquadPlayers(clubId);
      setPlayers(squadPlayers);
    };
    fetchPlayers();
  }, [clubId]);

  const handlePlayerSelect = (position: string, playerId: string | null) => {
    if (playerId === null) {
      // Remove o jogador da posição
      setSelectedPlayers((prev) => {
        const newPlayers = { ...prev };
        delete newPlayers[position];
        return newPlayers;
      });
      return;
    }

    const player = players.find((p) => p.id === playerId);
    if (player) {
      setSelectedPlayers((prev) => ({
        ...prev,
        [position]: player,
      }));
    }
  };

  const handleSave = () => {
    // Extrai os IDs dos jogadores titulares e reservas
    const startingPlayerIds = Object.entries(selectedPlayers)
      .filter(([key]) => {
        // Verifica se a posição é uma das 11 primeiras posições (titulares)
        const index = parseInt(key.split("-")[1]);
        return index < 11;
      })
      .map(([, player]) => player.id);

    const benchPlayerIds = Object.entries(selectedPlayers)
      .filter(([key]) => {
        // Verifica se a posição é uma das posições restantes (reservas)
        const index = parseInt(key.split("-")[1]);
        return index >= 11;
      })
      .map(([, player]) => player.id);

    onSave({
      formation,
      startingPlayerIds,
      benchPlayerIds,
      captainId: captain?.id,
      freeKickTakerId: freeKickTaker?.id,
      penaltyTakerId: penaltyTaker?.id,
    });
  };

  const selectedPlayersList = Object.values(selectedPlayers);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Formação</label>
          <Select value={formation} onValueChange={setFormation}>
            <SelectTrigger>
              <SelectValue>{formation}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FORMATIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Capitão</label>
          <Select
            value={captain?.id || ""}
            onValueChange={(id) => setCaptain(players.find((p) => p.id === id))}
          >
            <SelectTrigger>
              <SelectValue>
                {captain?.name || "Selecione o capitão"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {selectedPlayersList.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Cobrador de Falta
          </label>
          <Select
            value={freeKickTaker?.id || ""}
            onValueChange={(id) =>
              setFreeKickTaker(players.find((p) => p.id === id))
            }
          >
            <SelectTrigger>
              <SelectValue>
                {freeKickTaker?.name || "Selecione o cobrador"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {selectedPlayersList.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Cobrador de Pênalti
          </label>
          <Select
            value={penaltyTaker?.id || ""}
            onValueChange={(id) =>
              setPenaltyTaker(players.find((p) => p.id === id))
            }
          >
            <SelectTrigger>
              <SelectValue>
                {penaltyTaker?.name || "Selecione o cobrador"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {selectedPlayersList.map((player) => (
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
        onPlayerSelect={handlePlayerSelect}
        selectedPlayers={selectedPlayers}
        captain={captain}
        freeKickTaker={freeKickTaker}
        penaltyTaker={penaltyTaker}
      />

      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvar Tática</Button>
      </div>
    </div>
  );
}
