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
import { DialogClose } from "@/components/ui/dialog";

const serverFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  max_members: z.number().min(2).max(64),
  initial_budget: z.number().min(1000000),
  budget_growth_per_season: z.number().min(0).max(1),
  salary_cap: z.number().min(100000),
  salary_cap_penalty_percentage: z.number().min(0).max(1),
  min_player_salary_percentage: z.number().min(1).max(100),
  max_player_salary_percentage: z.number().min(100).max(500),
  activate_clause: z.boolean(),
  auto_clause_percentage: z.number().min(100).max(1000),
  market_value_multiplier: z.number().min(1).max(100),
  enable_monetization: z.boolean(),
  match_frequency_minutes: z.number().min(60),
  enable_auto_simulation: z.boolean(),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

const defaultValues: Partial<ServerFormValues> = {
  max_members: 64,
  initial_budget: 5000000,
  budget_growth_per_season: 0.1,
  salary_cap: 3500000,
  salary_cap_penalty_percentage: 0.1,
  min_player_salary_percentage: 80,
  max_player_salary_percentage: 150,
  activate_clause: true,
  auto_clause_percentage: 200,
  market_value_multiplier: 24,
  enable_monetization: false,
  match_frequency_minutes: 1440,
  enable_auto_simulation: true,
};

export function ServerForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues,
  });

  async function onSubmit(data: ServerFormValues) {
    try {
      setLoading(true);
      await createServer(data);
      toast({
        title: "Servidor criado com sucesso!",
        description: "O servidor foi criado e está pronto para uso.",
      });
      form.reset();
    } catch (error) {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
          name="initial_budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orçamento Inicial</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Orçamento inicial dos clubes (mínimo 1.000.000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget_growth_per_season"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crescimento do Orçamento por Temporada</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Percentual de crescimento do orçamento por temporada (0-1)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salary_cap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teto Salarial</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Limite máximo de gastos com salários (mínimo 100.000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salary_cap_penalty_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Multa por Ultrapassar Teto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Percentual de multa por ultrapassar o teto salarial (0-1)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_player_salary_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% Mínima de Salário</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Percentual mínimo do valor de mercado para salário (1-100)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_player_salary_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% Máxima de Salário</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Percentual máximo do valor de mercado para salário (100-500)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Percentual do valor de mercado para cláusula (100-1000)
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
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Multiplicador aplicado ao valor base dos jogadores (1-100)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="enable_monetization"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Monetização</FormLabel>
                  <FormDescription>
                    Ativar sistema de monetização (ingressos, sócios, etc)
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
        </div>

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
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Intervalo entre partidas em minutos (mínimo 60)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar Servidor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
