// Mix Americano Tournament Utilities
// For 6 players (3 Men, 3 Women) or 8 players (4 Men, 4 Women) with perfect matrix pairing

import { TournamentsArraySchema, sanitizeString, sanitizeStringArray } from "./form-schemas";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type Gender = "male" | "female";

export interface MixPlayer {
  name: string;
  gender: Gender;
}

export interface MixTournament {
  id: string;
  name: string;
  teamType: "mix";
  pointType: string;
  players: string[];
  playerGenders: Record<string, Gender>; // Maps player name to gender
  rounds: MixRound[];
  createdAt: string;
  hasExtended?: boolean;
  isEnded?: boolean;
}

export interface MixMatch {
  id: string;
  teamA: string[]; // [man, woman]
  teamB: string[]; // [man, woman]
  scoreA: number | null;
  scoreB: number | null;
  isCompleted: boolean;
}

export interface MixRound {
  roundNumber: number;
  matches: MixMatch[];
  restingPlayers: string[];
}

// ============================================================================
// PERFECT MATRIX FOR 24 ROUNDS (8 PLAYERS: 4M, 4W)
// Each match has a mixed pair (1 man + 1 woman) on each team
// ============================================================================

interface ScheduleEntry {
  round: number;
  home: { m: string; w: string };
  away: { m: string; w: string };
}

// Schedule for 8 players (4 men, 4 women) - 24 rounds
const SCHEDULE_DATA_8_PLAYERS: ScheduleEntry[] = [
  { round: 1,  home: { m: "M1", w: "W1" }, away: { m: "M2", w: "W2" } },
  { round: 2,  home: { m: "M3", w: "W3" }, away: { m: "M4", w: "W4" } },
  { round: 3,  home: { m: "M1", w: "W3" }, away: { m: "M3", w: "W1" } },
  { round: 4,  home: { m: "M2", w: "W2" }, away: { m: "M4", w: "W4" } },
  { round: 5,  home: { m: "M1", w: "W4" }, away: { m: "M4", w: "W1" } },
  { round: 6,  home: { m: "M2", w: "W3" }, away: { m: "M3", w: "W2" } },

  { round: 7,  home: { m: "M1", w: "W2" }, away: { m: "M2", w: "W1" } },
  { round: 8,  home: { m: "M3", w: "W4" }, away: { m: "M4", w: "W3" } },
  { round: 9,  home: { m: "M2", w: "W4" }, away: { m: "M4", w: "W2" } },
  { round: 10, home: { m: "M1", w: "W1" }, away: { m: "M3", w: "W3" } },
  { round: 11, home: { m: "M1", w: "W1" }, away: { m: "M4", w: "W4" } },
  { round: 12, home: { m: "M2", w: "W3" }, away: { m: "M3", w: "W2" } },

  { round: 13, home: { m: "M1", w: "W3" }, away: { m: "M2", w: "W4" } },
  { round: 14, home: { m: "M3", w: "W1" }, away: { m: "M4", w: "W2" } },
  { round: 15, home: { m: "M2", w: "W1" }, away: { m: "M4", w: "W3" } },
  { round: 16, home: { m: "M1", w: "W2" }, away: { m: "M3", w: "W4" } },
  { round: 17, home: { m: "M1", w: "W4" }, away: { m: "M2", w: "W3" } },
  { round: 18, home: { m: "M3", w: "W2" }, away: { m: "M4", w: "W1" } },
  
  { round: 19, home: { m: "M2", w: "W2" }, away: { m: "M3", w: "W3" } },
  { round: 20, home: { m: "M1", w: "W4" }, away: { m: "M4", w: "W1" } },
  { round: 21, home: { m: "M1", w: "W2" }, away: { m: "M4", w: "W3" } },
  { round: 22, home: { m: "M2", w: "W1" }, away: { m: "M3", w: "W4" } },
  { round: 23, home: { m: "M1", w: "W3" }, away: { m: "M4", w: "W2" } },
  { round: 24, home: { m: "M2", w: "W4" }, away: { m: "M3", w: "W1" } },
];



