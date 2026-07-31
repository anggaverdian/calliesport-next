// Tournament types and utilities
import { match } from "assert";
import { TournamentsArraySchema, TournamentSchema, sanitizeString, sanitizeStringArray } from "./form-schemas";

// ============================================================================
// SHARED TYPES AND INTERFACES
// ============================================================================

export type TeamType = "standard" | "mix" | "team" | "mexicano";

// Check if a team type is currently supported (has full implementation)
export function isTeamTypeSupported(teamType: TeamType): boolean {
  return teamType === "standard" || teamType === "mix";
}

export type Gender = "male" | "female";

// Number of courts played in parallel each round
export type CourtCount = 1 | 2;

export interface Tournament {
  id: string;
  name: string;
  teamType: TeamType;
  pointType: string;
  players: string[];
  playerGenders?: Record<string, Gender>; // For Mix Americano: maps player name to gender
  courtCount?: CourtCount; // Undefined = 1 court (legacy tournaments)
  rounds: Round[];
  createdAt: string;
  hasExtended?: boolean;
  isEnded?: boolean;
  completedAt?: string;
  shareId?: string; // Persistent share ID for sharing tournament link
}

export interface Match {
  id: string;
  teamA: string[];
  teamB: string[];
  scoreA: number | null;
  scoreB: number | null;
  isCompleted: boolean;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  restingPlayers: string[];
}

// Team type display names
export const teamTypeNames: Record<TeamType, string> = {
  standard: "Classic Americano",
  mix: "Mix Americano",
  team: "Fix Partner",
  mexicano: "Standard Mexicano",
};

// Player limits (1 court = max 8 players)
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;

// Player counts allowed when playing on 2 courts
export const TWO_COURT_ALLOWED_PLAYERS = [10, 12];

// Player counts that already have a pairing matrix implemented for 2 courts.
// 12 players is allowed by the form but its matrix is not built yet.
export const TWO_COURT_SUPPORTED_PLAYERS = [10];

// Normalize a tournament's court count (legacy tournaments have none stored)
export function getCourtCount(tournament: Pick<Tournament, "courtCount">): CourtCount {
  return tournament.courtCount === 2 ? 2 : 1;
}

// Player limits for a given court count
export function getPlayerLimits(courtCount: CourtCount): { min: number; max: number } {
  if (courtCount === 2) {
    return {
      min: Math.min(...TWO_COURT_ALLOWED_PLAYERS),
      max: Math.max(...TWO_COURT_ALLOWED_PLAYERS),
    };
  }
  return { min: MIN_PLAYERS, max: MAX_PLAYERS };
}

// Check if a player count can start a tournament with the given court count
export function isPlayerCountSupported(playerCount: number, courtCount: CourtCount): boolean {
  if (courtCount === 2) {
    return TWO_COURT_SUPPORTED_PLAYERS.includes(playerCount);
  }
  return playerCount >= MIN_PLAYERS && playerCount <= MAX_PLAYERS;
}

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

// Calculate total rounds based on player count and court count (Standard Americano)
export function calculateRounds(playerCount: number, courtCount: CourtCount = 1): number {
  if (courtCount === 2) {
    const twoCourtRoundsMap: Record<number, number> = {
      10: 12, // 12 rounds x 2 courts = every pair partners at least once
    };
    return twoCourtRoundsMap[playerCount] || 0;
  }

  const roundsMap: Record<number, number> = {
    4: 6,
    5: 10,
    6: 15,
    7: 21,
    8: 14,
  };
  return roundsMap[playerCount] || 0;
}

// Calculate extended rounds based on player count (for "Add More Rounds" feature)
export function calculateExtendedRounds(playerCount: number, courtCount: CourtCount = 1): number {
  if (courtCount === 2) {
    const twoCourtExtendedRoundsMap: Record<number, number> = {
      10: 12, // Total: 24
    };
    return twoCourtExtendedRoundsMap[playerCount] || 0;
  }

  const extendedRoundsMap: Record<number, number> = {
    4: 6,   // Total: 12
    5: 10,  // Total: 20
    6: 15,  // Total: 30
    7: 7,   // Total: 28 (Special Case)
    8: 14,  // Total: 28
  };
  return extendedRoundsMap[playerCount] || 0;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Shuffle array randomly (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  console.log("input dari create : " + shuffled);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }
  console.log("input sudah diacak : " + shuffled);
  return shuffled;
}

// ============================================================================
// PERFECT WHIST TOURNAMENT MATRIX FOR 4 PLAYERS
// This ensures perfectly balanced pairing:
// - Each player plays exactly 6 matches (all rounds)
// - Each player partners with everyone else exactly 2 times
// - Each player opposes everyone else exactly 4 times
// ============================================================================

// Perfect Whist Tournament Matrix for 4 players (6 rounds)
// Format: [teamA[0], teamA[1], teamB[0], teamB[1]] using indices 0-3
// This matrix guarantees:
// - Each pair partners exactly 2 times
// - Each pair opposes exactly 4 times
// - Each player plays exactly 6 matches

const WHIST_MATRIX_4_PLAYERS: [number, number, number, number][] = [
// Everyone partners 1x, Versus 2x
  [0, 1, 2, 3], // Round 1
  [2, 0, 1, 3], // Round 2
  [3, 0, 2, 1], // Round 3

  // --- CYCLE 2 ---
  // Repeats to reach: Partner 2x, Versus 4x
  [1, 0, 3, 2], // Round 4
  [0, 2, 3, 1], // Round 5
  [0, 3, 1, 2]  // Round 6
];

