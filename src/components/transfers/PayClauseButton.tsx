import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface PayClauseButtonProps {
  playerId: string;
  clubId: string;
  clauseAmount: number;
  onSuccess?: () => void;
}

export function PayClauseButton({
  playerId,
  clubId,
  clauseAmount,
  onSuccess,
}: PayClauseButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayClause = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/transfer/pay-clause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_id: playerId,
          club_id: clubId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      toast({
        title: "Sucesso",
        description: "Multa rescisória paga com sucesso",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayClause} disabled={loading} variant="destructive">
      {loading
        ? "Processando..."
        : `Pagar Multa (${clauseAmount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })})`}
    </Button>
  );
}
