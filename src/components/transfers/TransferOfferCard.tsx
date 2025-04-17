import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/utils";

interface TransferOfferCardProps {
  offer: {
    id: string;
    player: {
      id: string;
      name: string;
      contract: {
        salary: number;
        clause_value?: number;
        contract_start: string;
        contract_end: string;
      };
    } | null;
    from_club: {
      id: string;
      name: string;
    } | null;
    to_club: {
      id: string;
      name: string;
    } | null;
    amount: number;
    status: string;
    created_at: string;
  };
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  isSentByUser?: boolean;
}

export function TransferOfferCard({
  offer,
  onAccept,
  onReject,
  onCancel,
  isSentByUser = false,
}: TransferOfferCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "accepted":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      case "cancelled":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "accepted":
        return "Aceita";
      case "rejected":
        return "Rejeitada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const { server } = useApp();

  // Verificar se os objetos necessários existem
  if (!offer.player || !offer.from_club || !offer.to_club) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Dados incompletos</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Alguns dados da oferta estão indisponíveis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <h3 className="text-lg font-semibold">{offer.player.name}</h3>
          <p className="text-sm text-muted-foreground">
            Salário:{" "}
            {formatCurrency(
              offer.amount / (server?.market_value_multiplier || 24)
            )}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-medium ${getStatusColor(offer.status)}`}>
            {getStatusText(offer.status)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(offer.created_at)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Clube de Origem</p>
            <p className="text-sm text-muted-foreground">
              {offer.from_club.name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Clube de Destino</p>
            <p className="text-sm text-muted-foreground">
              {offer.to_club.name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Valor da Proposta</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(offer.amount)}
            </p>
          </div>
          {offer.player.contract.clause_value && (
            <div>
              <p className="text-sm font-medium">Cláusula de Rescisão</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(
                  offer.amount * ((server?.auto_clause_percentage || 200) / 100)
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {server?.auto_clause_percentage || 200}% do valor da proposta
              </p>
            </div>
          )}
        </div>
      </CardContent>
      {offer.status === "pending" && (
        <CardFooter className="flex justify-end space-x-2">
          {isSentByUser ? (
            onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )
          ) : (
            <>
              {onReject && (
                <Button variant="destructive" onClick={onReject}>
                  Rejeitar
                </Button>
              )}
              {onAccept && (
                <Button variant="default" onClick={onAccept}>
                  Aceitar
                </Button>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
