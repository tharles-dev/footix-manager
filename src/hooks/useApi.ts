import { useState, useEffect } from "react";
import {
  serversService,
  competitionsService,
  usersService,
} from "@/lib/api/services";
import { Server, Competition, User, UserProfile } from "@/lib/api/services";

export function useServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        const data = await serversService.getAll();
        setServers(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao carregar servidores")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  return { servers, loading, error };
}

export function useServer(id: string) {
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServer = async () => {
      try {
        setLoading(true);
        const data = await serversService.getById(id);
        setServer(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao carregar servidor")
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchServer();
    }
  }, [id]);

  return { server, loading, error };
}

export function useCompetitions(serverId: string) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const data = await competitionsService.getAll(serverId);
        setCompetitions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao carregar competições")
        );
      } finally {
        setLoading(false);
      }
    };

    if (serverId) {
      fetchCompetitions();
    }
  }, [serverId]);

  return { competitions, loading, error };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await usersService.getAll();
        setUsers(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao carregar usuários")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await usersService.getProfile();
        setProfile(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao carregar perfil")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
}

interface Settings {
  server_name?: string;
  region?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  security?: {
    two_factor?: boolean;
    active_sessions?: number;
  };
  database?: {
    auto_backup?: boolean;
    last_backup?: string;
  };
  permissions?: {
    access_level?: string;
    roles?: string[];
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        // TODO: Substituir pela chamada real da API
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error("Falha ao carregar configurações");
        }
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading, error };
}

export type ServerData = {
  name: string;
  max_members: number;
  season_length_days: number;
  entry_mode: "public" | "private";
  registration_deadline?: string;
  current_season_start?: string;
  current_season_end?: string;
  registration_start?: string;
  transfer_window_open: boolean;
  allow_free_agent_signing_outside_window: boolean;
  initial_budget: number;
  budget_growth_per_season: number;
  salary_cap: number;
  salary_cap_penalty_percentage: number;
  min_player_salary_percentage: number;
  max_player_salary_percentage: number;
  activate_clause: boolean;
  auto_clause_percentage: number;
  market_value_multiplier: number;
  enable_monetization: boolean;
  match_frequency_minutes: number;
  enable_auto_simulation: boolean;
  red_card_penalty: number;
  allow_penalty_waiver: boolean;
  players_source?: string;
};

export type CreateServerData = ServerData;
export type ServerEditData = ServerData;

export async function createServer(data: CreateServerData) {
  const response = await fetch("/api/admin/servers/manual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao criar servidor");
  }

  return response.json();
}

export async function updateServer(id: string, data: ServerEditData) {
  const response = await fetch(`/api/admin/servers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao atualizar servidor");
  }

  return response.json();
}

export async function deleteServer(id: string) {
  const response = await fetch(`/api/admin/servers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao excluir servidor");
  }

  return response.json();
}