// Schedule for 6 players (3 men, 3 women) - 9 rounds
const SCHEDULE_DATA_6_PLAYERS: ScheduleEntry[] = [
  // --- PARTNER BLOCK 1 (M1-W1, M2-W2, M3-W3) ---
  { round: 1,  home: { m: "M1", w: "W1" }, away: { m: "M2", w: "W2" } },
  { round: 2,  home: { m: "M1", w: "W2" }, away: { m: "M3", w: "W3" } },
  { round: 3,  home: { m: "M2", w: "W3" }, away: { m: "M3", w: "W2" } },
  { round: 4,  home: { m: "M1", w: "W3" }, away: { m: "M2", w: "W1" } },
  { round: 5,  home: { m: "M1", w: "W1" }, away: { m: "M3", w: "W2" } },
  { round: 6,  home: { m: "M2", w: "W1" }, away: { m: "M3", w: "W3" } },
  { round: 7,  home: { m: "M1", w: "W2" }, away: { m: "M2", w: "W3" } },
  { round: 8,  home: { m: "M2", w: "W2" }, away: { m: "M3", w: "W1" } },
  { round: 9,  home: { m: "M1", w: "W3" }, away: { m: "M3", w: "W1" } },
];

// Constants for 6 players
export const MIX_AMERICANO_6_PLAYERS = 6;
export const MIX_AMERICANO_6_MEN = 3;
export const MIX_AMERICANO_6_WOMEN = 3;
export const MIX_AMERICANO_6_ROUNDS = 9;
export const MIX_AMERICANO_6_EXTENDED_ROUNDS = 9; // Add 9 more rounds when extending

// Constants for 8 players
export const MIX_AMERICANO_8_PLAYERS = 8;
export const MIX_AMERICANO_8_MEN = 4;
export const MIX_AMERICANO_8_WOMEN = 4;
export const MIX_AMERICANO_8_ROUNDS = 24;

// Supported player counts
export const MIX_AMERICANO_ALLOWED_PLAYERS = [6, 8];

// Local storage key
const STORAGE_KEY = "calliesport_tournaments";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Shuffle array randomly (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }
  return shuffled;
}

// ============================================================================
// TOURNAMENT GENERATION
// ============================================================================

/**
 * Validates that the players list has valid configuration for Mix Americano
 * Supports: 6 players (3M + 3W) or 8 players (4M + 4W)
 */
export function validateMixAmericanoPlayers(
  players: MixPlayer[]
): { valid: boolean; error?: string } {
  const playerCount = players.length;

  // Check if player count is valid (6 or 8)
  if (!MIX_AMERICANO_ALLOWED_PLAYERS.includes(playerCount)) {
    return {
      valid: false,
      error: `Mix Americano requires exactly 6 or 8 players (currently ${playerCount})`,
    };
  }

  const men = players.filter((p) => p.gender === "male");
  const women = players.filter((p) => p.gender === "female");

  // Determine required counts based on player count
  const requiredMen = playerCount === 6 ? MIX_AMERICANO_6_MEN : MIX_AMERICANO_8_MEN;
  const requiredWomen = playerCount === 6 ? MIX_AMERICANO_6_WOMEN : MIX_AMERICANO_8_WOMEN;

  if (men.length !== requiredMen) {
    return {
      valid: false,
      error: `Mix Americano with ${playerCount} players requires exactly ${requiredMen} men (currently ${men.length})`,
    };
  }

  if (women.length !== requiredWomen) {
    return {
      valid: false,
      error: `Mix Americano with ${playerCount} players requires exactly ${requiredWomen} women (currently ${women.length})`,
    };
  }

  return { valid: true };
}

/**
 * Generate tournament rounds for Mix Americano using the perfect matrix
 * Players are randomly assigned to M1-M3/M4 and W1-W3/W4 positions based on count
 */
