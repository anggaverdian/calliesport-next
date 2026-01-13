// Tournament types and utilities

export type TeamType = "standard" | "mix" | "team" | "mexicano";

export interface Tournament {
  id: string;
  name: string;
  teamType: TeamType;
  pointType: string;
  players: string[];
  rounds: Round[];
  createdAt: string;
}

export interface Match {
  id: string;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  isCompleted: boolean;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  restingPlayers: string[];
}

// Team type display names
export const teamTypeNames: Record<TeamType, string> = {
  standard: "Standard Americano",
  mix: "Mix Americano",
  team: "Team Americano",
  mexicano: "Standard Mexicano",
};

// Player limits
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;

// Calculate total rounds based on player count
export function calculateRounds(playerCount: number): number {
  const roundsMap: Record<number, number> = {
    4: 6,
    5: 10,
    6: 15,
    7: 21,
    8: 14,
    9: 18,
    10: 25,
    11: 22,
    12: 33,
  };
  return roundsMap[playerCount] || 0;
}

// Get max score based on point type
export function getMaxScore(pointType: string): number {
  switch (pointType) {
    case "21":
      return 21;
    case "16":
      return 16;
    case "best4":
      return 4;
    case "best5":
      return 5;
    default:
      return 21;
  }
}

// Local storage key
const STORAGE_KEY = "calliesport_tournaments";

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Generate all possible pairings (for Americano/Round Robin)
function generateAllPairings(players: string[]): [string, string][] {
  const pairings: [string, string][] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairings.push([players[i], players[j]]);
    }
  }
  return pairings;
}

// Generate all possible matches (team vs team)
function generateAllMatches(players: string[]): Match[] {
  const pairings = generateAllPairings(players);
  const matches: Match[] = [];

  // Create matches from all valid team combinations
  for (let i = 0; i < pairings.length; i++) {
    for (let j = i + 1; j < pairings.length; j++) {
      const teamA = pairings[i];
      const teamB = pairings[j];

      // Ensure no player is on both teams
      const allPlayers = [...teamA, ...teamB];
      const uniquePlayers = new Set(allPlayers);

      if (uniquePlayers.size === 4) {
        matches.push({
          id: generateId(),
          teamA: [...teamA],
          teamB: [...teamB],
          scoreA: 0,
          scoreB: 0,
          isCompleted: false,
        });
      }
    }
  }

  return matches;
}

// Generate a unique key for a team pairing (order-independent)
function getTeamKey(team: string[]): string {
  return [...team].sort().join("+");
}

// Shuffle array randomly (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  // Create a copy so we don't modify the original array
  const shuffled = [...array];

  // Loop from the last element to the second element
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // Swap the current element with the random element
    const temp = shuffled[i];
    shuffled[i] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }

  return shuffled;
}