// ============================================================================
// PERFECT WHIST TOURNAMENT MATRIX FOR 5 PLAYERS
// This ensures perfectly balanced pairing:
// - Each player plays exactly 8 matches
// - Each player rests exactly 2 times
// - Each player partners with everyone else exactly 2 times
// - Each player opposes everyone else exactly 4 times
// ============================================================================

// Perfect Whist Tournament Matrix for 5 players (10 rounds)
// Format: [teamA[0], teamA[1], teamB[0], teamB[1]] using indices 0-4
// Resting player for each round is the one not in the match

const WHIST_MATRIX_5_PLAYERS: [number, number, number, number][] = [
// --- CYCLE 1 ---
  // Everyone partners 1x, Versus 2x
  [0, 1, 2, 4], // Round 1  (Rest: 3)
  [1, 2, 3, 0], // Round 2  (Rest: 4)
  [2, 3, 4, 1], // Round 3  (Rest: 0)
  [3, 4, 0, 2], // Round 4  (Rest: 1)
  [4, 0, 1, 3], // Round 5  (Rest: 2)

  // --- CYCLE 2 ---
  // Repeats to reach: Partner 2x, Versus 4x
  [0, 1, 2, 4], // Round 6  (Rest: 3)
  [1, 2, 3, 0], // Round 7  (Rest: 4)
  [2, 3, 4, 1], // Round 8  (Rest: 0)
  [3, 4, 0, 2], // Round 9  (Rest: 1)
  [4, 0, 1, 3]  // Round 10 (Rest: 2)
];

// ============================================================================
// PERFECT WHIST TOURNAMENT MATRIX FOR 6 PLAYERS
// This ensures perfectly balanced pairing:
// - Each player plays exactly 10 matches
// - Each player partners with everyone else exactly 2 times
// - Each player opposes everyone else exactly 4 times
// ============================================================================

// Perfect Whist Tournament Matrix for 6 players (15 rounds)
// Format: [teamA[0], teamA[1], teamB[0], teamB[1]] using indices 0-5
// This matrix guarantees:
const WHIST_MATRIX_6_PLAYERS: [number, number, number, number][] = [
  [0, 1, 2, 3], //R1
  [4, 5, 0, 1], //R2
  [2, 3, 4, 5], //R3

  [0, 3, 1, 5], //R7
  [2, 4, 0, 3], //R8
  [1, 5, 2, 4], //R9
  
  [0, 5, 3, 4], //R13
  [1, 2, 0, 5], //R14
  [3, 4, 1, 2], //R15

  [0, 4, 2, 5], //R10
  [1, 3, 0, 4], //R11
  [2, 5, 1, 3], //R12

  [0, 2, 1, 4], //R4
  [3, 5, 0, 2], //R5
  [1, 4, 3, 5], //R6
];

// ============================================================================
// PERFECT WHIST TOURNAMENT MATRIX FOR 7 PLAYERS
// This ensures perfectly balanced pairing:
// - Each player plays exactly 12 matches
// - Each player partners with everyone else exactly 2 times
// - Each player opposes everyone else exactly 4 times
// - Each player rests exactly 9 times
// - No player plays more than 3 consecutive rounds
// ============================================================================

// Perfect Whist Tournament Matrix for 7 players (21 rounds)
// Format: [teamA[0], teamA[1], teamB[0], teamB[1]] using indices 0-6
// Resting player for each round is the one not in the match (7 - 4 = 3 resting)
const WHIST_MATRIX_7_PLAYERS: [number, number, number, number][] = [
    // --- SET 1 ---
    [0, 1, 2, 4], // Round 1
    [1, 2, 3, 5], // Round 2
    [2, 3, 4, 6], // Round 3
    [3, 4, 5, 0], // Round 4
    [4, 5, 6, 1], // Round 5
    [5, 6, 0, 2], // Round 6
    [6, 0, 1, 3], // Round 7

    // --- SET 2 ---
    [3, 2, 5, 1], // Round 8
    [4, 3, 6, 2], // Round 9
    [2, 1, 4, 0], // Round 10
    [0, 6, 2, 5], // Round 11
    [1, 0, 3, 6], // Round 12
    [5, 4, 0, 3], // Round 13
    [6, 5, 1, 4], // Round 14

    // --- SET 3 ---
    [0, 2, 1, 4], // Round 15
    [1, 3, 2, 5], // Round 16
    [2, 4, 3, 6], // Round 17
    [3, 5, 4, 0], // Round 18
    [4, 6, 5, 1], // Round 19
    [5, 0, 6, 2], // Round 20
    [6, 1, 0, 3]  // Round 21
]

// ============================================================================
// PERFECT WHIST TOURNAMENT MATRIX FOR 8 PLAYERS
// This ensures perfectly balanced pairing:
// - Each player plays exactly 7 matches
// - Each player partners with everyone else exactly 1 time
// - Each player opposes everyone else exactly 2 times
// ============================================================================

// Perfect Whist Tournament Matrix for 8 players (14 rounds)
// Format: [teamA[0], teamA[1], teamB[0], teamB[1]] using indices 0-7
// PERFECT no need change
const WHIST_MATRIX_8_PLAYERS: [number, number, number, number][] = [
  [0, 1, 2, 3], // Round 1:  --> Random
  [4, 5, 6, 7], // Round 2:  --> Rest player play
  [1, 7, 0, 6], // Round 3:
  [3, 5, 4, 2], // Round 4:
  [0, 3, 5, 6], // Round 5:
  [4, 7, 2, 1], // Round 6:
  [1, 6, 2, 5], // Round 7:
  [4, 3, 0, 7], // Round 8:
  [4, 6, 3, 1], // Round 9:
  [2, 0, 5, 7], // Round 10:
  [2, 6, 4, 0], // Round 11:
  [3, 7, 1, 5], // Round 12:
  [0, 5, 4, 1], // Round 13:
  [2, 7, 3, 6], // Round 14:
];

