"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  Edit,
} from "lucide-react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  has_scheduled_auction?: boolean;
  club?: {
    id: string;
    name: string;
    logo_url?: string;
  };
};

// Tipo para os leilões
type Auction = {
  id: string;
  player_id: string;
  starting_bid: number;
  scheduled_start_time: string;
  countdown_minutes: number;
  status: "scheduled" | "active" | "completed";
  player: Player;
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
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [scheduledAuctions, setScheduledAuctions] = useState<Auction[]>([]);

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
  const fetchAvailablePlayers = useCallback(
    async (filter: "all" | "scheduled" | "available" = "all") => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/servers/${
            params.id
          }/players/available?page=${page}&limit=${limit}${
            search ? `&search=${search}` : ""
          }${selectedPosition ? `&position=${selectedPosition}` : ""}`,
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

        // Buscar leilões agendados para verificar quais jogadores já têm agendamento
        const auctionsResponse = await fetch(
          `/api/admin/servers/${params.id}/auctions?status=scheduled`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const auctionsData = await auctionsResponse.json();

        if (auctionsResponse.ok && auctionsData.data) {
          const scheduledPlayerIds = auctionsData.data.map(
            (auction: Auction) => auction.player_id
          );

          // Marcar jogadores que já têm leilão agendado
          const playersWithAuctionInfo = data.data.map((player: Player) => ({
            ...player,
            has_scheduled_auction: scheduledPlayerIds.includes(player.id),
          }));

          // Filtrar jogadores com base no parâmetro filter
          const filteredPlayers = playersWithAuctionInfo.filter(
            (player: Player) => {
              if (filter === "scheduled") return player.has_scheduled_auction;
              if (filter === "available") return !player.has_scheduled_auction;
              return true; // 'all' não aplica filtro
            }
          );

          setPlayers(filteredPlayers);
        } else {
          setPlayers(data.data);
        }

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

  // Buscar leilões agendados
  const fetchScheduledAuctions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/servers/${serverId}/auctions?status=scheduled`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar leilões agendados");
      }

      setScheduledAuctions(data.data || []);
    } catch (error) {
      console.error("Erro ao buscar leilões agendados:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao buscar leilões agendados",
        variant: "destructive",
      });
    }
  }, [serverId, toast]);

  // Carregar jogadores ao montar o componente
  useEffect(() => {
    fetchAvailablePlayers(currentFilter);
    fetchScheduledAuctions();
  }, [
    serverId,
    page,
    search,
    selectedPosition,
    currentFilter,
    fetchAvailablePlayers,
    fetchScheduledAuctions,
  ]);

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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

  // Função para formatar datas
  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Função para abrir o formulário de edição
  const handleEditAuction = async (auction: Auction) => {
    try {
      const response = await fetch(
        `/api/admin/servers/${serverId}/auctions/${auction.id}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar detalhes do leilão");
      }

      const { data } = await response.json();
      setEditingAuction(data);

      // Preencher o formulário com os dados do leilão
      form.setValue("player_id", data.player_id);
      form.setValue("starting_bid", data.starting_bid);
      form.setValue("is_scheduled", data.is_scheduled);
      form.setValue("countdown_minutes", data.countdown_minutes);

      // Usar a data exata que vem da API, sem conversão de fuso horário
      form.setValue(
        "scheduled_start_time",
        data.scheduled_start_time.slice(0, 16)
      );

      setIsDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar detalhes do leilão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do leilão",
        variant: "destructive",
      });
    }
  };

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: AuctionFormValues) => {
    try {
      // Usar a data exata do formulário, sem conversão de fuso horário
      const formattedData = {
        ...data,
        scheduled_start_time: data.scheduled_start_time,
      };

      const endpoint = editingAuction
        ? `/api/admin/servers/${serverId}/auctions/${editingAuction.id}`
        : `/api/admin/servers/${serverId}/auctions`;

      const method = editingAuction ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar leilão");
      }

      toast({
        title: "Sucesso",
        description: editingAuction
          ? "Leilão atualizado com sucesso"
          : "Leilão criado com sucesso",
      });

      setIsDialogOpen(false);
      setEditingAuction(null);
      form.reset();

      // Atualizar a lista de leilões e jogadores
      await Promise.all([
        fetchAvailablePlayers(currentFilter),
        fetchScheduledAuctions(),
      ]);
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

  // Função para abrir o formulário de criação
  const handleCreateAuction = (playerId: string) => {
    setEditingAuction(null);
    form.reset({
      player_id: playerId,
      starting_bid: 1000000,
      is_scheduled: true,
      scheduled_start_time: new Date().toISOString().slice(0, 16),
      countdown_minutes: 60,
    });
    setIsDialogOpen(true);
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
            ) : currentFilter === "scheduled" ? (
              scheduledAuctions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum leilão agendado encontrado
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scheduledAuctions.map((auction) => {
                    const player = auction.player;
                    const countryCode = player.nationality
                      ? getCountryCode(player.nationality)
                      : "BR";

                    return (
                      <Card key={auction.id} className="overflow-hidden">
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
                              <p className="text-muted-foreground">
                                Lance Inicial:
                              </p>
                              <p className="font-medium">
                                {formatCurrency(auction.starting_bid)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Início:</p>
                              <p className="font-medium">
                                {formatDate(auction.scheduled_start_time)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Duração:</p>
                              <p className="font-medium">
                                {auction.countdown_minutes} minutos
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
                        </CardContent>
                        <div className="p-4 pt-0">
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleEditAuction(auction)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogador livre encontrado
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
                        {player.has_scheduled_auction && (
                          <div className="mt-2 flex items-center text-xs text-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Leilão já agendado</span>
                          </div>
                        )}
                      </CardContent>
                      <div className="p-4 pt-0 flex justify-between">
                        <Button
                          className="w-full"
                          onClick={() => handleCreateAuction(player.id)}
                          disabled={player.has_scheduled_auction}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {player.has_scheduled_auction
                            ? "Já Agendado"
                            : "Agendar"}
                        </Button>
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
