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