// ============================================================================
// PERFECT WHIST TOURNAMENT MATRIX FOR 10 PLAYERS - 2 COURTS
// Two matches run in parallel each round, 2 players rest.
// This ensures balanced pairing across 12 rounds:
// - Every one of the 45 possible pairs partners at least once
//   (12 rounds is the minimum possible: 12 rounds x 4 teams = 48 >= 45)
// - 3 pairs partner twice (the unavoidable 48 - 45 remainder):
//   indices 0+1, 3+5 and 6+7
// - Opponent counts range 1-3 times
// - Rest rotation repeats every 5 rounds, so 6 players play 10 matches
//   and 4 players play 9 (the leaderboard compensates for this)
// ============================================================================

// Perfect Whist Tournament Matrix for 10 players on 2 courts (12 rounds)
// Format: [court1: teamA[0], teamA[1], teamB[0], teamB[1],
//          court2: teamA[0], teamA[1], teamB[0], teamB[1]] using indices 0-9
// Resting players for each round are the two not listed in the row
type TwoCourtRow = [number, number, number, number, number, number, number, number];

const WHIST_MATRIX_10_PLAYERS_2_COURTS: TwoCourtRow[] = [
  [0, 1, 2, 3, 4, 5, 6, 7], // Round 1  (Rest: 8, 9)
  [0, 3, 8, 5, 1, 6, 7, 9], // Round 2  (Rest: 2, 4)
  [0, 6, 3, 7, 2, 8, 4, 9], // Round 3  (Rest: 1, 5)
  [2, 7, 8, 3, 1, 4, 5, 9], // Round 4  (Rest: 0, 6)
  [0, 4, 2, 9, 8, 6, 1, 5], // Round 5  (Rest: 3, 7)
  [0, 7, 2, 5, 1, 3, 4, 6], // Round 6  (Rest: 8, 9)
  [0, 5, 1, 7, 8, 9, 6, 3], // Round 7  (Rest: 2, 4)
  [0, 2, 6, 9, 8, 7, 4, 3], // Round 8  (Rest: 1, 5)
  [2, 1, 8, 4, 5, 7, 3, 9], // Round 9  (Rest: 0, 6)
  [0, 8, 1, 9, 2, 4, 5, 6], // Round 10 (Rest: 3, 7)
  [0, 1, 4, 7, 2, 6, 5, 3], // Round 11 (Rest: 8, 9)
  [0, 9, 5, 3, 8, 1, 6, 7], // Round 12 (Rest: 2, 4)
];