export function generateMixAmericanoRounds(players: MixPlayer[]): MixRound[] {
  const validation = validateMixAmericanoPlayers(players);
  if (!validation.valid) {
    console.error(validation.error);
    return [];
  }

  // Separate and shuffle men and women
  const men = shuffleArray(players.filter((p) => p.gender === "male"));
  const women = shuffleArray(players.filter((p) => p.gender === "female"));

  // Select the appropriate schedule based on player count
  const playerCount = players.length;
  const scheduleData = playerCount === 6 ? SCHEDULE_DATA_6_PLAYERS : SCHEDULE_DATA_8_PLAYERS;

  // Create mapping from M1-Mn and W1-Wn to actual player names
  const playerMap: Record<string, string> = {};
  men.forEach((player, index) => {
    playerMap[`M${index + 1}`] = player.name;
  });
  women.forEach((player, index) => {
    playerMap[`W${index + 1}`] = player.name;
  });

  // Generate rounds from schedule
  const rounds: MixRound[] = [];

  for (const entry of scheduleData) {
    const match: MixMatch = {
      id: generateId(),
      teamA: [playerMap[entry.home.m], playerMap[entry.home.w]],
      teamB: [playerMap[entry.away.m], playerMap[entry.away.w]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    // In Mix Americano, all players play every round (no resting)
    // But we keep the restingPlayers array for compatibility
    rounds.push({
      roundNumber: entry.round,
      matches: [match],
      restingPlayers: [],
    });
  }

  return rounds;
}

/**
 * Calculate total rounds for Mix Americano based on player count
 */
export function calculateMixAmericanoRounds(playerCount: number): number {
  if (playerCount === 6) return MIX_AMERICANO_6_ROUNDS;
  if (playerCount === 8) return MIX_AMERICANO_8_ROUNDS;
  return 0;
}

/**
 * Calculate additional rounds when extending Mix Americano (only 6 players supported)
 */
export function calculateMixAmericanoExtendedRounds(playerCount: number): number {
  if (playerCount === 6) return MIX_AMERICANO_6_EXTENDED_ROUNDS;
  // 8 players has 24 rounds which is already a complete cycle, no extension supported
  return 0;
}

// ============================================================================
// TOURNAMENT CRUD OPERATIONS
// ============================================================================

/**
 * Get all tournaments from localStorage
 */
export function getMixTournaments(): MixTournament[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    // Filter only mix tournaments
    return parsed.filter((t: MixTournament) => t.teamType === "mix");
  } catch (error) {
    console.error("Failed to parse tournaments from localStorage:", error);
    return [];
  }
}

/**
 * Get Mix tournament by ID
 */
export function getMixTournamentById(id: string): MixTournament | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    const tournament = parsed.find(
      (t: MixTournament) => t.id === id && t.teamType === "mix"
    );
    return tournament || null;
  } catch (error) {
    console.error("Failed to parse tournaments from localStorage:", error);
    return null;
  }
}

/**
 * Save a new Mix Americano tournament
 */
export function saveMixAmericanoTournament(tournament: {
  name: string;
  pointType: string;
  players: MixPlayer[];
}): MixTournament | null {
  const validation = validateMixAmericanoPlayers(tournament.players);
  if (!validation.valid) {
    console.error(validation.error);
    return null;
  }

  // Sanitize inputs
  const sanitizedName = sanitizeString(tournament.name);
  const sanitizedPlayers = tournament.players.map((p) => ({
    name: sanitizeString(p.name),
    gender: p.gender,
  }));

  // Create player genders map
  const playerGenders: Record<string, Gender> = {};
  sanitizedPlayers.forEach((p) => {
    playerGenders[p.name] = p.gender;
  });

  // Generate rounds
  const rounds = generateMixAmericanoRounds(sanitizedPlayers);

  const newTournament: MixTournament = {
    id: generateId(),
    name: sanitizedName,
    teamType: "mix",
    pointType: tournament.pointType,
    players: sanitizedPlayers.map((p) => p.name),
    playerGenders,
    rounds,
    createdAt: new Date().toISOString(),
    hasExtended: false,
    isEnded: false,
  };

  // Get existing tournaments and add new one
  const stored = localStorage.getItem(STORAGE_KEY);
  const tournaments = stored ? JSON.parse(stored) : [];
  tournaments.push(newTournament);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));

  return newTournament;
}

/**
 * Update a Mix Americano tournament
 */
export function updateMixTournament(tournament: MixTournament): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  try {
    const tournaments = JSON.parse(stored);
    const index = tournaments.findIndex(
      (t: MixTournament) => t.id === tournament.id
    );

    if (index !== -1) {
      tournaments[index] = tournament;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
    }
  } catch (error) {
    console.error("Failed to update tournament:", error);
  }
}

/**
 * Update match score for Mix Americano
 */
export function updateMixMatchScore(
  tournamentId: string,
  roundNumber: number,
  matchId: string,
  scoreA: number | null,
  scoreB: number | null
): MixTournament | null {
  const tournament = getMixTournamentById(tournamentId);

  if (!tournament) return null;

  const round = tournament.rounds.find((r) => r.roundNumber === roundNumber);
  if (!round) return null;

  const match = round.matches.find((m) => m.id === matchId);
  if (!match) return null;

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.isCompleted = scoreA !== null && scoreB !== null;

  updateMixTournament(tournament);
  return tournament;
}

