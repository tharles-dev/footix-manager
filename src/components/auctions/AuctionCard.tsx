import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Eye, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { getCountryCode } from "@/lib/utils/country";
import { formatCurrency } from "@/lib/utils";
import { useCountdown } from "@/hooks/useCountdown";

interface AuctionCardProps {
  auction: {
    id: string;
    status: "scheduled" | "active" | "completed" | "cancelled";
    starting_bid: number;
    current_bid: number;
    scheduled_start_time: string;
    countdown_minutes: number;
    player: {
      id: string;
      name: string;
      position: string;
      overall: number;
      potential: number;
      age: number;
      nationality: string;
    };
    seller_club: {
      id: string;
      name: string;
      logo_url: string | null;
    } | null;
    current_bidder: {
      id: string;
      name: string;
      logo_url: string | null;
    } | null;
  };
  onBid?: (amount: number) => void;
  hideViewDetails?: boolean;
  hideBidButton?: boolean;
}

export function AuctionCard({
  auction,
  hideViewDetails = false,
}: AuctionCardProps) {
  const router = useRouter();
  const { formattedTime, isFinished, isStarted } = useCountdown(
    auction.scheduled_start_time,
    auction.countdown_minutes
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "scheduled":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "scheduled":
        return "Agendado";
      case "completed":
        return "Finalizado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getCountdownText = () => {
    if (!isStarted) {
      return "Inicia em:";
    }
    if (isFinished) {
      return "Finalizado";
    }
    return "Termina em:";
  };

  const formatScheduledDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month} às ${hours}:${minutes}`;
  };

  const countryCode = getCountryCode(auction.player.nationality);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={`/assets/flags/${countryCode.toLowerCase()}.svg`}
              alt={auction.player.nationality}
            />
            <AvatarFallback>{countryCode}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{auction.player.name}</h3>
              <Badge className={getStatusColor(auction.status)}>
                {getStatusText(auction.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{auction.player.position}</span>
              <span>•</span>
              <span>{auction.player.age} anos</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant="secondary" className="text-lg">
              {auction.player.overall}
            </Badge>
            {auction.player.potential > auction.player.overall && (
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>
                  +{auction.player.potential - auction.player.overall}
                </span>
              </div>
            )}
            {auction.player.potential < auction.player.overall && (
              <div className="flex items-center text-xs text-red-600 mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>{auction.player.potential - auction.player.overall}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Lance Atual:</p>
            <p className="font-medium">{formatCurrency(auction.current_bid)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lance Inicial:</p>
            <p className="font-medium">
              {formatCurrency(auction.starting_bid)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Vendedor:</p>
            <p className="font-medium truncate">
              {auction.seller_club ? auction.seller_club.name : "Sistema"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Maior Lance:</p>
            <p className="font-medium truncate">
              {auction.current_bidder ? auction.current_bidder.name : "Nenhum"}
            </p>
          </div>
        </div>

        {auction.status === "scheduled" && (
          <div className="mt-4">
            <div className="flex items-center text-sm text-blue-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">
                Início: {formatScheduledDateTime(auction.scheduled_start_time)}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {!hideViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/web/auctions/${auction.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              )}
            </div>
          </div>
        )}

        {auction.status === "active" && (
          <div className="mt-4">
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-500">
                {getCountdownText()}
              </span>
              <span
                className={`ml-2 font-bold ${
                  isFinished ? "text-red-600" : "text-green-600"
                }`}
              >
                {isFinished ? "Finalizado" : formattedTime}
              </span>
            </div>
            <div className="flex gap-2">
              {!hideViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/web/auctions/${auction.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
