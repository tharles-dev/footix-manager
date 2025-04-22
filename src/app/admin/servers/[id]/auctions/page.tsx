"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Eye, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCountryCode } from "@/lib/utils/country";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Resolver } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

// Tipos para os jogadores
type Player = {
  id: string;
  name: string;
  position: string;
  nationality: string;
  age: number;
  overall: number;
  potential: number;
  value: number;
  club?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  auction_status: "free" | "scheduled" | "active";
  auction?: {
    id: string;
    status: string;
    scheduled_start_time: string;
    starting_bid: number;
    countdown_minutes: number;
  };
};

// Schema de validação para o formulário de leilão
const formSchema = z.object({
  player_id: z.string(),
  starting_bid: z.number().min(1, "Lance inicial deve ser maior que 0"),
  is_scheduled: z.boolean().default(true),
  countdown_minutes: z.number().min(1, "Duração deve ser maior que 0"),
  scheduled_start_time: z.string().refine((date) => {
    try {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }, "Data inválida"),
});

type AuctionFormValues = z.infer<typeof formSchema>;

export default function ServerAuctionsPage() {
  const params = useParams();
  const serverId = params.id as string;
  const { toast } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search] = useState("");
  const [selectedPosition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<
    "all" | "scheduled" | "available"
  >("all");
  const [editingAuction, setEditingAuction] = useState<Player | null>(null);

  // Inicializar o formulário
  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(formSchema) as Resolver<AuctionFormValues>,
    defaultValues: {
      starting_bid: 1000000,
      is_scheduled: true,
      countdown_minutes: 60,
    },
  });

  // Buscar jogadores disponíveis
  const fetchPlayers = useCallback(
    async (filter: "all" | "scheduled" | "available" = "all") => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/servers/${
            params.id
          }/players/available?page=${page}&limit=${limit}${
            search ? `&search=${search}` : ""
          }${selectedPosition ? `&position=${selectedPosition}` : ""}${
            filter !== "all"
              ? `&type=${filter === "scheduled" ? "scheduled" : "free"}`
              : ""
          }`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao buscar jogadores");
        }

        setPlayers(data.data);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error("Erro ao buscar jogadores:", error);
        toast({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Erro ao buscar jogadores disponíveis",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [params.id, page, limit, search, selectedPosition, toast]
  );

  // Efeito para buscar jogadores quando os filtros mudarem
  useEffect(() => {
    fetchPlayers(currentFilter);
  }, [fetchPlayers, currentFilter, page]);

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Formatar data
  const formatDate = (date: string) => {
    return formatInTimeZone(
      new Date(date),
      "America/Sao_Paulo",
      "dd/MM/yyyy HH:mm",
      { locale: ptBR }
    );
  };

  // Função para lidar com a edição de um leilão
  const handleEditAuction = (player: Player) => {
    if (player.auction) {
      setEditingAuction(player);
      form.setValue("player_id", player.id);
      form.setValue("starting_bid", player.auction.starting_bid);
      form.setValue("countdown_minutes", player.auction.countdown_minutes);

      // Converter a data UTC do backend para o formato local
      const utcDate = new Date(player.auction.scheduled_start_time);
      const localFormattedDate = formatInTimeZone(
        utcDate,
        "America/Sao_Paulo",
        "yyyy-MM-dd'T'HH:mm"
      );
      form.setValue("scheduled_start_time", localFormattedDate);

      setIsDialogOpen(true);
    }
  };

  // Função para lidar com o agendamento de um novo leilão
  const handleScheduleAuction = (player: Player) => {
    setEditingAuction(null);
    form.setValue("player_id", player.id);
    form.setValue("starting_bid", player.value || 1000000);
    form.setValue("countdown_minutes", 60);

    // Definir data e hora atual como padrão (sem adicionar 1 hora)
    const now = new Date();
    // Formatar para o formato esperado pelo input datetime-local (YYYY-MM-DDThh:mm)
    const formattedDate = formatInTimeZone(
      now,
      "America/Sao_Paulo",
      "yyyy-MM-dd'T'HH:mm"
    );
    form.setValue("scheduled_start_time", formattedDate);

    setIsDialogOpen(true);
  };

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: AuctionFormValues) => {
    try {
      const isEditing = editingAuction !== null;
      const url = `/api/admin/servers/${serverId}/auctions${
        isEditing && editingAuction.auction
          ? `/${editingAuction.auction.id}`
          : ""
      }`;

      // Converter a data local para UTC antes de enviar
      const localDate = new Date(data.scheduled_start_time);
      const utcDate = formatInTimeZone(
        localDate,
        "UTC",
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
      );

      // Criar uma cópia dos dados com a data em UTC
      const dataToSend = {
        ...data,
        scheduled_start_time: utcDate,
      };

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao salvar leilão");
      }

      toast({
        title: "Sucesso",
        description: isEditing
          ? "Leilão atualizado com sucesso"
          : "Leilão criado com sucesso",
      });

      setIsDialogOpen(false);
      setEditingAuction(null);
      form.reset();
      fetchPlayers(currentFilter);
    } catch (error) {
      console.error("Erro ao salvar leilão:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao salvar leilão",
        variant: "destructive",
      });
    }
  };

  // Função para determinar a cor do badge de overall
  const getOverallColor = (overall: number) => {
    if (overall >= 90) return "bg-purple-500";
    if (overall >= 85) return "bg-red-500";
    if (overall >= 80) return "bg-orange-500";
    if (overall >= 75) return "bg-yellow-500";
    if (overall >= 70) return "bg-green-500";
    return "bg-blue-500";
  };

  // Função para determinar a cor do badge de posição
  const getPositionColor = (position: string) => {
    switch (position) {
      case "GK":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "CB":
      case "LB":
      case "RB":
        return "bg-green-100 text-green-800 border-green-300";
      case "DMF":
      case "CMF":
      case "LMF":
      case "RMF":
      case "AMF":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "SS":
      case "CF":
      case "LWF":
      case "RWF":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Jogadores Livres</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={currentFilter === "all" ? "default" : "outline"}
                onClick={() => setCurrentFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={currentFilter === "available" ? "default" : "outline"}
                onClick={() => setCurrentFilter("available")}
              >
                Disponíveis
              </Button>
              <Button
                variant={currentFilter === "scheduled" ? "default" : "outline"}
                onClick={() => setCurrentFilter("scheduled")}
              >
                Agendados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogador encontrado
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => {
                  const countryCode = player.nationality
                    ? getCountryCode(player.nationality)
                    : "BR";

                  return (
                    <Card key={player.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={`/assets/flags/${countryCode.toLowerCase()}.svg`}
                              alt={player.nationality || "Brasil"}
                            />
                            <AvatarFallback>{countryCode}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">
                                {player.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge
                                variant="outline"
                                className={getPositionColor(player.position)}
                              >
                                {player.position}
                              </Badge>
                              {player.age && (
                                <>
                                  <span>•</span>
                                  <span>{player.age} anos</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge
                              className={`${getOverallColor(
                                player.overall
                              )} text-white text-lg`}
                            >
                              {player.overall}
                            </Badge>
                            {player.potential &&
                              player.potential > player.overall && (
                                <div className="flex items-center text-xs text-green-600 mt-1">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  <span>
                                    +{player.potential - player.overall}
                                  </span>
                                </div>
                              )}
                            {player.potential &&
                              player.potential < player.overall && (
                                <div className="flex items-center text-xs text-red-600 mt-1">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  <span>
                                    {player.potential - player.overall}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Valor:</p>
                            <p className="font-medium">
                              {formatCurrency(player.value || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Clube:</p>
                            <p className="font-medium truncate">
                              {player.club ? player.club.name : "Livre"}
                            </p>
                          </div>
                        </div>
                        {player.auction_status === "scheduled" &&
                          player.auction && (
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">
                                  Lance Inicial:
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(player.auction.starting_bid)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Início:</p>
                                <p className="font-medium">
                                  {formatDate(
                                    player.auction.scheduled_start_time
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Duração:
                                </p>
                                <p className="font-medium">
                                  {player.auction.countdown_minutes} minutos
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status:</p>
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800 border-amber-300"
                                >
                                  Agendado
                                </Badge>
                              </div>
                            </div>
                          )}
                        {player.auction_status === "active" &&
                          player.auction && (
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">
                                  Lance Inicial:
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(player.auction.starting_bid)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status:</p>
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800 border-green-300"
                                >
                                  Ativo
                                </Badge>
                              </div>
                            </div>
                          )}
                      </CardContent>
                      <div className="p-4 pt-0 flex justify-between">
                        {player.auction_status === "scheduled" &&
                        player.auction ? (
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleEditAuction(player)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() =>
                              player.auction_status === "free"
                                ? handleScheduleAuction(player)
                                : handleEditAuction(player)
                            }
                            disabled={player.auction_status !== "free"}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {player.auction_status !== "free"
                              ? "Já Agendado"
                              : "Agendar"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingAuction ? "Editar Leilão" : "Agendar Novo Leilão"}
            </DialogTitle>
            <DialogDescription>
              {editingAuction
                ? "Edite as informações do leilão agendado"
                : "Preencha as informações para agendar um novo leilão"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="player_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jogador</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um jogador" />
                        </SelectTrigger>
                        <SelectContent>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.name} - {player.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="starting_bid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lance Inicial (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100.000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_scheduled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled
                      />
                    </FormControl>
                    <FormLabel>Agendar Leilão</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e Hora de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countdown_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração do Leilão (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                {editingAuction ? "Atualizar Leilão" : "Agendar Leilão"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
