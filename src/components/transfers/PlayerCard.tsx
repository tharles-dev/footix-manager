import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface PlayerCardProps {
  player: {
    name: string;
    overall: number;
    position: string;
    nationality: string;
    club?: {
      name: string;
      user?: {
        name: string;
      };
    } | null;
    salario_atual: number;
    valor_mercado: number;
    valor_clausula?: number;
  };
  onActionClick: () => void;
}

export function PlayerCard({ player, onActionClick }: PlayerCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex gap-2">
          <Badge
            variant="default"
            className="font-bold text-base bg-primary hover:bg-primary"
          >
            {player.overall}
          </Badge>
          <Badge variant="secondary">{player.position}</Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {player.nationality}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onActionClick}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <Avatar>
          <AvatarImage src="/assets/player_dummy.png" />
          <AvatarFallback>
            {player.name
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg mb-1">{player.name}</h3>

        {player.club && player.club.name ? (
          <p className="text-sm text-muted-foreground mb-4">
            {player.club.name} ({player.club.user?.name || "Sem dono"})
          </p>
        ) : (
          <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium mb-4">
            Jogador Livre
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Salário</p>
            <p className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(player.salario_atual)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor de Mercado</p>
            <p className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(player.valor_mercado)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