// Generate matches for 4 players using Perfect Whist Tournament Matrix
function generateWhistMatches4Players(
  players: string[],
  numRounds: number,
  startRoundIndex: number = 0
): Match[] {
  if (players.length !== 4) {
    throw new Error("Whist matrix is only for 4 players");
  }

  const matches: Match[] = [];

  for (let i = 0; i < numRounds; i++) {
    const roundIndex = startRoundIndex + i;
    const matrixIndex = roundIndex % WHIST_MATRIX_4_PLAYERS.length;
    const [a1, a2, b1, b2] = WHIST_MATRIX_4_PLAYERS[matrixIndex];

    const match: Match = {
      id: generateId(),
      teamA: [players[a1], players[a2]],
      teamB: [players[b1], players[b2]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    matches.push(match);
  }

  return matches;
}

// Generate matches for 4 players with a specific first match using Whist Matrix
function generateWhistMatches4PlayersWithFirstMatch(
  players: string[],
  teamA: [string, string],
  teamB: [string, string],
  numRounds: number
): Match[] {
  if (players.length !== 4) {
    throw new Error("Whist matrix is only for 4 players");
  }

  // For 4 players, the first round in the matrix is [0, 1, 2, 3]
  // This means: index 0 & 1 are partners (teamA), index 2 & 3 are partners (teamB)
  // Reorder players to match matrix expectations
  const reorderedPlayers: string[] = [
    teamA[0], // index 0: teamA partner 1
    teamA[1], // index 1: teamA partner 2
    teamB[0], // index 2: teamB partner 1
    teamB[1], // index 3: teamB partner 2
  ];

  return generateWhistMatches4Players(reorderedPlayers, numRounds, 0);
}

// Generate matches for 5 players using Perfect Whist Tournament Matrix
function generateWhistMatches5Players(
  players: string[],
  numRounds: number,
  startRoundIndex: number = 0
): Match[] {
  if (players.length !== 5) {
    throw new Error("Whist matrix is only for 5 players");
  }

  const matches: Match[] = [];

  for (let i = 0; i < numRounds; i++) {
    const roundIndex = startRoundIndex + i;
    const matrixIndex = roundIndex % WHIST_MATRIX_5_PLAYERS.length;
    const [a1, a2, b1, b2] = WHIST_MATRIX_5_PLAYERS[matrixIndex];

    const match: Match = {
      id: generateId(),
      teamA: [players[a1], players[a2]],
      teamB: [players[b1], players[b2]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    matches.push(match);
  }

  return matches;
}

// Generate matches for 5 players with a specific first match using Whist Matrix
function generateWhistMatches5PlayersWithFirstMatch(
  players: string[],
  teamA: [string, string],
  teamB: [string, string],
  numRounds: number
): Match[] {
  if (players.length !== 5) {
    throw new Error("Whist matrix is only for 5 players");
  }

  // For 5 players, the first round in the matrix is [0, 1, 2, 3]
  // This means: index 0 & 1 are partners (teamA), index 2 & 3 are partners (teamB)
  // Index 4 is the resting player
  const firstMatchPlayers = [...teamA, ...teamB];
  const remainingPlayers = players.filter(p => !firstMatchPlayers.includes(p));

  // Build the reordered players array to match matrix expectations
  const reorderedPlayers: string[] = [
    teamA[0],              // index 0: teamA partner 1
    teamA[1],              // index 1: teamA partner 2
    teamB[0],              // index 2: teamB partner 1
    teamB[1],              // index 3: teamB partner 2
    remainingPlayers[0],   // index 4: resting player
  ];

  return generateWhistMatches5Players(reorderedPlayers, numRounds, 0);
}

// Generate matches for 7 players using Perfect Whist Tournament Matrix
function generateWhistMatches7Players(
  players: string[],
  numRounds: number,
  startRoundIndex: number = 0
): Match[] {
  if (players.length !== 7) {
    throw new Error("Whist matrix is only for 7 players");
  }

  const matches: Match[] = [];

  for (let i = 0; i < numRounds; i++) {
    const roundIndex = startRoundIndex + i;
    const matrixIndex = roundIndex % WHIST_MATRIX_7_PLAYERS.length;
    const [a1, a2, b1, b2] = WHIST_MATRIX_7_PLAYERS[matrixIndex];

    const match: Match = {
      id: generateId(),
      teamA: [players[a1], players[a2]],
      teamB: [players[b1], players[b2]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    matches.push(match);
  }

  return matches;
}

// Generate matches for 7 players with a specific first match using Whist Matrix
function generateWhistMatches7PlayersWithFirstMatch(
  players: string[],
  teamA: [string, string],
  teamB: [string, string],
  numRounds: number
): Match[] {
  if (players.length !== 7) {
    throw new Error("Whist matrix is only for 7 players");
  }

  // For 7 players, the first round in the matrix is [0, 1, 2, 4]
  // This means: index 0 & 1 are partners (teamA), index 2 & 4 are partners (teamB)
  // We need to reorder the players array so the user's selection maps to these indices:
  // - teamA[0] → index 0
  // - teamA[1] → index 1
  // - teamB[0] → index 2
  // - teamB[1] → index 4
  // - remaining players → indices 3, 5, 6

  const firstMatchPlayers = [...teamA, ...teamB];
  const remainingPlayers = players.filter(p => !firstMatchPlayers.includes(p));
  const shuffledRemaining = shuffleArray(remainingPlayers);

  // Build the reordered players array to match matrix expectations
  const reorderedPlayers: string[] = new Array(7);
  reorderedPlayers[0] = teamA[0];  // teamA partner 1
  reorderedPlayers[1] = teamA[1];  // teamA partner 2
  reorderedPlayers[2] = teamB[0];  // teamB partner 1
  reorderedPlayers[4] = teamB[1];  // teamB partner 2
  // Fill remaining indices 3, 5, 6 with shuffled remaining players
  reorderedPlayers[3] = shuffledRemaining[0];
  reorderedPlayers[5] = shuffledRemaining[1];
  reorderedPlayers[6] = shuffledRemaining[2];

  // Now generate all matches using the standard Whist matrix function
  // The first match will automatically be teamA vs teamB because of the reordering
  return generateWhistMatches7Players(reorderedPlayers, numRounds, 0);
}

// Generate matches for 8 players using Perfect Whist Tournament Matrix
function generateWhistMatches8Players(
  players: string[],
  numRounds: number,
  startRoundIndex: number = 0
): Match[] {
  if (players.length !== 8) {
    throw new Error("Whist matrix is only for 8 players");
  }

  const matches: Match[] = [];

  for (let i = 0; i < numRounds; i++) {
    const roundIndex = startRoundIndex + i;
    const matrixIndex = roundIndex % WHIST_MATRIX_8_PLAYERS.length;
    const [a1, a2, b1, b2] = WHIST_MATRIX_8_PLAYERS[matrixIndex];

    const match: Match = {
      id: generateId(),
      teamA: [players[a1], players[a2]],
      teamB: [players[b1], players[b2]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    matches.push(match);
  }

  return matches;
}

// Generate matches for 8 players with a specific first match using Whist Matrix
function generateWhistMatches8PlayersWithFirstMatch(
  players: string[],
  teamA: [string, string],
  teamB: [string, string],
  numRounds: number
): Match[] {
  if (players.length !== 8) {
    throw new Error("Whist matrix is only for 8 players");
  }

  // For 8 players, the first round in the matrix is [0, 1, 2, 3]
  // This means: index 0 & 1 are partners (teamA), index 2 & 3 are partners (teamB)
  // We need to reorder the players array so the user's selection maps to these indices:
  // - teamA[0] → index 0
  // - teamA[1] → index 1
  // - teamB[0] → index 2
  // - teamB[1] → index 3
  // - remaining players → indices 4, 5, 6, 7

  const firstMatchPlayers = [...teamA, ...teamB];
  const remainingPlayers = players.filter(p => !firstMatchPlayers.includes(p));
  const shuffledRemaining = shuffleArray(remainingPlayers);

  // Build the reordered players array to match matrix expectations
  const reorderedPlayers: string[] = [
    teamA[0],           // index 0: teamA partner 1
    teamA[1],           // index 1: teamA partner 2
    teamB[0],           // index 2: teamB partner 1
    teamB[1],           // index 3: teamB partner 2
    ...shuffledRemaining // indices 4-7: remaining players
  ];

  // Now generate all matches using the standard Whist matrix function
  // The first match will automatically be teamA vs teamB because of the reordering
  return generateWhistMatches8Players(reorderedPlayers, numRounds, 0);
}

// Generate matches for 6 players using Perfect Whist Tournament Matrix
function generateWhistMatches6Players(
  players: string[],
  numRounds: number,
  startRoundIndex: number = 0
): Match[] {
  if (players.length !== 6) {
    throw new Error("Whist matrix is only for 6 players");
  }

  const matches: Match[] = [];

  for (let i = 0; i < numRounds; i++) {
    const roundIndex = startRoundIndex + i;
    const matrixIndex = roundIndex % WHIST_MATRIX_6_PLAYERS.length;
    const [a1, a2, b1, b2] = WHIST_MATRIX_6_PLAYERS[matrixIndex];

    const match: Match = {
      id: generateId(),
      teamA: [players[a1], players[a2]],
      teamB: [players[b1], players[b2]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    matches.push(match);
  }

  return matches;
}

// Generate matches for 6 players with a specific first match using Whist Matrix
function generateWhistMatches6PlayersWithFirstMatch(
  players: string[],
  teamA: [string, string],
  teamB: [string, string],
  numRounds: number
): Match[] {
  if (players.length !== 6) {
    throw new Error("Whist matrix is only for 6 players");
  }

  // For 6 players, the first round in the matrix is [0, 1, 2, 3]
  // This means: index 0 & 1 are partners (teamA), index 2 & 3 are partners (teamB)
  // We need to reorder the players array so the user's selection maps to these indices:
  // - teamA[0] → index 0
  // - teamA[1] → index 1
  // - teamB[0] → index 2
  // - teamB[1] → index 3
  // - remaining players → indices 4, 5

  const firstMatchPlayers = [...teamA, ...teamB];
  const remainingPlayers = players.filter(p => !firstMatchPlayers.includes(p));
  const shuffledRemaining = shuffleArray(remainingPlayers);

  // Build the reordered players array to match matrix expectations
  const reorderedPlayers: string[] = [
    teamA[0],           // index 0: teamA partner 1
    teamA[1],           // index 1: teamA partner 2
    teamB[0],           // index 2: teamB partner 1
    teamB[1],           // index 3: teamB partner 2
    ...shuffledRemaining // indices 4-5: remaining players
  ];

  // Now generate all matches using the standard Whist matrix function
  // The first match will automatically be teamA vs teamB because of the reordering
  return generateWhistMatches6Players(reorderedPlayers, numRounds, 0);
}

// ============================================================================
// 2 COURTS - ROUND GENERATION
// Unlike the 1 court generators (which return a flat list of matches, one per
// round), these return complete Round objects because each round holds the two
// matches played in parallel.
// ============================================================================

// Build the two parallel matches of a single 2 court round
function buildTwoCourtMatches(players: string[], row: TwoCourtRow): Match[] {
  const [a1, a2, b1, b2, c1, c2, d1, d2] = row;

  return [
    {
      id: generateId(),
      teamA: [players[a1], players[a2]],
      teamB: [players[b1], players[b2]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    },
    {
      id: generateId(),
      teamA: [players[c1], players[c2]],
      teamB: [players[d1], players[d2]],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    },
  ];
}

// Generate rounds for 10 players on 2 courts using Perfect Whist Tournament Matrix
function generateWhistRounds10Players2Courts(
  players: string[],
  numRounds: number,
  startRoundIndex: number = 0
): Round[] {
  if (players.length !== 10) {
    throw new Error("The 2 court Whist matrix is only for 10 players");
  }

  const rounds: Round[] = [];

  for (let i = 0; i < numRounds; i++) {
    const roundIndex = startRoundIndex + i;
    const matrixIndex = roundIndex % WHIST_MATRIX_10_PLAYERS_2_COURTS.length;
    const row = WHIST_MATRIX_10_PLAYERS_2_COURTS[matrixIndex];

    const matches = buildTwoCourtMatches(players, row);
    const playingPlayers = new Set(row.map(index => players[index]));

    rounds.push({
      roundNumber: i + 1, // Callers renumber when appending to existing rounds
      matches,
      restingPlayers: players.filter(p => !playingPlayers.has(p)),
    });
  }

  return rounds;
}

// Generate 2 court rounds for any supported player count
function generateTwoCourtRounds(
  players: string[],
  numRounds: number,
  startRoundIndex: number = 0
): Round[] {
  if (players.length === 10) {
    return generateWhistRounds10Players2Courts(players, numRounds, startRoundIndex);
  }

  // 12 players is not implemented yet
  return [];
}

// Validation function to verify 2 court matrix balance (logs to console)
function validateTwoCourtBalance(rounds: Round[], players: string[]): void {
  const playCount: Record<string, number> = {};
  const partnerCount: Record<string, number> = {};
  const versusCount: Record<string, number> = {};

  players.forEach(p => { playCount[p] = 0; });
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const key = [players[i], players[j]].sort().join("+");
      partnerCount[key] = 0;
      versusCount[key] = 0;
    }
  }

  rounds.forEach(round => {
    round.matches.forEach(({ teamA, teamB }) => {
      [...teamA, ...teamB].forEach(p => { playCount[p]++; });

      partnerCount[[teamA[0], teamA[1]].sort().join("+")]++;
      partnerCount[[teamB[0], teamB[1]].sort().join("+")]++;

      for (const a of teamA) {
        for (const b of teamB) {
          versusCount[[a, b].sort().join("+")]++;
        }
      }
    });
  });

  const partnerValues = Object.values(partnerCount);
  const versusValues = Object.values(versusCount);
  const neverPartnered = Object.entries(partnerCount).filter(([, c]) => c === 0);

  console.log(`=== 2 Court Matrix Validation (${players.length} Players, ${rounds.length} Rounds) ===`);
  console.log("Matches played per player:");
  for (const [player, count] of Object.entries(playCount)) {
    console.log(`  ${player}: ${count} played, ${rounds.length - count} rested`);
  }
  console.log(
    `Partner counts: min=${Math.min(...partnerValues)} max=${Math.max(...partnerValues)}` +
    ` ${neverPartnered.length === 0 ? "✓ every pair partners at least once" : `✗ ${neverPartnered.length} pairs never partner`}`
  );
  console.log(`Versus counts: min=${Math.min(...versusValues)} max=${Math.max(...versusValues)}`);
  console.log("============================================");
}

// Validation function to verify Whist matrix balance
function validateWhistMatrixBalance(matches: Match[], players: string[]): void {
  const versusCount: Record<string, number> = {};
  const partnerCount: Record<string, number> = {};

  // Initialize counts
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const key = [players[i], players[j]].sort().join("+");
      versusCount[key] = 0;
      partnerCount[key] = 0;
    }
  }

  // Count from matches
  matches.forEach(match => {
    const { teamA, teamB } = match;

    // Partner counts
    const partnerKeyA = [teamA[0], teamA[1]].sort().join("+");
    const partnerKeyB = [teamB[0], teamB[1]].sort().join("+");
    partnerCount[partnerKeyA]++;
    partnerCount[partnerKeyB]++;

    // Versus counts (each player in teamA vs each player in teamB)
    for (const a of teamA) {
      for (const b of teamB) {
        const versusKey = [a, b].sort().join("+");
        versusCount[versusKey]++;
      }
    }
  });

  // Expected values depend on player count
  // 4 players: partner=2, versus=4 (6 rounds, each plays 6 matches)
  // 5 players: partner=2, versus=4 (10 rounds, each plays 8 matches)
  // 6 players: partner=2, versus=4 (15 rounds, each plays 10 matches)
  // 7 players: partner=2, versus=4 (21 rounds, each plays 12 matches)
  // 8 players: partner=1, versus=2 (14 rounds, each plays 7 matches)
  const getExpectedValues = (playerCount: number): { partner: number; versus: number } => {
    switch (playerCount) {
      case 4:
      case 5:
      case 6:
      case 7:
        return { partner: 2, versus: 4 };
      case 8:
        return { partner: 1, versus: 2 };
      default:
        return { partner: 2, versus: 4 };
    }
  };
  const { partner: expectedPartner, versus: expectedVersus } = getExpectedValues(players.length);

  // Log validation results
  console.log(`=== Whist Matrix Validation (${players.length} Players) ===`);
  console.log(`Partner counts (should all be ${expectedPartner}):`);
  for (const [key, count] of Object.entries(partnerCount)) {
    console.log(`  ${key}: ${count}${count !== expectedPartner ? " ✗" : " ✓"}`);
  }
  console.log(`Versus counts (should all be ${expectedVersus}):`);
  for (const [key, count] of Object.entries(versusCount)) {
    console.log(`  ${key}: ${count}${count !== expectedVersus ? " ✗" : " ✓"}`);
  }
  console.log("============================================");
}

// Generate tournament rounds with balanced pairing using Whist Matrices
export function generateTournamentRounds(
  players: string[],
  courtCount: CourtCount = 1
): Round[] {
  const totalRounds = calculateRounds(players.length, courtCount);

  if (totalRounds === 0 || players.length < 4) {
    return [];
  }

  // Shuffle players for randomized initial order
  const shuffledPlayers = shuffleArray(players);

  // 2 courts: the matrix already describes both parallel matches per round
  if (courtCount === 2) {
    const rounds = generateTwoCourtRounds(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateTwoCourtBalance(rounds, shuffledPlayers);
    return rounds;
  }

  let selectedMatches: Match[];

  // Use Perfect Whist Tournament Matrix for supported player counts (perfectly balanced)
  if (players.length === 4) {
    selectedMatches = generateWhistMatches4Players(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(selectedMatches, shuffledPlayers);
  } else if (players.length === 5) {
    selectedMatches = generateWhistMatches5Players(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(selectedMatches, shuffledPlayers);
  } else if (players.length === 6) {
    selectedMatches = generateWhistMatches6Players(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(selectedMatches, shuffledPlayers);
  } else if (players.length === 7) {
    selectedMatches = generateWhistMatches7Players(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(selectedMatches, shuffledPlayers);
  } else if (players.length === 8) {
    selectedMatches = generateWhistMatches8Players(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(selectedMatches, shuffledPlayers);
  } else {
    // Unsupported player count
    return [];
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
  teamB: [string, string],
  courtCount: CourtCount = 1
): Round[] {
  const totalRounds = calculateRounds(players.length, courtCount);

  if (totalRounds === 0 || players.length < 4) {
    return [];
  }

  // 2 courts: the selected lineup becomes Court 1 of round 1, which the matrix
  // maps to indices 0-3. Remaining players are shuffled into the other slots.
  if (courtCount === 2) {
    const selected = [...teamA, ...teamB];
    const shuffledRest = shuffleArray(players.filter(p => !selected.includes(p)));
    const orderedPlayers = [...selected, ...shuffledRest];

    const rounds = generateTwoCourtRounds(orderedPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateTwoCourtBalance(rounds, orderedPlayers);
    return rounds;
  }

  // Reorder players array so that:
  // 1. First 4 players are the selected first match players (teamA[0], teamA[1], teamB[0], teamB[1])
  // 2. Remaining players are randomized
  // This ensures the algorithm generates balanced rounds based on this player order
  // (same as how generateTournamentRounds shuffles players before generating rounds)
  const firstMatchPlayers = [...teamA, ...teamB];
  const remainingPlayers = players.filter(p => !firstMatchPlayers.includes(p));

  // Shuffle the remaining players for randomization
  const shuffledRemainingPlayers = shuffleArray(remainingPlayers);

  // Combine: first match players + shuffled remaining players
  const orderedPlayers = [...firstMatchPlayers, ...shuffledRemainingPlayers];

  let allMatches: Match[];

  // Use Perfect Whist Tournament Matrix for supported player counts (perfectly balanced)
  if (players.length === 4) {
    allMatches = generateWhistMatches4PlayersWithFirstMatch(
      orderedPlayers,
      teamA,
      teamB,
      totalRounds
    );
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(allMatches, orderedPlayers);
  } else if (players.length === 5) {
    allMatches = generateWhistMatches5PlayersWithFirstMatch(
      orderedPlayers,
      teamA,
      teamB,
      totalRounds
    );
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(allMatches, orderedPlayers);
  } else if (players.length === 6) {
    allMatches = generateWhistMatches6PlayersWithFirstMatch(
      orderedPlayers,
      teamA,
      teamB,
      totalRounds
    );
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(allMatches, orderedPlayers);
  } else if (players.length === 7) {
    allMatches = generateWhistMatches7PlayersWithFirstMatch(
      orderedPlayers,
      teamA,
      teamB,
      totalRounds
    );
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(allMatches, orderedPlayers);
  } else if (players.length === 8) {
    allMatches = generateWhistMatches8PlayersWithFirstMatch(
      orderedPlayers,
      teamA,
      teamB,
      totalRounds
    );
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(allMatches, orderedPlayers);
  } else {
    // Unsupported player count
    return [];
  }

  // Create rounds (1 match per round)
  const rounds: Round[] = [];

  for (let i = 0; i < allMatches.length; i++) {
    const match = allMatches[i];
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
    teamB,
    getCourtCount(tournament)
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

    // Array validation failed - try to salvage valid tournaments individually
    if (Array.isArray(parsed)) {
      const validTournaments: Tournament[] = [];
      for (const item of parsed) {
        const itemResult = TournamentSchema.safeParse(item);
        if (itemResult.success) {
          validTournaments.push(itemResult.data as Tournament);
        } else {
          console.warn("Skipping corrupted tournament:", item?.id, item?.name, itemResult.error.message);
        }
      }

      // Update localStorage with only valid tournaments to fix corruption
      if (validTournaments.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validTournaments));
      }

      return validTournaments;
    }

    // Data is not an array - completely corrupted
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

  const courtCount = getCourtCount(tournament);

  // Only generate rounds for Standard Americano (currently supported)
  // Other team types will have empty rounds until their logic is implemented
  const rounds = isTeamTypeSupported(tournament.teamType)
    ? generateTournamentRounds(sanitizedPlayers, courtCount)
    : [];

  const newTournament: Tournament = {
    ...tournament,
    name: sanitizedName,
    players: sanitizedPlayers,
    courtCount,
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

// Check if any round has been scored
export function hasAnyScoredRound(tournament: Tournament): boolean {
  return tournament.rounds.some(round =>
    round.matches.some(match => match.isCompleted)
  );
}

// Update tournament info (name and point type)
// Returns the updated tournament, or null if not found
// If pointType changes and there are scored rounds, all scores will be reset
export function updateTournamentInfo(
  tournamentId: string,
  name: string,
  pointType: string,
  resetScores: boolean = false
): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  // Sanitize the name
  const sanitizedName = sanitizeString(name);

  // Update name
  tournament.name = sanitizedName;

  // If point type changed and we need to reset scores
  if (resetScores || tournament.pointType !== pointType) {
    // Reset all scores if there are any scored rounds and point type changed
    if (tournament.pointType !== pointType && hasAnyScoredRound(tournament)) {
      tournament.rounds.forEach(round => {
        round.matches.forEach(match => {
          match.scoreA = null;
          match.scoreB = null;
          match.isCompleted = false;
        });
      });
    }
    tournament.pointType = pointType;
  }

  updateTournament(tournament);
  return tournament;
}

// Update match score
export function updateMatchScore(
  tournamentId: string,
  roundNumber: number,
  matchId: string,
  scoreA: number | null,
  scoreB: number | null
): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  const round = tournament.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) return null;

  const match = round.matches.find(m => m.id === matchId);
  if (!match) return null;

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.isCompleted = scoreA !== null && scoreB !== null;

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
  const courtCount = getCourtCount(tournament);
  const additionalRoundsCount = calculateExtendedRounds(playerCount, courtCount);

  if (additionalRoundsCount === 0) return null;

  // Generate additional rounds using the existing fair pairing logic
  const additionalRounds = generateAdditionalRounds(
    tournament.players,
    tournament.rounds,
    additionalRoundsCount,
    courtCount
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
  additionalRoundsCount: number,
  courtCount: CourtCount = 1
): Round[] {
  // Shuffle players for the new set of rounds
  // Each set is self-contained via the Whist matrix, so reshuffling
  // produces fresh matchups while maintaining balance within the new set
  const orderedPlayers = shuffleArray(players);

  const startingRoundIndex = existingRounds.length;

  // 2 courts: the matrix produces complete rounds directly
  if (courtCount === 2) {
    return generateTwoCourtRounds(orderedPlayers, additionalRoundsCount, startingRoundIndex);
  }

  let selectedMatches: Match[];

  // Use Perfect Whist Tournament Matrix for supported player counts (perfectly balanced)
  if (players.length === 4) {
    selectedMatches = generateWhistMatches4Players(
      orderedPlayers,
      additionalRoundsCount,
      startingRoundIndex
    );
  } else if (players.length === 5) {
    selectedMatches = generateWhistMatches5Players(
      orderedPlayers,
      additionalRoundsCount,
      startingRoundIndex
    );
  } else if (players.length === 6) {
    selectedMatches = generateWhistMatches6Players(
      orderedPlayers,
      additionalRoundsCount,
      startingRoundIndex
    );
  } else if (players.length === 7) {
    selectedMatches = generateWhistMatches7Players(
      orderedPlayers,
      additionalRoundsCount,
      startingRoundIndex
    );
  } else if (players.length === 8) {
    selectedMatches = generateWhistMatches8Players(
      orderedPlayers,
      additionalRoundsCount,
      startingRoundIndex
    );
  } else {
    // Unsupported player count
    return [];
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
  tournament.completedAt = new Date().toISOString();
  updateTournament(tournament);
  return tournament;
}

// ============================================================================
// PLAYER MANAGEMENT FUNCTIONS
// ============================================================================

// Rename a player in the tournament
// Updates player name in all rounds (scored or not)
export function renamePlayer(
  tournamentId: string,
  oldName: string,
  newName: string
): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  // Sanitize the new name
  const sanitizedNewName = sanitizeString(newName);

  // Check if old name exists
  const playerIndex = tournament.players.findIndex(p => p === oldName);
  if (playerIndex === -1) return null;

  // Check if new name is different
  if (oldName === sanitizedNewName) return tournament;

  // Check for duplicate names (case-insensitive)
  const isDuplicate = tournament.players.some(
    (p, i) => i !== playerIndex && p.toLowerCase() === sanitizedNewName.toLowerCase()
  );
  if (isDuplicate) return null;

  // Update player name in players array
  tournament.players[playerIndex] = sanitizedNewName;

  // Update player name in all rounds
  tournament.rounds.forEach(round => {
    round.matches.forEach(match => {
      // Update in teamA
      match.teamA = match.teamA.map(p => p === oldName ? sanitizedNewName : p);
      // Update in teamB
      match.teamB = match.teamB.map(p => p === oldName ? sanitizedNewName : p);
    });
    // Update in resting players
    round.restingPlayers = round.restingPlayers.map(p => p === oldName ? sanitizedNewName : p);
  });

  // Update playerGenders if exists (for Mix Americano)
  if (tournament.playerGenders && tournament.playerGenders[oldName]) {
    tournament.playerGenders[sanitizedNewName] = tournament.playerGenders[oldName];
    delete tournament.playerGenders[oldName];
  }

  updateTournament(tournament);
  return tournament;
}

// Add new players to a tournament and regenerate rounds
export function addPlayersToTournament(
  tournamentId: string,
  newPlayers: string[]
): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  // Only allow for Standard Americano (not Mix Americano which has fixed player count)
  if (tournament.teamType !== "standard") return null;

  // 2 court tournaments have a fixed roster (10 or 12) - no add/remove
  if (getCourtCount(tournament) === 2) return null;

  // Sanitize new player names
  const sanitizedNewPlayers = sanitizeStringArray(newPlayers);

  // Check player limits
  const totalPlayers = tournament.players.length + sanitizedNewPlayers.length;
  if (totalPlayers > MAX_PLAYERS) return null;

  // Check for duplicate names
  const existingLowerCase = tournament.players.map(p => p.toLowerCase());
  const hasDuplicates = sanitizedNewPlayers.some(
    p => existingLowerCase.includes(p.toLowerCase())
  );
  if (hasDuplicates) return null;

  // Add new players
  tournament.players = [...tournament.players, ...sanitizedNewPlayers];

  // Regenerate all rounds
  const newRounds = generateTournamentRounds(tournament.players);
  tournament.rounds = newRounds;

  // Reset tournament state
  tournament.hasExtended = false;
  tournament.isEnded = false;

  updateTournament(tournament);
  return tournament;
}

// Remove a player from a tournament and regenerate rounds
export function removePlayerFromTournament(
  tournamentId: string,
  playerName: string
): Tournament | null {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) return null;

  // Only allow for Standard Americano (not Mix Americano which has fixed player count)
  if (tournament.teamType !== "standard") return null;

  // 2 court tournaments have a fixed roster (10 or 12) - no add/remove
  if (getCourtCount(tournament) === 2) return null;

  // Check player limits
  if (tournament.players.length <= MIN_PLAYERS) return null;

  // Check if player exists
  const playerIndex = tournament.players.findIndex(p => p === playerName);
  if (playerIndex === -1) return null;

  // Remove player
  tournament.players = tournament.players.filter(p => p !== playerName);

  // Regenerate all rounds
  const newRounds = generateTournamentRounds(tournament.players);
  tournament.rounds = newRounds;

  // Reset tournament state
  tournament.hasExtended = false;
  tournament.isEnded = false;

  updateTournament(tournament);
  return tournament;
}
