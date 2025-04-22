import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { PlayerDetails } from "@/components/transfers/PlayerDetails";
import { Eye, TrendingUp, TrendingDown, Gavel } from "lucide-react";
import { getCountryCode } from "@/lib/utils/country";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    age: number;
    nationality: string;
    position: string;
    overall: number;
    potential: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    salario_atual: number;
    valor_mercado: number;
    valor_clausula: number;
    salario_minimo: number;
    salario_maximo: number;
    morale: number;
    form: number;
    level: number;
    is_star_player: boolean;
    is_on_loan: boolean;
    transfer_availability: string;
    loan_from_club: {
      id: string;
      name: string;
    } | null;
    club: {
      id: string;
      name: string;
      user: {
        id: string;
        name: string;
      };
    } | null;
    acoes_disponiveis: {
      pode_contratar: boolean;
      pode_pagar_clausula: boolean;
      pode_emprestar: boolean;
    };
  };
  onSuccess?: () => void;
}

export function PlayerCard({ player, onSuccess }: PlayerCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleSuccess = () => {
    setShowDetails(false);
    onSuccess?.();
  };

  // Função para determinar a cor do badge de forma
  const getFormColor = (form: number) => {
    if (form >= 80) return "bg-green-500";
    if (form >= 60) return "bg-green-400";
    if (form >= 40) return "bg-yellow-400";
    if (form >= 20) return "bg-orange-400";
    return "bg-red-500";
  };

  // Função para determinar a cor do badge de moral
  const getMoraleColor = (morale: number) => {
    if (morale >= 80) return "bg-green-500";
    if (morale >= 60) return "bg-green-400";
    if (morale >= 40) return "bg-yellow-400";
    if (morale >= 20) return "bg-orange-400";
    return "bg-red-500";
  };

  const countryCode = getCountryCode(player.nationality);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={`/assets/flags/${countryCode.toLowerCase()}.svg`}
                alt={player.nationality}
              />
              <AvatarFallback>{countryCode}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{player.name}</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{player.position}</span>
                <span>•</span>
                <span>{player.age} anos</span>
                {player.is_on_loan && (
                  <>
                    <span>•</span>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-300"
                    >
                      Emprestado
                    </Badge>
                  </>
                )}
                {player.transfer_availability === "auction_only" && (
                  <>
                    <span>•</span>
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1"
                    >
                      <Gavel className="h-3 w-3" />
                      Leilão
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Badge variant="secondary" className="text-lg">
                {player.overall}
              </Badge>
              {player.potential > player.overall && (
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+{player.potential - player.overall}</span>
                </div>
              )}
              {player.potential < player.overall && (
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>{player.potential - player.overall}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Valor de mercado:</p>
              <p className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(player.valor_mercado)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Cláusula:</p>
              <p className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(player.valor_clausula)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Salário:</p>
              <p className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(player.salario_atual)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Clube:</p>
              <p className="font-medium truncate">
                {player.club ? player.club.name : "Livre"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge className={`${getFormColor(player.form)} text-white`}>
              Forma: {player.form}
            </Badge>
            <Badge className={`${getMoraleColor(player.morale)} text-white`}>
              Moral: {player.morale}
            </Badge>
            <Badge variant="outline">Nível: {player.level}</Badge>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowDetails(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </CardFooter>
      </Card>

      <PlayerDetails
        player={player}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
