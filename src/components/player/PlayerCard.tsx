import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlayerCardProps {
  name: string;
  age: number;
  nationality: string;
  position: string;
  overall: number;
  index?: number;
}

export function PlayerCard({
  name,
  age,
  nationality,
  position,
  overall,
  index = 0,
}: PlayerCardProps) {
  // Gerar iniciais para o fallback do avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  // Determinar a cor do overall com base no valor
  const getOverallColor = (overall: number) => {
    if (overall >= 85) return "bg-green-500 text-white";
    if (overall >= 84) return "bg-green-400 text-white";
    if (overall >= 79) return "bg-yellow-500 text-black";
    if (overall >= 70) return "bg-yellow-400 text-black";
    if (overall >= 64) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <Card
      className={cn(
        "p-4 flex items-center justify-between hover:bg-muted/50 transition-colors",
        "animate-in fade-in slide-in-from-bottom-5",
        "duration-200"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={`/assets/player_dummy.png`} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="text-sm text-muted-foreground">
            {age} anos • {nationality} • {position}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "px-2 py-1 rounded-md font-bold",
            getOverallColor(overall)
          )}
        >
          {overall}
        </span>
      </div>
    </Card>
  );
}
