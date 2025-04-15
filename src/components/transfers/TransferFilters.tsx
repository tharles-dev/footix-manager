import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";

interface TransferFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
}

const positions = [
  { value: "all", label: "Todas" },
  // Goleiros
  { value: "GK", label: "Goleiro (GK)" },
  // Defensores
  { value: "CB", label: "Zagueiro (CB)" },
  { value: "LB", label: "Lateral Esquerdo (LB)" },
  { value: "RB", label: "Lateral Direito (RB)" },
  // Meio-campistas
  { value: "DMF", label: "Volante (DMF)" },
  { value: "CMF", label: "Meia Central (CMF)" },
  { value: "LMF", label: "Meia Esquerda (LMF)" },
  { value: "RMF", label: "Meia Direita (RMF)" },
  { value: "AMF", label: "Meia Atacante (AMF)" },
  // Atacantes
  { value: "SS", label: "Segundo Atacante (SS)" },
  { value: "CF", label: "Centroavante (CF)" },
  { value: "LWF", label: "Ponta Esquerda (LWF)" },
  { value: "RWF", label: "Ponta Direita (RWF)" },
];

const filterSchema = z
  .object({
    position: z
      .enum([
        "all",
        "GK",
        "CB",
        "LB",
        "RB",
        "DMF",
        "CMF",
        "LMF",
        "RMF",
        "AMF",
        "SS",
        "CF",
        "LWF",
        "RWF",
      ])
      .optional(),
    minOverall: z.number().min(1).max(99).optional(),
    maxOverall: z.number().min(1).max(99).optional(),
    minValue: z.number().min(0).optional(),
    maxValue: z.number().min(0).optional(),
    onlyFree: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Se ambos estiverem definidos, minOverall deve ser menor ou igual a maxOverall
      if (data.minOverall && data.maxOverall) {
        return data.minOverall <= data.maxOverall;
      }
      return true;
    },
    {
      message: "O overall mínimo deve ser menor ou igual ao máximo",
      path: ["minOverall"],
    }
  )
  .refine(
    (data) => {
      // Se ambos estiverem definidos, minValue deve ser menor ou igual a maxValue
      if (data.minValue && data.maxValue) {
        return data.minValue <= data.maxValue;
      }
      return true;
    },
    {
      message: "O valor mínimo deve ser menor ou igual ao máximo",
      path: ["minValue"],
    }
  );

type FilterValues = z.infer<typeof filterSchema>;
type Position = NonNullable<FilterValues["position"]>;

export function TransferFilters({
  isOpen,
  onClose,
  onApplyFilters,
}: TransferFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({});
  const { toast } = useToast();

  const handlePositionChange = (value: Position) => {
    setFilters((prev) => ({
      ...prev,
      position: value === "all" ? undefined : value,
    }));
  };

  const handleApplyFilters = () => {
    try {
      // Limpa valores vazios antes da validação
      const filtersToValidate = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value != null)
      );

      // Converte strings numéricas para números
      if (filtersToValidate.minOverall) {
        filtersToValidate.minOverall = Number(filtersToValidate.minOverall);
      }
      if (filtersToValidate.maxOverall) {
        filtersToValidate.maxOverall = Number(filtersToValidate.maxOverall);
      }
      if (filtersToValidate.minValue) {
        filtersToValidate.minValue = Number(filtersToValidate.minValue);
      }
      if (filtersToValidate.maxValue) {
        filtersToValidate.maxValue = Number(filtersToValidate.maxValue);
      }

      const validatedFilters = filterSchema.parse(filtersToValidate);
      onApplyFilters(validatedFilters);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          variant: "destructive",
          title: "Erro nos filtros",
          description: firstError.message,
        });
      }
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    onApplyFilters({});
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md"
        aria-describedby="transfer-filters-desc"
      >
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <p id="transfer-filters-desc" className="sr-only">
          Filtros para refinar a busca de jogadores no mercado de
          transferências.
        </p>

        <ScrollArea className="h-[calc(100vh-10rem)] px-1">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="position">Posição</Label>
              <Select
                value={filters.position || "all"}
                onValueChange={handlePositionChange as (value: string) => void}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Overall</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="minOverall"
                    className="text-xs text-muted-foreground"
                  >
                    Mínimo
                  </Label>
                  <Input
                    id="minOverall"
                    type="number"
                    placeholder="Mín"
                    min={1}
                    max={99}
                    value={filters.minOverall || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minOverall: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="maxOverall"
                    className="text-xs text-muted-foreground"
                  >
                    Máximo
                  </Label>
                  <Input
                    id="maxOverall"
                    type="number"
                    placeholder="Máx"
                    min={1}
                    max={99}
                    value={filters.maxOverall || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxOverall: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valor de Mercado</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="minValue"
                    className="text-xs text-muted-foreground"
                  >
                    Mínimo
                  </Label>
                  <Input
                    id="minValue"
                    type="number"
                    placeholder="Mín"
                    min={0}
                    value={filters.minValue || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minValue: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="maxValue"
                    className="text-xs text-muted-foreground"
                  >
                    Máximo
                  </Label>
                  <Input
                    id="maxValue"
                    type="number"
                    placeholder="Máx"
                    min={0}
                    value={filters.maxValue || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxValue: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyFree"
                checked={filters.onlyFree || false}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyFree: checked === true,
                  }))
                }
              />
              <Label htmlFor="onlyFree">Apenas jogadores livres</Label>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClearFilters}
          >
            Limpar
          </Button>
          <Button className="flex-1" onClick={handleApplyFilters}>
            Aplicar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