// Generate tournament rounds with balanced pairing and fair rest times
export function generateTournamentRounds(players: string[]): Round[] {
  const totalRounds = calculateRounds(players.length);

  if (totalRounds === 0 || players.length < 4) {
    return [];
  }

  // Shuffle players randomly so round 1 is not always the same
  const shuffledPlayers = shuffleArray(players);

  // Generate all possible unique matches as templates (using shuffled players)
  const allMatchTemplates = generateAllMatches(shuffledPlayers);

  // Track play count and last played round for each player
  const playCount: Record<string, number> = {};
  const lastPlayedRound: Record<string, number> = {};
  // Track when each team pairing last played together
  const teamLastPlayed: Record<string, number> = {};

  // Initialize tracking (using shuffled players)
  shuffledPlayers.forEach(player => {
    playCount[player] = 0;
    lastPlayedRound[player] = -Infinity; // Never played
  });

  const selectedMatches: Match[] = [];

  // Available match pool - copy of templates, will be refilled when exhausted
  let availableMatches = [...allMatchTemplates];

  // Select matches one by one for fair rest time ordering
  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    // If pool is empty, refill it
    if (availableMatches.length === 0) {
      availableMatches = [...allMatchTemplates];
    }

    // Find the best match from available pool
    let bestMatchIndex = -1;
    let bestScore = Infinity;

    for (let i = 0; i < availableMatches.length; i++) {
      const match = availableMatches[i];
      const matchPlayers = [...match.teamA, ...match.teamB];

      // Check team pairing rest (avoid same team playing consecutively)
      const teamAKey = getTeamKey(match.teamA);
      const teamBKey = getTeamKey(match.teamB);
      const teamALastPlayed = teamLastPlayed[teamAKey] ?? -Infinity;
      const teamBLastPlayed = teamLastPlayed[teamBKey] ?? -Infinity;
      const minTeamRest = Math.min(
        roundIndex - teamALastPlayed,
        roundIndex - teamBLastPlayed
      );

      // Skip if either team just played in the previous round
      if (minTeamRest <= 1 && roundIndex > 0) {
        continue;
      }

      // Calculate player rest time (minimum among all 4 players)
      let minPlayerRest = Infinity;
      let totalPlayCount = 0;

      for (const player of matchPlayers) {
        totalPlayCount += playCount[player];
        const restTime = roundIndex - lastPlayedRound[player];
        if (restTime < minPlayerRest) {
          minPlayerRest = restTime;
        }
      }

      // Score formula:
      // 1. Primary: prioritize players with lowest total play count
      // 2. Secondary: prioritize matches where players have rested more (negative = better)
      const score = totalPlayCount * 100 - minPlayerRest;

      if (score < bestScore) {
        bestScore = score;
        bestMatchIndex = i;
      }
    }

    // If no valid match found (all teams just played), relax the constraint
    if (bestMatchIndex === -1) {
      bestScore = Infinity;
      for (let i = 0; i < availableMatches.length; i++) {
        const match = availableMatches[i];
        const matchPlayers = [...match.teamA, ...match.teamB];

        let minPlayerRest = Infinity;
        let totalPlayCount = 0;

        for (const player of matchPlayers) {
          totalPlayCount += playCount[player];
          const restTime = roundIndex - lastPlayedRound[player];
          if (restTime < minPlayerRest) {
            minPlayerRest = restTime;
          }
        }

        const score = totalPlayCount * 100 - minPlayerRest;

        if (score < bestScore) {
          bestScore = score;
          bestMatchIndex = i;
        }
      }
    }

    if (bestMatchIndex !== -1) {
      const bestMatch = availableMatches[bestMatchIndex];

      // Remove selected match from available pool
      availableMatches.splice(bestMatchIndex, 1);

      // Add the selected match with new ID
      selectedMatches.push({
        id: generateId(),
        teamA: [...bestMatch.teamA],
        teamB: [...bestMatch.teamB],
        scoreA: 0,
        scoreB: 0,
        isCompleted: false,
      });

      // Update tracking for players in this match
      const matchPlayers = [...bestMatch.teamA, ...bestMatch.teamB];
      for (const player of matchPlayers) {
        playCount[player]++;
        lastPlayedRound[player] = roundIndex;
      }

      // Update team pairing tracking
      const teamAKey = getTeamKey(bestMatch.teamA);
      const teamBKey = getTeamKey(bestMatch.teamB);
      teamLastPlayed[teamAKey] = roundIndex;
      teamLastPlayed[teamBKey] = roundIndex;
    }
  }

  // Create rounds (1 match per round)
  const rounds: Round[] = [];

  for (let i = 0; i < selectedMatches.length; i++) {
    const match = selectedMatches[i];
    const playingPlayers = [...match.teamA, ...match.teamB];
    const restingPlayers = players.filter(p => !playingPlayers.includes(p));

    rounds.push({
      roundNumber: i + 1,
      matches: [match],
      restingPlayers,
    });
  }

  return rounds;
}

// Get all tournaments from localStorage
export function getTournaments(): Tournament[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Get tournament by ID
export function getTournamentById(id: string): Tournament | null {
  const tournaments = getTournaments();
  return tournaments.find(t => t.id === id) || null;
}

// Save a new tournament
export function saveTournament(tournament: Omit<Tournament, "id" | "createdAt" | "rounds">): Tournament {
  const tournaments = getTournaments();
  const rounds = generateTournamentRounds(tournament.players);

  const newTournament: Tournament = {
    ...tournament,
    id: generateId(),
    rounds,
    createdAt: new Date().toISOString(),
  };

  tournaments.push(newTournament);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  return newTournament;
}

// Update tournament (for saving scores)
export function updateTournament(tournament: Tournament): void {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournament.id);

  if (index !== -1) {
    tournaments[index] = tournament;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  }
}

// Update match score
export function updateMatchScore(
  tournamentId: string,
  roundNumber: number,
  matchId: string,
  scoreA: number,
  scoreB: number
): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  const round = tournament.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) return null;

  const match = round.matches.find(m => m.id === matchId);
  if (!match) return null;

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.isCompleted = true;

  updateTournament(tournament);
  return tournament;
}

// Delete a tournament by id
export function deleteTournament(id: string): void {
  const tournaments = getTournaments();
  const filtered = tournaments.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Get point type display label
export function getPointTypeLabel(pointType: string): string {
  switch (pointType) {
    case "21":
      return "21 points";
    case "16":
      return "16 points";
    case "best4":
      return "Best of 4";
    case "best5":
      return "Best of 5";
    default:
      return pointType;
  }
}