/**
 * End a Mix Americano tournament
 */
export function endMixTournament(tournamentId: string): MixTournament | null {
  const tournament = getMixTournamentById(tournamentId);

  if (!tournament) return null;
  if (tournament.isEnded) return null;

  tournament.isEnded = true;
  updateMixTournament(tournament);
  return tournament;
}

/**
 * Check if Mix Americano team type is supported
 */
export function isMixAmericanoSupported(): boolean {
  return true;
}

/**
 * Get player gender from tournament
 */
export function getPlayerGender(
  tournament: MixTournament,
  playerName: string
): Gender | undefined {
  return tournament.playerGenders[playerName];
}

/**
 * Count players by gender
 */
export function countPlayersByGender(players: MixPlayer[]): {
  men: number;
  women: number;
} {
  return {
    men: players.filter((p) => p.gender === "male").length,
    women: players.filter((p) => p.gender === "female").length,
  };
}

// ============================================================================
// REGENERATE TOURNAMENT WITH FIRST MATCH
// ============================================================================

/**
 * Generate Mix Americano rounds with a specific first match lineup
 * The first match must have mixed pairs (1 man + 1 woman per team)
 */
export function generateMixAmericanoRoundsWithFirstMatch(
  players: MixPlayer[],
  teamA: [string, string], // [man, woman] or [woman, man]
  teamB: [string, string]  // [man, woman] or [woman, man]
): MixRound[] {
  const validation = validateMixAmericanoPlayers(players);
  if (!validation.valid) {
    console.error(validation.error);
    return [];
  }

  // Separate men and women
  const men = players.filter((p) => p.gender === "male");
  const women = players.filter((p) => p.gender === "female");

  // Create a map of player name to gender for quick lookup
  const playerGenderMap: Record<string, Gender> = {};
  players.forEach((p) => {
    playerGenderMap[p.name] = p.gender;
  });

  // Identify which players from teamA and teamB are men/women
  const teamAMan = teamA.find((p) => playerGenderMap[p] === "male");
  const teamAWoman = teamA.find((p) => playerGenderMap[p] === "female");
  const teamBMan = teamB.find((p) => playerGenderMap[p] === "male");
  const teamBWoman = teamB.find((p) => playerGenderMap[p] === "female");

  // Validate that each team has exactly 1 man and 1 woman
  if (!teamAMan || !teamAWoman || !teamBMan || !teamBWoman) {
    console.error("Each team must have exactly 1 man and 1 woman");
    return [];
  }

  // Select the appropriate schedule based on player count
  const playerCount = players.length;
  const scheduleData = playerCount === 6 ? SCHEDULE_DATA_6_PLAYERS : SCHEDULE_DATA_8_PLAYERS;

  // Get the first round entry to dynamically determine which template positions to use
  const firstRound = scheduleData[0];

  // Build the player mapping dynamically based on the ACTUAL first round in schedule
  // Team A (home) positions from first round
  const homeManPosition = firstRound.home.m;    // e.g., "M1"
  const homeWomanPosition = firstRound.home.w;  // e.g., "W1"
  // Team B (away) positions from first round
  const awayManPosition = firstRound.away.m;    // e.g., "M2"
  const awayWomanPosition = firstRound.away.w;  // e.g., "W2"

  // Get remaining men and women not in the first match
  const remainingMen = men
    .filter((p) => p.name !== teamAMan && p.name !== teamBMan)
    .map((p) => p.name);
  const remainingWomen = women
    .filter((p) => p.name !== teamAWoman && p.name !== teamBWoman)
    .map((p) => p.name);

  // Shuffle remaining players for randomization
  const shuffledRemainingMen = shuffleArray(remainingMen);
  const shuffledRemainingWomen = shuffleArray(remainingWomen);

  // Find which M positions are NOT used in the first round (for remaining men)
  const allMenPositions = playerCount === 6 ? ["M1", "M2", "M3"] : ["M1", "M2", "M3", "M4"];
  const usedMenPositions = [homeManPosition, awayManPosition];
  const unusedMenPositions = allMenPositions.filter(
    (pos) => !usedMenPositions.includes(pos)
  );

  // Find which W positions are NOT used in the first round (for remaining women)
  const allWomenPositions = playerCount === 6 ? ["W1", "W2", "W3"] : ["W1", "W2", "W3", "W4"];
  const usedWomenPositions = [homeWomanPosition, awayWomanPosition];
  const unusedWomenPositions = allWomenPositions.filter(
    (pos) => !usedWomenPositions.includes(pos)
  );

  // Create mapping from M1-Mn and W1-Wn to actual player names
  const playerMap: Record<string, string> = {
    // Map selected players to their positions based on first round
    [homeManPosition]: teamAMan,      // Team A man (home position in round 1)
    [homeWomanPosition]: teamAWoman,  // Team A woman (home position in round 1)
    [awayManPosition]: teamBMan,      // Team B man (away position in round 1)
    [awayWomanPosition]: teamBWoman,  // Team B woman (away position in round 1)
  };

  // Map remaining players to unused positions
  shuffledRemainingMen.forEach((name, index) => {
    if (unusedMenPositions[index]) {
      playerMap[unusedMenPositions[index]] = name;
    }
  });
  shuffledRemainingWomen.forEach((name, index) => {
    if (unusedWomenPositions[index]) {
      playerMap[unusedWomenPositions[index]] = name;
    }
  });

  // Generate rounds from schedule
  const rounds: MixRound[] = [];

  for (const entry of scheduleData) {
    const match: MixMatch = {
      id: generateId(),
      teamA: [playerMap[entry.home.m], playerMap[entry.home.w]],
      teamB: [playerMap[entry.away.m], playerMap[entry.away.w]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    rounds.push({
      roundNumber: entry.round,
      matches: [match],
      restingPlayers: [],
    });
  }

  return rounds;
}

/**
 * Regenerate Mix Americano tournament with a specific first match lineup
 * This allows users to set who plays in round 1
 */
export function regenerateMixAmericanoTournamentWithFirstMatch(
  tournamentId: string,
  teamA: [string, string],
  teamB: [string, string]
): MixTournament | null {
  const tournament = getMixTournamentById(tournamentId);

  if (!tournament) return null;

  // Build MixPlayer array from tournament data
  const players: MixPlayer[] = tournament.players.map((name) => ({
    name,
    gender: tournament.playerGenders[name],
  }));

  // Generate new rounds with the specified first match
  const newRounds = generateMixAmericanoRoundsWithFirstMatch(
    players,
    teamA,
    teamB
  );

  if (newRounds.length === 0) {
    console.error("Failed to generate rounds for Mix Americano");
    return null;
  }

  // Reset tournament state
  tournament.rounds = newRounds;
  tournament.hasExtended = false;
  tournament.isEnded = false;

  updateMixTournament(tournament);
  return tournament;
}

// ============================================================================
// EXTEND TOURNAMENT (ADD MORE ROUNDS)
// ============================================================================

// ============================================================================
// PLAYER EDITING FUNCTIONS
// ============================================================================

/**
 * Update player genders in Mix Americano tournament
 * This preserves all rounds and just updates the playerGenders map
 */
export function updateMixPlayerGenders(
  tournamentId: string,
  playerGenders: Record<string, Gender>
): MixTournament | null {
  const tournament = getMixTournamentById(tournamentId);

  if (!tournament) return null;

  // Tournament must not be ended
  if (tournament.isEnded) return null;

  // Update playerGenders map
  tournament.playerGenders = playerGenders;

  updateMixTournament(tournament);
  return tournament;
}

/**
 * Rename a player in Mix Americano tournament
 * This preserves all rounds and just updates the player name
 */
export function renameMixPlayer(
  tournamentId: string,
  oldName: string,
  newName: string
): MixTournament | null {
  const tournament = getMixTournamentById(tournamentId);

  if (!tournament) return null;

  // Tournament must not be ended
  if (tournament.isEnded) return null;

  // Sanitize new name
  const sanitizedNewName = sanitizeString(newName.trim());
  if (!sanitizedNewName) return null;

  // Check if old player exists
  const playerIndex = tournament.players.findIndex((p) => p === oldName);
  if (playerIndex === -1) return null;

  // Check if new name already exists (excluding current player)
  const isDuplicate = tournament.players.some(
    (p, i) => i !== playerIndex && p.toLowerCase() === sanitizedNewName.toLowerCase()
  );
  if (isDuplicate) return null;

  // Update player name in players array
  tournament.players[playerIndex] = sanitizedNewName;

  // Update playerGenders map
  const gender = tournament.playerGenders[oldName];
  delete tournament.playerGenders[oldName];
  tournament.playerGenders[sanitizedNewName] = gender;

  // Update player name in all rounds
  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      match.teamA = match.teamA.map((p) => (p === oldName ? sanitizedNewName : p));
      match.teamB = match.teamB.map((p) => (p === oldName ? sanitizedNewName : p));
    });
    round.restingPlayers = round.restingPlayers.map((p) =>
      p === oldName ? sanitizedNewName : p
    );
  });

  updateMixTournament(tournament);
  return tournament;
}

