export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: string;
  overall: number;
  form?: number;
  morale?: number;
}

export async function getSquadPlayers(clubId: string): Promise<Player[]> {
  try {
    const response = await fetch(`/api/club/${clubId}/players`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar jogadores");
    }

    const players = await response.json();
    return players;
  } catch (error) {
    console.error("Erro ao buscar jogadores:", error);
    return [];
  }
}
