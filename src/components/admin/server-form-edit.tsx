"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { updateServer } from "@/hooks/useApi";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

// Schema completo para edição de servidor
const serverFormSchema = z.object({
  // Informações básicas
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  max_members: z.number().min(2).max(64),
  season_length_days: z.number().min(30).max(90),
  entry_mode: z.enum(["public", "private"]),

  // Orçamento e economia
  initial_budget: z.number().min(1000000),
  budget_growth_per_season: z.number().min(0).max(1),
  salary_cap: z.number().min(0).max(100),
  salary_cap_penalty_percentage: z.number().min(0).max(1),
  enable_monetization: z.boolean(),

  // Regras de mercado e salários
  min_player_salary_percentage: z.number().min(1).max(100),
  max_player_salary_percentage: z.number().min(100).max(500),
  activate_clause: z.boolean(),
  auto_clause_percentage: z.number().min(100).max(1000),
  market_value_multiplier: z.number().min(1).max(100),
  allow_free_agent_signing_outside_window: z.boolean(),
  transfer_window_open: z.boolean(),

  // Simulação
  match_frequency_minutes: z.number().min(60),
  enable_auto_simulation: z.boolean(),

  // Penalidades
  red_card_penalty: z.number().min(0),
  allow_penalty_waiver: z.boolean(),

  // Datas
  registration_start: z.string().optional(),
  registration_deadline: z.string().optional(),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

interface ServerFormEditProps {
  serverId: string;
  initialData: ServerFormValues;
}

export function ServerFormEdit({ serverId, initialData }: ServerFormEditProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      ...initialData,
      registration_start: initialData.registration_start
        ? initialData.registration_start.toString()
        : undefined,
      registration_deadline: initialData.registration_deadline
        ? initialData.registration_deadline.toString()
        : undefined,
    },
  });

  const onSubmit = (data: ServerFormValues) => {
    const serverData = {
      ...data,
      registration_start: data.registration_start
        ? new Date(data.registration_start).toISOString()
        : undefined,
      registration_deadline: data.registration_deadline
        ? new Date(data.registration_deadline).toISOString()
        : undefined,
    };

    setIsSubmitting(true);
    updateServer(serverId, serverData)
      .then(() => {
        toast({
          title: "Servidor atualizado com sucesso!",
          description: "As alterações foram salvas.",
        });
        router.push("/admin/servers");
      })
      .catch((error) => {
        toast({
          title: "Erro ao atualizar servidor",
          description:
            error instanceof Error
              ? error.message
              : "Tente novamente mais tarde",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="container mx-auto py-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="economy">Economia</TabsTrigger>
              <TabsTrigger value="market">Mercado</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            {/* Aba Básico */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Edite as informações básicas do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Servidor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Servidor 01" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nome único que identifica o servidor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="max_members"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo de Membros</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Número máximo de clubes permitidos (2-64)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="season_length_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração da Temporada (dias)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Duração da temporada em dias (30-90)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="entry_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo de Entrada</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o modo de entrada" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Público</SelectItem>
                            <SelectItem value="private">Privado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Define se o servidor é público ou privado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Datas</CardTitle>
                  <CardDescription>
                    Edite as datas importantes do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="registration_start"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Início das Inscrições</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP", {
                                      locale: ptBR,
                                    })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Data de início das inscrições
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registration_deadline"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Prazo Final das Inscrições</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP", {
                                      locale: ptBR,
                                    })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const registrationStart =
                                    form.getValues("registration_start");
                                  return registrationStart
                                    ? date < new Date(registrationStart)
                                    : false;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Data limite para inscrições
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Economia */}
            <TabsContent value="economy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Orçamento e Economia</CardTitle>
                  <CardDescription>
                    Edite as opções de orçamento e economia do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="initial_budget">
                          Orçamento Inicial
                        </Label>
                        <Input
                          id="initial_budget"
                          type="number"
                          placeholder="5.000.000"
                          {...form.register("initial_budget", {
                            valueAsNumber: true,
                          })}
                        />
                        <p className="text-sm text-muted-foreground">
                          Orçamento inicial para cada clube
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget_growth_per_season">
                          Crescimento do Orçamento por Temporada
                        </Label>
                        <Input
                          id="budget_growth_per_season"
                          type="number"
                          step="0.01"
                          placeholder="0.1"
                          {...form.register("budget_growth_per_season", {
                            valueAsNumber: true,
                          })}
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual de crescimento do orçamento a cada
                          temporada
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary_cap">Teto Salarial (%)</Label>
                        <Input
                          id="salary_cap"
                          type="number"
                          placeholder="70"
                          {...form.register("salary_cap", {
                            valueAsNumber: true,
                          })}
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual máximo do orçamento que pode ser gasto com
                          salários
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary_cap_penalty_percentage">
                          Percentual de Multa por Exceder Teto Salarial
                        </Label>
                        <Input
                          id="salary_cap_penalty_percentage"
                          type="number"
                          step="0.01"
                          placeholder="0.1"
                          {...form.register("salary_cap_penalty_percentage", {
                            valueAsNumber: true,
                          })}
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual de multa aplicado quando o teto salarial é
                          excedido
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min_player_salary_percentage">
                          Percentual Mínimo de Salário do Jogador
                        </Label>
                        <Input
                          id="min_player_salary_percentage"
                          type="number"
                          placeholder="80"
                          {...form.register("min_player_salary_percentage", {
                            valueAsNumber: true,
                          })}
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual mínimo do valor de mercado que pode ser
                          oferecido como salário
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_player_salary_percentage">
                          Percentual Máximo de Salário do Jogador
                        </Label>
                        <Input
                          id="max_player_salary_percentage"
                          type="number"
                          placeholder="150"
                          {...form.register("max_player_salary_percentage", {
                            valueAsNumber: true,
                          })}
                        />
                        <p className="text-sm text-muted-foreground">
                          Percentual máximo do valor de mercado que pode ser
                          oferecido como salário
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="enable_monetization"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Habilitar Monetização
                              </FormLabel>
                              <FormDescription>
                                Permite que os clubes ganhem dinheiro com
                                ingressos, sócios e merchandising
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Mercado */}
            <TabsContent value="market" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Mercado e Salários</CardTitle>
                  <CardDescription>
                    Edite as regras de mercado e salários do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="activate_clause"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Cláusula de Rescisão
                            </FormLabel>
                            <FormDescription>
                              Ativar cláusulas de rescisão automáticas
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="auto_clause_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% da Cláusula</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Percentual do valor de mercado para cláusula
                            (100-1000)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="market_value_multiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multiplicador de Valor de Mercado</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Multiplicador aplicado ao valor base dos jogadores
                          (1-100)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transfer_window_open"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Janela de Transferências
                            </FormLabel>
                            <FormDescription>
                              Ativar janela de transferências
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allow_free_agent_signing_outside_window"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Permitir Contratação de Jogadores Livres
                            </FormLabel>
                            <FormDescription>
                              Permitir contratação de jogadores livres fora da
                              janela
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Avançado */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Simulação</CardTitle>
                  <CardDescription>
                    Edite as opções de simulação do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="match_frequency_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência de Partidas (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Intervalo entre partidas em minutos (mínimo 60)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enable_auto_simulation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Simulação Automática
                          </FormLabel>
                          <FormDescription>
                            Ativar simulação automática de partidas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Penalidades</CardTitle>
                  <CardDescription>
                    Edite as penalidades do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="red_card_penalty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multa por Cartão Vermelho</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Valor da multa por cartão vermelho
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allow_penalty_waiver"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Permitir Isenção de Multas
                          </FormLabel>
                          <FormDescription>
                            Permitir que multas sejam isentadas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