/**
 * Update Mix Americano tournament players
 * This regenerates all rounds with the new player list
 */
export function updateMixAmericanoPlayers(
  tournamentId: string,
  newPlayers: MixPlayer[]
): MixTournament | null {
  const tournament = getMixTournamentById(tournamentId);

  if (!tournament) return null;

  // Tournament must not be ended
  if (tournament.isEnded) return null;

  // Validate new players
  const validation = validateMixAmericanoPlayers(newPlayers);
  if (!validation.valid) {
    console.error(validation.error);
    return null;
  }

  // Sanitize player names
  const sanitizedPlayers = newPlayers.map((p) => ({
    name: sanitizeString(p.name.trim()),
    gender: p.gender,
  }));

  // Check for duplicate names
  const names = sanitizedPlayers.map((p) => p.name.toLowerCase());
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    console.error("Duplicate player names found");
    return null;
  }

  // Create new playerGenders map
  const playerGenders: Record<string, Gender> = {};
  sanitizedPlayers.forEach((p) => {
    playerGenders[p.name] = p.gender;
  });

  // Generate new rounds
  const newRounds = generateMixAmericanoRounds(sanitizedPlayers);
  if (newRounds.length === 0) {
    console.error("Failed to generate rounds");
    return null;
  }

  // Update tournament
  tournament.players = sanitizedPlayers.map((p) => p.name);
  tournament.playerGenders = playerGenders;
  tournament.rounds = newRounds;
  tournament.hasExtended = false;

  updateMixTournament(tournament);
  return tournament;
}

