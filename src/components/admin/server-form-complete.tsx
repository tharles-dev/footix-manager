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
import { createServer } from "@/hooks/useApi";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label as UILabel } from "@/components/ui/label";

const formSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    max_members: z
      .number()
      .min(2, "Mínimo de 2 membros")
      .max(100, "Máximo de 100 membros"),
    season_length_days: z
      .number()
      .min(30, "Mínimo de 30 dias")
      .max(90, "Máximo de 90 dias"),
    entry_mode: z.enum(["public", "private"]),
    registration_start: z.date(),
    registration_deadline: z.date(),
    initial_budget: z.number().min(0, "Orçamento inicial deve ser positivo"),
    budget_growth_per_season: z
      .number()
      .min(0, "Crescimento deve ser positivo")
      .max(1, "Máximo de 100%"),
    salary_cap: z
      .number()
      .min(0, "Teto salarial deve ser positivo")
      .max(100, "Máximo de 100%"),
    salary_cap_penalty_percentage: z
      .number()
      .min(0, "Multa deve ser positiva")
      .max(1, "Máximo de 100%"),
    min_player_salary_percentage: z
      .number()
      .min(0, "Percentual mínimo deve ser positivo")
      .max(100, "Máximo de 100%"),
    max_player_salary_percentage: z
      .number()
      .min(0, "Percentual máximo deve ser positivo")
      .max(1000, "Máximo de 1000%"),
    enable_monetization: z.boolean(),
    activate_clause: z.boolean(),
    auto_clause_percentage: z
      .number()
      .min(100, "Mínimo de 100%")
      .max(1000, "Máximo de 1000%"),
    market_value_multiplier: z
      .number()
      .min(1, "Mínimo de 1x")
      .max(100, "Máximo de 100x"),
    transfer_window_open: z.boolean(),
    allow_free_agent_signing_outside_window: z.boolean(),
    match_frequency_minutes: z.number().min(60, "Mínimo de 60 minutos"),
    enable_auto_simulation: z.boolean(),
    red_card_penalty: z.number().min(0, "Multa deve ser positiva"),
    allow_penalty_waiver: z.boolean(),
  })
  .refine(
    (data) => {
      return data.registration_deadline > data.registration_start;
    },
    {
      message: "Prazo final deve ser posterior à data de início",
      path: ["registration_deadline"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  name: "",
  max_members: 20,
  season_length_days: 90,
  entry_mode: "public",
  registration_start: new Date(),
  registration_deadline: new Date(),
  initial_budget: 5000000,
  budget_growth_per_season: 0.1,
  salary_cap: 70,
  salary_cap_penalty_percentage: 0.1,
  min_player_salary_percentage: 80,
  max_player_salary_percentage: 150,
  enable_monetization: true,
  activate_clause: true,
  auto_clause_percentage: 200,
  market_value_multiplier: 10,
  transfer_window_open: true,
  allow_free_agent_signing_outside_window: false,
  match_frequency_minutes: 120,
  enable_auto_simulation: true,
  red_card_penalty: 10000,
  allow_penalty_waiver: true,
};

export function ServerFormComplete() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);

      const serverData = {
        ...data,
        registration_start: data.registration_start.toISOString(),
        registration_deadline: data.registration_deadline.toISOString(),
      };
      await createServer(serverData);
      toast({
        title: "Servidor criado com sucesso!",
        description: "O servidor foi criado e está pronto para uso.",
      });
      form.reset();
    } catch (error) {
      console.error("Erro ao criar servidor:", error);
      toast({
        title: "Erro ao criar servidor",
        description:
          error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

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
                    Configure as informações básicas do servidor
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
                            Número máximo de clubes permitidos (2-100)
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
                                  format(field.value, "PPP", {
                                    locale: ptBR,
                                  })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
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
                                  format(field.value, "PPP", {
                                    locale: ptBR,
                                  })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < form.getValues("registration_start")
                              }
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Economia */}
            <TabsContent value="economy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Orçamento e Economia</CardTitle>
                  <CardDescription>
                    Configure as opções de orçamento e economia do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <UILabel htmlFor="initial_budget">
                          Orçamento Inicial
                        </UILabel>
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
                        <UILabel htmlFor="budget_growth_per_season">
                          Crescimento do Orçamento por Temporada
                        </UILabel>
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
                        <UILabel htmlFor="salary_cap">
                          Teto Salarial (%)
                        </UILabel>
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
                        <UILabel htmlFor="salary_cap_penalty_percentage">
                          Percentual de Multa por Exceder Teto Salarial
                        </UILabel>
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
                        <UILabel htmlFor="min_player_salary_percentage">
                          Percentual Mínimo de Salário do Jogador
                        </UILabel>
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
                        <UILabel htmlFor="max_player_salary_percentage">
                          Percentual Máximo de Salário do Jogador
                        </UILabel>
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
                              <UILabel className="text-base">
                                Habilitar Monetização
                              </UILabel>
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
                    Configure as regras de mercado e salários do servidor
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
                            <UILabel className="text-base">
                              Cláusula de Rescisão
                            </UILabel>
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
                          <UILabel> % da Cláusula</UILabel>
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
                        <UILabel>Multiplicador de Valor de Mercado</UILabel>
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
                            <UILabel className="text-base">
                              Janela de Transferências Aberta
                            </UILabel>
                            <FormDescription>
                              Permite que os clubes realizem transferências
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
                            <UILabel className="text-base">
                              Permitir Contratação de Jogadores Livres Fora da
                              Janela
                            </UILabel>
                            <FormDescription>
                              Permite que os clubes contratem jogadores sem
                              clube mesmo fora da janela
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
                    Configure as opções de simulação do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="match_frequency_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <UILabel>Frequência de Partidas (minutos)</UILabel>
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
                          <UILabel className="text-base">
                            Simulação Automática
                          </UILabel>
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
                    Configure as penalidades do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="red_card_penalty"
                    render={({ field }) => (
                      <FormItem>
                        <UILabel>Multa por Cartão Vermelho</UILabel>
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
                          <UILabel className="text-base">
                            Permitir Isenção de Multas
                          </UILabel>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Servidor"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
