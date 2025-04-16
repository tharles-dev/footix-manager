import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Position =
  | "all"
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "DMF"
  | "CMF"
  | "LMF"
  | "RMF"
  | "AMF"
  | "SS"
  | "CF"
  | "LWF"
  | "RWF";

interface TransferFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    minOverall?: number;
    maxOverall?: number;
    minAge?: number;
    maxAge?: number;
    minValue?: number;
    maxValue?: number;
    search?: string;
    position?: Position;
    transferAvailability?: string;
    hasContract?: boolean;
  }) => void;
}

export function TransferFilters({
  isOpen,
  onClose,
  onApplyFilters,
}: TransferFiltersProps) {
  const searchParams = useSearchParams();

  // Inicializar estados com valores da URL
  const [minOverall, setMinOverall] = useState<number | undefined>(
    searchParams.get("min_overall")
      ? Number(searchParams.get("min_overall"))
      : undefined
  );
  const [maxOverall, setMaxOverall] = useState<number | undefined>(
    searchParams.get("max_overall")
      ? Number(searchParams.get("max_overall"))
      : undefined
  );
  const [minAge, setMinAge] = useState<number | undefined>(
    searchParams.get("min_age")
      ? Number(searchParams.get("min_age"))
      : undefined
  );
  const [maxAge, setMaxAge] = useState<number | undefined>(
    searchParams.get("max_age")
      ? Number(searchParams.get("max_age"))
      : undefined
  );
  const [minValue, setMinValue] = useState<number | undefined>(
    searchParams.get("min_value")
      ? Number(searchParams.get("min_value"))
      : undefined
  );
  const [maxValue, setMaxValue] = useState<number | undefined>(
    searchParams.get("max_value")
      ? Number(searchParams.get("max_value"))
      : undefined
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [position, setPosition] = useState<Position | undefined>(
    (searchParams.get("position") as Position) || undefined
  );
  const [transferAvailability, setTransferAvailability] = useState(
    searchParams.get("transfer_availability") || ""
  );
  const [hasContract, setHasContract] = useState<string>(
    searchParams.get("has_contract") || ""
  );

  const handleApplyFilters = () => {
    onApplyFilters({
      minOverall,
      maxOverall,
      minAge,
      maxAge,
      minValue,
      maxValue,
      search,
      position: position === "all" ? undefined : position,
      transferAvailability:
        transferAvailability === "all" ? undefined : transferAvailability,
      hasContract: hasContract === "all" ? undefined : hasContract === "true",
    });
    onClose();
  };

  const handleReset = () => {
    setMinOverall(undefined);
    setMaxOverall(undefined);
    setMinAge(undefined);
    setMaxAge(undefined);
    setMinValue(undefined);
    setMaxValue(undefined);
    setSearch("");
    setPosition(undefined);
    setTransferAvailability("");
    setHasContract("all");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>
            Ajuste os filtros para encontrar os jogadores desejados
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="search">Nome do Jogador</Label>
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite o nome do jogador..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position">Posição</Label>
            <Select
              value={position}
              onValueChange={(value) => setPosition(value as Position)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma posição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="GK">Goleiro</SelectItem>
                <SelectItem value="CB">Zagueiro</SelectItem>
                <SelectItem value="LB">Lateral Esquerdo</SelectItem>
                <SelectItem value="RB">Lateral Direito</SelectItem>
                <SelectItem value="DMF">Volante</SelectItem>
                <SelectItem value="CMF">Meio Campo</SelectItem>
                <SelectItem value="LMF">Meia Esquerda</SelectItem>
                <SelectItem value="RMF">Meia Direita</SelectItem>
                <SelectItem value="AMF">Meia Atacante</SelectItem>
                <SelectItem value="SS">Segundo Atacante</SelectItem>
                <SelectItem value="CF">Centroavante</SelectItem>
                <SelectItem value="LWF">Ponta Esquerda</SelectItem>
                <SelectItem value="RWF">Ponta Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Overall</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOverall">Overall Mínimo</Label>
                <Input
                  id="minOverall"
                  type="number"
                  min={0}
                  max={99}
                  value={minOverall || ""}
                  onChange={(e) =>
                    setMinOverall(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxOverall">Overall Máximo</Label>
                <Input
                  id="maxOverall"
                  type="number"
                  min={0}
                  max={99}
                  value={maxOverall || ""}
                  onChange={(e) =>
                    setMaxOverall(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Idade</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAge">Idade Mínima</Label>
                <Input
                  id="minAge"
                  type="number"
                  min={15}
                  max={50}
                  value={minAge || ""}
                  onChange={(e) =>
                    setMinAge(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxAge">Idade Máxima</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min={15}
                  max={50}
                  value={maxAge || ""}
                  onChange={(e) =>
                    setMaxAge(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Valor</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minValue">Valor Mínimo</Label>
                <Input
                  id="minValue"
                  type="number"
                  min={0}
                  value={minValue || ""}
                  onChange={(e) =>
                    setMinValue(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxValue">Valor Máximo</Label>
                <Input
                  id="maxValue"
                  type="number"
                  min={0}
                  value={maxValue || ""}
                  onChange={(e) =>
                    setMaxValue(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transferAvailability">Disponibilidade</Label>
            <Select
              value={transferAvailability}
              onValueChange={setTransferAvailability}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a disponibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="auction_only">Apenas Leilão</SelectItem>
                <SelectItem value="unavailable">Indisponível</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hasContract">Status do Contrato</Label>
            <Select value={hasContract} onValueChange={setHasContract}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status do contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Com Contrato</SelectItem>
                <SelectItem value="false">Sem Contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleReset}>
            Limpar
          </Button>
          <Button onClick={handleApplyFilters}>Aplicar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