// ============================================================================
// EXTEND TOURNAMENT (ADD MORE ROUNDS)
// ============================================================================

/**
 * Extend Mix Americano tournament with additional rounds (6 players only)
 * Can only be done once after all initial 9 rounds are completed
 */
export function extendMixAmericanoTournament(tournamentId: string): MixTournament | null {
  const tournament = getMixTournamentById(tournamentId);

  if (!tournament) return null;

  // Can only extend once
  if (tournament.hasExtended) return null;

  // Tournament must not be ended
  if (tournament.isEnded) return null;

  // Only support 6 players extension (8 players has 24 rounds - full cycle)
  const playerCount = tournament.players.length;
  if (playerCount !== 6) return null;

  const additionalRoundsCount = calculateMixAmericanoExtendedRounds(playerCount);
  if (additionalRoundsCount === 0) return null;

  // Separate players by gender and reshuffle for new round lineup
  const men = tournament.players.filter(
    (p) => tournament.playerGenders[p] === "male"
  );
  const women = tournament.players.filter(
    (p) => tournament.playerGenders[p] === "female"
  );

  // Shuffle men and women separately for a different lineup in round 10
  const shuffledMen = shuffleArray(men);
  const shuffledWomen = shuffleArray(women);

  // Create new mapping from M1-M3 and W1-W3 to shuffled players
  const playerMap: Record<string, string> = {};
  shuffledMen.forEach((name, index) => {
    playerMap[`M${index + 1}`] = name;
  });
  shuffledWomen.forEach((name, index) => {
    playerMap[`W${index + 1}`] = name;
  });

  // Generate additional rounds using the same schedule
  const newRounds: MixRound[] = [];
  const lastRoundNumber = tournament.rounds.length;

  for (let i = 0; i < SCHEDULE_DATA_6_PLAYERS.length; i++) {
    const entry = SCHEDULE_DATA_6_PLAYERS[i];
    const match: MixMatch = {
      id: generateId(),
      teamA: [playerMap[entry.home.m], playerMap[entry.home.w]],
      teamB: [playerMap[entry.away.m], playerMap[entry.away.w]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    newRounds.push({
      roundNumber: lastRoundNumber + i + 1,
      matches: [match],
      restingPlayers: [],
    });
  }

  // Update tournament
  tournament.rounds = [...tournament.rounds, ...newRounds];
  tournament.hasExtended = true;

  updateMixTournament(tournament);
  return tournament;
}
