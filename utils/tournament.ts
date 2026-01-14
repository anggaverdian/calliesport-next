// Tournament types and utilities
import { TournamentsArraySchema, sanitizeString, sanitizeStringArray } from "./form-schemas";

// ============================================================================
// SHARED TYPES AND INTERFACES
// ============================================================================

export type TeamType = "standard" | "mix" | "team" | "mexicano";

// Check if a team type is currently supported (has full implementation)
export function isTeamTypeSupported(teamType: TeamType): boolean {
  return teamType === "standard";
}

export interface Tournament {
  id: string;
  name: string;
  teamType: TeamType;
  pointType: string;
  players: string[];
  rounds: Round[];
  createdAt: string;
  hasExtended?: boolean;
  isEnded?: boolean;
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

// ============================================================================
// SHARED UTILITY FUNCTIONS
// ============================================================================

// Local storage key
const STORAGE_KEY = "calliesport_tournaments";

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

// ============================================================================
// STANDARD AMERICANO - ROUND GENERATION
// These functions are specific to Standard Americano team type
// ============================================================================

// Calculate total rounds based on player count (Standard Americano)
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

// Calculate extended rounds based on player count (for "Add More Rounds" feature)
export function calculateExtendedRounds(playerCount: number): number {
  const extendedRoundsMap: Record<number, number> = {
    4: 6,   // Total: 12
    5: 10,  // Total: 20
    6: 15,  // Total: 30
    7: 7,   // Total: 28 (Special Case)
    8: 14,  // Total: 28
    9: 9,   // Total: 27 (Special Case)
    10: 10, // Total: 35 (Special Case)
    11: 11, // Total: 33 (Special Case)
    12: 9,  // Total: 42 (Special Case)
  };
  return extendedRoundsMap[playerCount] || 0;
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

// Generate tournament rounds with a specific first match
// This allows users to set who plays in round 1
export function generateTournamentRoundsWithFirstMatch(
  players: string[],
  teamA: [string, string],
  teamB: [string, string]
): Round[] {
  const totalRounds = calculateRounds(players.length);

  if (totalRounds === 0 || players.length < 4) {
    return [];
  }

  // Generate all possible unique matches as templates
  const allMatchTemplates = generateAllMatches(players);

  // Track play count and last played round for each player
  const playCount: Record<string, number> = {};
  const lastPlayedRound: Record<string, number> = {};
  // Track when each team pairing last played together
  const teamLastPlayed: Record<string, number> = {};

  // Initialize tracking
  players.forEach(player => {
    playCount[player] = 0;
    lastPlayedRound[player] = -Infinity;
  });

  const selectedMatches: Match[] = [];

  // Create the first match with the user-specified teams
  const firstMatch: Match = {
    id: generateId(),
    teamA: [...teamA],
    teamB: [...teamB],
    scoreA: 0,
    scoreB: 0,
    isCompleted: false,
  };
  selectedMatches.push(firstMatch);

  // Update tracking for first match
  const firstMatchPlayers = [...teamA, ...teamB];
  for (const player of firstMatchPlayers) {
    playCount[player]++;
    lastPlayedRound[player] = 0;
  }
  const firstTeamAKey = getTeamKey(teamA);
  const firstTeamBKey = getTeamKey(teamB);
  teamLastPlayed[firstTeamAKey] = 0;
  teamLastPlayed[firstTeamBKey] = 0;

  // Remove the first match from available pool if it exists
  let availableMatches = allMatchTemplates.filter(m => {
    const matchTeamAKey = getTeamKey(m.teamA);
    const matchTeamBKey = getTeamKey(m.teamB);
    // Check if this match is the same as the first match (regardless of team order)
    const isSameMatch =
      (matchTeamAKey === firstTeamAKey && matchTeamBKey === firstTeamBKey) ||
      (matchTeamAKey === firstTeamBKey && matchTeamBKey === firstTeamAKey);
    return !isSameMatch;
  });

  // Select remaining matches
  for (let roundIndex = 1; roundIndex < totalRounds; roundIndex++) {
    // If pool is empty, refill it (excluding already selected matches)
    if (availableMatches.length === 0) {
      availableMatches = allMatchTemplates.filter(template => {
        const templateTeamAKey = getTeamKey(template.teamA);
        const templateTeamBKey = getTeamKey(template.teamB);
        // Check if this template was already selected
        return !selectedMatches.some(selected => {
          const selectedTeamAKey = getTeamKey(selected.teamA);
          const selectedTeamBKey = getTeamKey(selected.teamB);
          return (templateTeamAKey === selectedTeamAKey && templateTeamBKey === selectedTeamBKey) ||
                 (templateTeamAKey === selectedTeamBKey && templateTeamBKey === selectedTeamAKey);
        });
      });
      // If still empty after filtering, use all templates
      if (availableMatches.length === 0) {
        availableMatches = [...allMatchTemplates];
      }
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

      // Score formula
      const score = totalPlayCount * 100 - minPlayerRest;

      if (score < bestScore) {
        bestScore = score;
        bestMatchIndex = i;
      }
    }

    // If no valid match found, relax the constraint
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

// Regenerate tournament rounds with a specific first match lineup
export function regenerateTournamentWithFirstMatch(
  tournamentId: string,
  teamA: [string, string],
  teamB: [string, string]
): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  // Only allow regeneration for Standard Americano
  if (!isTeamTypeSupported(tournament.teamType)) return null;

  // Generate new rounds with the specified first match
  const newRounds = generateTournamentRoundsWithFirstMatch(
    tournament.players,
    teamA,
    teamB
  );

  // Reset tournament state
  tournament.rounds = newRounds;
  tournament.hasExtended = false;
  tournament.isEnded = false;

  updateTournament(tournament);
  return tournament;
}

// Get all tournaments from localStorage with safe parsing and validation
export function getTournaments(): Tournament[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    const result = TournamentsArraySchema.safeParse(parsed);

    if (result.success) {
      return result.data as Tournament[];
    }

    // Data is corrupted or invalid - log error and return empty array
    console.error("Invalid tournament data in localStorage:", result.error.message);
    return [];
  } catch (error) {
    // JSON parsing failed - data is corrupted
    console.error("Failed to parse tournaments from localStorage:", error);
    return [];
  }
}

// Get tournament by ID
export function getTournamentById(id: string): Tournament | null {
  const tournaments = getTournaments();
  return tournaments.find(t => t.id === id) || null;
}

// ============================================================================
// TOURNAMENT CRUD OPERATIONS
// ============================================================================

// Save a new tournament
export function saveTournament(tournament: Omit<Tournament, "id" | "createdAt" | "rounds">): Tournament {
  const tournaments = getTournaments();

  // Sanitize user input to prevent XSS
  const sanitizedName = sanitizeString(tournament.name);
  const sanitizedPlayers = sanitizeStringArray(tournament.players);

  // Only generate rounds for Standard Americano (currently supported)
  // Other team types will have empty rounds until their logic is implemented
  const rounds = isTeamTypeSupported(tournament.teamType)
    ? generateTournamentRounds(sanitizedPlayers)
    : [];

  const newTournament: Tournament = {
    ...tournament,
    name: sanitizedName,
    players: sanitizedPlayers,
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

// Extend tournament with additional rounds (can only be done once)
export function extendTournament(tournamentId: string): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  // Can only extend once
  if (tournament.hasExtended) return null;

  const playerCount = tournament.players.length;
  const additionalRoundsCount = calculateExtendedRounds(playerCount);

  if (additionalRoundsCount === 0) return null;

  // Generate additional rounds using the existing fair pairing logic
  const additionalRounds = generateAdditionalRounds(
    tournament.players,
    tournament.rounds,
    additionalRoundsCount
  );

  // Update round numbers to continue from where we left off
  const lastRoundNumber = tournament.rounds.length;
  additionalRounds.forEach((round, index) => {
    round.roundNumber = lastRoundNumber + index + 1;
  });

  // Update tournament
  tournament.rounds = [...tournament.rounds, ...additionalRounds];
  tournament.hasExtended = true;

  updateTournament(tournament);
  return tournament;
}

// Generate additional rounds considering existing play history
function generateAdditionalRounds(
  players: string[],
  existingRounds: Round[],
  additionalRoundsCount: number
): Round[] {
  // Generate all possible unique matches as templates
  const allMatchTemplates = generateAllMatches(players);

  // Track play count from existing rounds
  const playCount: Record<string, number> = {};
  const lastPlayedRound: Record<string, number> = {};
  const teamLastPlayed: Record<string, number> = {};

  // Initialize tracking
  players.forEach(player => {
    playCount[player] = 0;
    lastPlayedRound[player] = -Infinity;
  });

  // Count plays from existing rounds
  existingRounds.forEach((round, roundIndex) => {
    round.matches.forEach(match => {
      const matchPlayers = [...match.teamA, ...match.teamB];
      matchPlayers.forEach(player => {
        playCount[player]++;
        lastPlayedRound[player] = roundIndex;
      });

      const teamAKey = getTeamKey(match.teamA);
      const teamBKey = getTeamKey(match.teamB);
      teamLastPlayed[teamAKey] = roundIndex;
      teamLastPlayed[teamBKey] = roundIndex;
    });
  });

  const startingRoundIndex = existingRounds.length;
  const selectedMatches: Match[] = [];
  let availableMatches = [...allMatchTemplates];

  // Select matches one by one for fair rest time ordering
  for (let i = 0; i < additionalRoundsCount; i++) {
    const roundIndex = startingRoundIndex + i;

    // If pool is empty, refill it
    if (availableMatches.length === 0) {
      availableMatches = [...allMatchTemplates];
    }

    // Find the best match from available pool
    let bestMatchIndex = -1;
    let bestScore = Infinity;

    for (let j = 0; j < availableMatches.length; j++) {
      const match = availableMatches[j];
      const matchPlayers = [...match.teamA, ...match.teamB];

      // Check team pairing rest
      const teamAKey = getTeamKey(match.teamA);
      const teamBKey = getTeamKey(match.teamB);
      const teamALastPlayed = teamLastPlayed[teamAKey] ?? -Infinity;
      const teamBLastPlayed = teamLastPlayed[teamBKey] ?? -Infinity;
      const minTeamRest = Math.min(
        roundIndex - teamALastPlayed,
        roundIndex - teamBLastPlayed
      );

      // Skip if either team just played in the previous round
      if (minTeamRest <= 1) {
        continue;
      }

      // Calculate player rest time
      let minPlayerRest = Infinity;
      let totalPlayCount = 0;

      for (const player of matchPlayers) {
        totalPlayCount += playCount[player];
        const restTime = roundIndex - lastPlayedRound[player];
        if (restTime < minPlayerRest) {
          minPlayerRest = restTime;
        }
      }

      // Score formula: prioritize players with lowest play count, then rest time
      const score = totalPlayCount * 100 - minPlayerRest;

      if (score < bestScore) {
        bestScore = score;
        bestMatchIndex = j;
      }
    }

    // If no valid match found, relax the constraint
    if (bestMatchIndex === -1) {
      bestScore = Infinity;
      for (let j = 0; j < availableMatches.length; j++) {
        const match = availableMatches[j];
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
          bestMatchIndex = j;
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

      // Update tracking
      const matchPlayers = [...bestMatch.teamA, ...bestMatch.teamB];
      for (const player of matchPlayers) {
        playCount[player]++;
        lastPlayedRound[player] = roundIndex;
      }

      const teamAKey = getTeamKey(bestMatch.teamA);
      const teamBKey = getTeamKey(bestMatch.teamB);
      teamLastPlayed[teamAKey] = roundIndex;
      teamLastPlayed[teamBKey] = roundIndex;
    }
  }

  // Create rounds
  const rounds: Round[] = [];

  for (let i = 0; i < selectedMatches.length; i++) {
    const match = selectedMatches[i];
    const playingPlayers = [...match.teamA, ...match.teamB];
    const restingPlayers = players.filter(p => !playingPlayers.includes(p));

    rounds.push({
      roundNumber: i + 1, // Will be updated by caller
      matches: [match],
      restingPlayers,
    });
  }

  return rounds;
}

// End tournament (marks as completed, prevents further score input)
export function endTournament(tournamentId: string): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  // Already ended
  if (tournament.isEnded) return null;

  tournament.isEnded = true;
  updateTournament(tournament);
  return tournament;
}
