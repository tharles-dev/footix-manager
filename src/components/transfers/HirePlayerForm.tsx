import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/contexts/AppContext";

interface HirePlayerFormProps {
  player: {
    id: string;
    name: string;
    salario_atual: number;
  };
  onSuccess?: () => void;
  onCancel: () => void;
}

export function HirePlayerForm({
  player,
  onSuccess,
  onCancel,
}: HirePlayerFormProps) {
  const { server, club } = useApp();
  const [salary, setSalary] = useState(player.salario_atual);
  const [duration, setDuration] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/transfer/hire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.id,
          salary,
          duration,
          serverId: server?.id,
          clubId: club?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao contratar jogador");
      }

      toast({
        title: "Sucesso!",
        description: "Jogador contratado com sucesso.",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "OOPS",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível contratar o jogador.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Contratar {player.name}</h3>
        <p className="text-sm text-muted-foreground">
          Preencha os detalhes do contrato do jogador
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Salário (BRL)</Label>
          <Input
            id="salary"
            type="number"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            min={player.salario_atual}
            required
          />
          <p className="text-sm text-muted-foreground">
            Salário atual:{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(player.salario_atual)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duração do Contrato (anos)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={1}
            max={5}
            required
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Contratando..." : "Contratar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
