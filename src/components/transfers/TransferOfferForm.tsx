import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/contexts/AppContext";
import { Slider } from "@/components/ui/slider";

interface TransferOfferFormProps {
  player: {
    id: string;
    name: string;
    salario_atual: number;
    salario_minimo: number;
    salario_maximo: number;
    valor_mercado: number;
    valor_clausula: number;
    club: {
      id: string;
      name: string;
    } | null;
  };
  onSuccess?: () => void;
  onCancel: () => void;
}

export function TransferOfferForm({
  player,
  onSuccess,
  onCancel,
}: TransferOfferFormProps) {
  const { server, club } = useApp();
  const [salary, setSalary] = useState(player.salario_atual);
  const [calculatedMarketValue, setCalculatedMarketValue] = useState(
    player.valor_mercado
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Recalcula o valor de mercado com base no salário
  useEffect(() => {
    // Fórmula: valor_mercado * (salário / salario_atual)
    const newMarketValue =
      player.valor_mercado * (salary / player.salario_atual);
    setCalculatedMarketValue(Math.round(newMarketValue));
  }, [salary, player.salario_atual, player.valor_mercado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!player.club) {
        throw new Error("Jogador não pertence a nenhum clube");
      }

      const response = await fetch("/api/transfer/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.id,
          amount: calculatedMarketValue,
          salary: salary,
          serverId: server?.id,
          fromClubId: player.club.id,
          toClubId: club?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao enviar proposta");
      }

      toast({
        title: "Sucesso!",
        description: "Proposta de transferência enviada com sucesso.",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "OOPS",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a proposta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary">Salário (BRL)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="salary"
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                min={player.salario_minimo}
                max={player.salario_maximo}
                required
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatCurrency(salary)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Faixa Salarial</Label>
            <Slider
              value={[salary]}
              min={player.salario_minimo}
              max={player.salario_maximo}
              step={1000}
              onValueChange={(value) => setSalary(value[0])}
              className="py-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Mín: {formatCurrency(player.salario_minimo)}</span>
              <span>Máx: {formatCurrency(player.salario_maximo)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor de Mercado Calculado</Label>
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="text-lg font-medium">
                {formatCurrency(calculatedMarketValue)}
              </div>
              <p className="text-sm text-muted-foreground">
                Baseado no salário oferecido
              </p>
            </div>
          </div>

          {player.valor_clausula > 0 && (
            <div className="space-y-1">
              <Label>Cláusula de Rescisão</Label>
              <div className="p-2 border rounded-md bg-muted/30">
                <span className="font-medium">
                  {formatCurrency(player.valor_clausula)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar Proposta"}
          </Button>
        </div>
      </form>
    </div>
  );
}
