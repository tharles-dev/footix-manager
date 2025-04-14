"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PlayersService } from "@/lib/api/services/players";
import { useState, useEffect, useCallback, useMemo } from "react";
import { GlobalPlayer } from "@/lib/api/services/players";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

export default function PlayersPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [batchSize, setBatchSize] = useState(100);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<GlobalPlayer[]>([]);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const { toast } = useToast();
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryParams, setSalaryParams] = useState({
    min_overall: 1,
    max_overall: 99,
    base_salary: 10000,
    market_value_multiplier: 0.1,
  });

  const playersService = useMemo(() => new PlayersService(), []);

  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await playersService.getGlobalPlayers({
        page,
        limit: 20,
        position: position === "all" ? undefined : position,
        search: search || undefined,
      });

      setPlayers(response.players);
      setTotalPages(response.pagination.total_pages);
      setTotalPlayers(response.pagination.total);
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao carregar jogadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, position, search, toast, playersService]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset para primeira página ao buscar
  };

  const handlePositionChange = (value: string) => {
    setPosition(value);
    setPage(1); // Reset para primeira página ao mudar posição
  };

  const handleUpdateSalaries = async () => {
    try {
      setLoading(true);
      const response = await playersService.updateGlobalPlayersSalary({
        min_overall: salaryParams.min_overall,
        max_overall: salaryParams.max_overall,
        base_salary: salaryParams.base_salary,
        market_value_multiplier: salaryParams.market_value_multiplier,
      });

      toast({
        title: "Sucesso!",
        description: `${response.data.updated_players} jogadores tiveram seus salários atualizados.`,
      });

      // Recarrega a lista de jogadores
      loadPlayers();
    } catch (err) {
      console.error("Erro ao atualizar salários:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os salários dos jogadores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMinOverallChange = (value: number[]) => {
    setSalaryParams((prev) => ({ ...prev, min_overall: value[0] }));
  };

  const handleMaxOverallChange = (value: number[]) => {
    setSalaryParams((prev) => ({ ...prev, max_overall: value[0] }));
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "text/csv") {
        try {
          setIsImporting(true);
          setImportStatus("Importando jogadores...");
          setImportProgress(10);

          const formData = new FormData();
          formData.append("file", file);
          formData.append("batchSize", batchSize.toString());

          const response = await fetch("/api/admin/players/import", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            setImportProgress(100);
            setImportStatus("Importação concluída!");
            toast({
              title: "Sucesso",
              description: `${data.updated_count || 0} jogadores importados.`,
            });
            loadPlayers();
          } else {
            toast({
              title: "Erro",
              description: data.error || "Erro ao importar jogadores",
              variant: "destructive",
            });
          }
        } catch (error: unknown) {
          console.error("Erro ao importar CSV:", error);
          toast({
            title: "Erro",
            description: "Erro ao processar o arquivo",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
          setImportProgress(0);
          setImportStatus("");
        }
      } else {
        toast({
          title: "Erro",
          description: "Arquivo inválido. Por favor, selecione um arquivo CSV.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jogadores</h1>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="batchSize" className="text-sm">
                Tamanho do lote:
              </Label>
              <Input
                id="batchSize"
                type="number"
                min="10"
                max="500"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                className="w-20"
                disabled={isImporting}
              />
            </div>
            <div className="flex gap-2">
              <Dialog
                open={isSalaryModalOpen}
                onOpenChange={setIsSalaryModalOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Ajustar Salários</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajustar Salários dos Jogadores</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Overall Mínimo</Label>
                      <Slider
                        value={[salaryParams.min_overall]}
                        onValueChange={handleMinOverallChange}
                        min={1}
                        max={99}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">
                        {salaryParams.min_overall}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Overall Máximo</Label>
                      <Slider
                        value={[salaryParams.max_overall]}
                        onValueChange={handleMaxOverallChange}
                        min={1}
                        max={99}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">
                        {salaryParams.max_overall}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Salário Base (€)</Label>
                      <Input
                        type="number"
                        value={salaryParams.base_salary}
                        onChange={(e) =>
                          setSalaryParams((prev) => ({
                            ...prev,
                            base_salary: Number(e.target.value),
                          }))
                        }
                        min={1000}
                        step={1000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Multiplicador do Valor de Mercado (%)</Label>
                      <Input
                        type="number"
                        value={salaryParams.market_value_multiplier * 100}
                        onChange={(e) =>
                          setSalaryParams((prev) => ({
                            ...prev,
                            market_value_multiplier:
                              Number(e.target.value) / 100,
                          }))
                        }
                        min={1}
                        max={100}
                        step={1}
                      />
                    </div>
                    <Button onClick={handleUpdateSalaries} className="w-full">
                      Atualizar Salários
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button variant="outline" disabled={isImporting}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={importProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            {importStatus}{" "}
            {importProgress > 0 && importProgress < 100
              ? `${importProgress}%`
              : ""}
          </p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogadores..."
            className="pl-8"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select value={position} onValueChange={handlePositionChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Posição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="GK">Goleiro</SelectItem>
            <SelectItem value="CB">Zagueiro</SelectItem>
            <SelectItem value="LB">Lateral Esquerdo</SelectItem>
            <SelectItem value="RB">Lateral Direito</SelectItem>
            <SelectItem value="DMF">Volante</SelectItem>
            <SelectItem value="CMF">Meio-campo</SelectItem>
            <SelectItem value="AMF">Meia-atacante</SelectItem>
            <SelectItem value="LMF">Meia Esquerdo</SelectItem>
            <SelectItem value="RMF">Meia Direito</SelectItem>
            <SelectItem value="LWF">Ponta Esquerda</SelectItem>
            <SelectItem value="RWF">Ponta Direita</SelectItem>
            <SelectItem value="SS">Segundo Atacante</SelectItem>
            <SelectItem value="CF">Atacante</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? // Estado de carregamento
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          : // Lista de jogadores
            players.map((player) => (
              <Card key={player.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{player.name}</h3>
                    <Badge variant="outline">{player.position}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Idade:</span>{" "}
                      {player.age} anos
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Nacionalidade:
                      </span>{" "}
                      {player.nationality}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor:</span>{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(player.base_value)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salário:</span>{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(player.base_salary)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Overall:</span>{" "}
                      {player.overall}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Potential:</span>{" "}
                      {player.potential}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pace:</span>{" "}
                      {player.pace}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shooting:</span>{" "}
                      {player.shooting}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Passing:</span>{" "}
                      {player.passing}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dribbling:</span>{" "}
                      {player.dribbling}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Defending:</span>{" "}
                      {player.defending}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Physical:</span>{" "}
                      {player.physical}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Paginação */}
      {!loading && players.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total de {totalPlayers} jogadores
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Página {page} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
