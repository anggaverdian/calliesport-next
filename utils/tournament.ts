// Tournament types and utilities

export type TeamType = "standard" | "mix" | "team" | "mexicano";

export interface Tournament {
  id: string;
  name: string;
  teamType: TeamType;
  pointType: string;
  players: string[];
  createdAt: string;
}

// Team type display names
export const teamTypeNames: Record<TeamType, string> = {
  standard: "Standard Americano",
  mix: "Mix Americano",
  team: "Team Americano",
  mexicano: "Standard Mexicano",
};

// Calculate total rounds based on player count
export function calculateRounds(playerCount: number): number {
  const roundsMap: Record<number, number> = {
    4: 6,
    5: 10,
    6: 15,
    7: 21,
    8: 14,
    9: 18,
    10: 15,
    11: 22,
    12: 33,
  };
  return roundsMap[playerCount] || 0;
}

// Local storage key
const STORAGE_KEY = "calliesport_tournaments";

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Get all tournaments from localStorage
export function getTournaments(): Tournament[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save a new tournament
export function saveTournament(tournament: Omit<Tournament, "id" | "createdAt">): Tournament {
  const tournaments = getTournaments();
  const newTournament: Tournament = {
    ...tournament,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  tournaments.push(newTournament);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  return newTournament;
}

// Delete a tournament by id
export function deleteTournament(id: string): void {
  const tournaments = getTournaments();
  const filtered = tournaments.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
