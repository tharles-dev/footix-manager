import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/contexts/AppContext";

interface PayClauseFormProps {
  player: {
    id: string;
    name: string;
    contract: {
      clause_value: number;
    };
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function PayClauseForm({
  player,
  onSuccess,
  onCancel,
}: PayClauseFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { club, server } = useApp();

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/transfer/pay-clause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_id: player.id,
          club_id: club?.id,
          server_id: server?.id,
          amount: player.contract.clause_value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao pagar multa rescisória");
      }

      toast({
        title: "Sucesso!",
        description: data.message,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao pagar multa rescisória",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Você está prestes a pagar a multa rescisória de{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(player.contract.clause_value)}{" "}
          para contratar {player.name}.
        </p>
        <p className="text-sm text-muted-foreground">
          Saldo atual do clube:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(club?.balance || 0)}
        </p>
        <p className="text-sm text-muted-foreground">
          A multa rescisória é calculada como{" "}
          {server?.auto_clause_percentage || 200}% do valor da proposta.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Processando..." : "Confirmar Pagamento"}
        </Button>
      </div>
    </div>
  );
}
