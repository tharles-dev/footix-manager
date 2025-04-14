"use client";
import { ServerFormEdit } from "@/components/admin/server-form-edit";
import { useServer } from "@/hooks/useApi";
import { notFound } from "next/navigation";
import { ServerData } from "@/hooks/useApi";

interface EditServerPageProps {
  params: {
    id: string;
  };
}

export default function EditServerPage({ params }: EditServerPageProps) {
  const { server, loading, error } = useServer(params.id);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error || !server) {
    notFound();
  }

  console.log(server);

  // Converter dados do servidor para o formato esperado pelo formulário
  const formattedServer: ServerData = {
    name: server.name,
    max_members: server.max_members,
    season_length_days: server.season_length_days || 45,
    entry_mode: server.entry_mode || "public",
    registration_deadline: server.registration_deadline,
    current_season_start: server.current_season_start,
    current_season_end: server.current_season_end,
    registration_start: server.registration_start,
    transfer_window_open: server.transfer_window_open || false,
    transfer_window_start: server.transfer_window_start,
    transfer_window_end: server.transfer_window_end,
    initial_budget: server.initial_budget,
    budget_growth_per_season: server.budget_growth_per_season,
    salary_cap: server.salary_cap,
    salary_cap_penalty_percentage: server.salary_cap_penalty_percentage,
    min_player_salary_percentage: server.min_player_salary_percentage,
    max_player_salary_percentage: server.max_player_salary_percentage,
    activate_clause: server.activate_clause,
    auto_clause_percentage: server.auto_clause_percentage,
    market_value_multiplier: server.market_value_multiplier,
    enable_monetization: server.enable_monetization,
    match_frequency_minutes: server.match_frequency_minutes,
    enable_auto_simulation: server.enable_auto_simulation,
    red_card_penalty: server.red_card_penalty || 50000,
    allow_penalty_waiver: server.allow_penalty_waiver || true,
    players_source: server.players_source,
  };

  console.log(formattedServer);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Editar Servidor</h1>
      <ServerFormEdit serverId={params.id} initialData={formattedServer} />
    </div>
  );
}
