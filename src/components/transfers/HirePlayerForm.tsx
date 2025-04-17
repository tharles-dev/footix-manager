import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/contexts/AppContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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
          salary: player.salario_atual,
          duration: 1,
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
      <Alert variant="info">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Jogadores livres são contratados com salário fixo e contrato de 1 ano.
          Não é possível negociar os termos.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Salário (BRL)</Label>
          <Input
            id="salary"
            type="number"
            value={player.salario_atual}
            readOnly
            disabled
          />
          <p className="text-sm text-muted-foreground">
            O salário do jogador livre não pode ser negociado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duração do Contrato (anos)</Label>
          <Input id="duration" type="number" value={1} readOnly disabled />
          <p className="text-sm text-muted-foreground">
            Jogadores livres são contratados por 1 ano
          </p>
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
