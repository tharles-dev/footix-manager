"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: "admin" | "user";
}

export interface Server {
  id: string;
  name: string;
  status: "inscricao" | "andamento" | "finalizada";
  season: number;
  initial_budget: number;
  salary_cap: number;
  min_player_salary_percentage: number;
  max_player_salary_percentage: number;
  current_members: number;
  max_members: number;
  market_value_multiplier: number;
  auto_clause_percentage: number;
  activate_clause: boolean;
}

export interface Club {
  id: string;
  name: string;
  logo_url?: string;
  city: string;
  country: string;
  balance: number;
  division: string;
  reputation: number;
  fan_base: number;
  season_budget_base: number;
  season_expenses: number;
  server_id: string;
  financial_info: {
    salary_cap: number;
    current_total_salaries: number;
    salary_cap_remaining: number;
    transfer_window_open: boolean;
  };
}

interface AppContextType {
  user: User | null;
  server: Server | null;
  club: Club | null;
  setUser: (user: User | null) => void;
  setServer: (server: Server | null) => void;
  setClub: (club: Club | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [server, setServer] = useState<Server | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <AppContext.Provider
      value={{
        user,
        server,
        club,
        setUser,
        setServer,
        setClub,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
