// Tournament types and utilities
import { match } from "assert";
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

// ============================================================================
// ROUND ROBIN ROTATION ALGORITHM
// Uses deterministic rotation to ensure every player partners with and
// plays against every other player. No subgroups are formed.
// ============================================================================

// Generate a unique key for a player pair (order-independent)
function getPairKey(player1: string, player2: string): string {
  return [player1, player2].sort().join("+");
}

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

// Match template interface
interface MatchTemplate {
  teamA: [string, string];
  teamB: [string, string];
}

// Tracking state for balancing
interface RoundRobinState {
  playCount: Record<string, number>;
  lastPlayedRound: Record<string, number>;
  partnerCount: Record<string, number>;
  opponentCount: Record<string, number>;
}

// Initialize tracking state
function initializeState(players: string[]): RoundRobinState {
  const state: RoundRobinState = {
    playCount: {},
    lastPlayedRound: {},
    partnerCount: {},
    opponentCount: {},
  };

  players.forEach(player => {
    state.playCount[player] = 0;
    state.lastPlayedRound[player] = -Infinity;
  });

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const key = getPairKey(players[i], players[j]);
      state.partnerCount[key] = 0;
      state.opponentCount[key] = 0;
    }
  }
  return state;
}

// Update state after a match
function updateState(
  state: RoundRobinState,
  match: MatchTemplate,
  roundIndex: number
): void {
  const { teamA, teamB } = match;

  [...teamA, ...teamB].forEach(player => {
    state.playCount[player]++;
    state.lastPlayedRound[player] = roundIndex;
  });

  state.partnerCount[getPairKey(teamA[0], teamA[1])]++;
  state.partnerCount[getPairKey(teamB[0], teamB[1])]++;

  state.opponentCount[getPairKey(teamA[0], teamB[0])]++;
  state.opponentCount[getPairKey(teamA[0], teamB[1])]++;
  state.opponentCount[getPairKey(teamA[1], teamB[0])]++;
  state.opponentCount[getPairKey(teamA[1], teamB[1])]++;
}

// ============================================================================
// ROTATION-BASED ROUND GENERATION
// Uses cross-pairing strategy: when play counts are balanced, previous
// partners become opponents in next round. This ensures maximum mixing.
// ============================================================================

// Check if all play counts are balanced (all equal or differ by at most 1)
function isPlayCountBalanced(state: RoundRobinState, players: string[]): boolean {
  const counts = players.map(p => state.playCount[p]);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  return max - min <= 1;
}

// Get previous match for cross-pairing reference
function getPreviousMatch(matches: Match[]): Match | null {
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

// Generate all possible 4-player selections from player list
function generatePlayerSelections(players: string[]): string[][] {
  const n = players.length;
  const selections: string[][] = [];

  // Generate all combinations of 4 players
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          selections.push([players[i], players[j], players[k], players[l]]);
        }
      }
    }
  }

  return selections;
}

// Score a pairing based on partner/opponent balance and cross-pairing
function scorePairing(
  pairing: MatchTemplate,
  state: RoundRobinState,
  previousMatch: Match | null
): number {
  const { teamA, teamB } = pairing;
  let score = 0;

  // Partner balance: prefer new partnerships
  const partnerScoreA = state.partnerCount[getPairKey(teamA[0], teamA[1])];
  const partnerScoreB = state.partnerCount[getPairKey(teamB[0], teamB[1])];
  score += (partnerScoreA + partnerScoreB) * 10000;

  // Opponent balance: prefer new opponents
  const opponentScore =
    state.opponentCount[getPairKey(teamA[0], teamB[0])] +
    state.opponentCount[getPairKey(teamA[0], teamB[1])] +
    state.opponentCount[getPairKey(teamA[1], teamB[0])] +
    state.opponentCount[getPairKey(teamA[1], teamB[1])];
  score += opponentScore * 100;

  // Cross-pairing bonus: if previous partners are now opponents, reduce score
  if (previousMatch) {
    const prevTeamA = previousMatch.teamA;
    const prevTeamB = previousMatch.teamB;

    // Check if any previous partnership is now an opposition
    const allPlayers = [...teamA, ...teamB];
    const prevPlayers = [...prevTeamA, ...prevTeamB];

    // If same 4 players, check for cross-pairing
    const sameGroup =
      allPlayers.every(p => prevPlayers.includes(p)) &&
      prevPlayers.every(p => allPlayers.includes(p));

    if (sameGroup) {
      // Previous partners should now be opponents (cross-pairing)
      const prevPartnerKeyA = getPairKey(prevTeamA[0], prevTeamA[1]);
      const prevPartnerKeyB = getPairKey(prevTeamB[0], prevTeamB[1]);

      // Check if previous teamA partners are now opponents
      const teamAOpponentsKeys = [
        getPairKey(teamA[0], teamB[0]),
        getPairKey(teamA[0], teamB[1]),
        getPairKey(teamA[1], teamB[0]),
        getPairKey(teamA[1], teamB[1]),
      ];

      // Bonus for cross-pairing (previous partners are now opponents)
      if (teamAOpponentsKeys.includes(prevPartnerKeyA)) {
        score -= 5000; // Bonus for cross-pairing
      }
      if (teamAOpponentsKeys.includes(prevPartnerKeyB)) {
        score -= 5000; // Bonus for cross-pairing
      }
    }
  }
  return score;
}

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
// - Each pair partners exactly 2 times
// - Each pair opposes exactly 4 times
// - Each player plays exactly 10 matches

const WHIST_MATRIX_6_PLAYERS: [number, number, number, number][] = [
  [0, 1, 2, 3], 
  [4, 5, 0, 1], 
  [2, 3, 4, 5], 

  [0, 2, 1, 4], 
  [3, 5, 0, 2], 
  [1, 4, 3, 5], 

  [0, 3, 1, 5], 
  [2, 4, 0, 3], 
  [1, 5, 2, 4], 

  [0, 4, 2, 5], 
  [1, 3, 0, 4], 
  [2, 5, 1, 3], 

  [0, 5, 3, 4], 
  [1, 2, 0, 5], 
  [3, 4, 1, 2]  

  /*[0, 1, 2, 3], // Round 1:  (0,1) vs (2,3) | Rest: 4,5
  [2, 3, 4, 5], // Round 2:  (0,1) vs (2,4) | Rest: 3,5
  [4, 5, 0, 1], // Round 3:  (0,2) vs (1,5) | Rest: 3,4

  [0, 2, 1, 3], // Round 4:  (0,3) vs (1,4) | Rest: 2,5
  [2, 4, 3, 5], // Round 5:  (0,3) vs (1,5) | Rest: 2,4
  [4, 0, 5, 1], // Round 6:  (0,5) vs (1,4) | Rest: 2,3

  [0, 2, 3, 4], // Round 7:  (0,2) vs (3,4) | Rest: 1,5
  [0, 5, 2, 3], // Round 8:  (0,5) vs (2,3) | Rest: 1,4
  [0, 4, 2, 5], // Round 9:  (0,4) vs (2,5) | Rest: 1,3
  
  [0, 4, 3, 5], // Round 10: (0,4) vs (3,5) | Rest: 1,2
  [1, 2, 3, 4], // Round 11: (1,2) vs (3,4) | Rest: 0,5
  [1, 3, 2, 5], // Round 12: (1,3) vs (2,5) | Rest: 0,4

  [1, 2, 4, 5], // Round 13: (1,2) vs (4,5) | Rest: 0,3
  [1, 3, 4, 5], // Round 14: (1,3) vs (4,5) | Rest: 0,2
  [2, 4, 3, 5], // Round 15: (2,4) vs (3,5) | Rest: 0,1*/
];

// ============================================================================
// PERFECT WHIST TOURNAMENT MATRIX FOR 8 PLAYERS
// This ensures perfectly balanced pairing:
// - Each player plays exactly 7 matches
// - Each player partners with everyone else exactly 1 time
// - Each player opposes everyone else exactly 2 times
// ============================================================================

// Perfect Whist Tournament Matrix for 8 players (14 rounds)
// Format: [teamA[0], teamA[1], teamB[0], teamB[1]] using indices 0-7
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

/*const WHIST_MATRIX_8_PLAYERS: [number, number, number, number][] = [
  [0, 1, 2, 3], // Round 1:  (0,1) vs (2,3) | Rest: 4,5,6,7
  [0, 2, 1, 4], // Round 2:  (0,2) vs (1,4) | Rest: 3,5,6,7
  [0, 3, 4, 5], // Round 3:  (0,3) vs (4,5) | Rest: 1,2,6,7
  [0, 4, 6, 7], // Round 4:  (0,4) vs (6,7) | Rest: 1,2,3,5
  [0, 5, 2, 6], // Round 5:  (0,5) vs (2,6) | Rest: 1,3,4,7
  [0, 6, 1, 7], // Round 6:  (0,6) vs (1,7) | Rest: 2,3,4,5
  [0, 7, 3, 5], // Round 7:  (0,7) vs (3,5) | Rest: 1,2,4,6
  [1, 2, 5, 7], // Round 8:  (1,2) vs (5,7) | Rest: 0,3,4,6
  [1, 3, 5, 6], // Round 9:  (1,3) vs (5,6) | Rest: 0,2,4,7
  [1, 5, 4, 7], // Round 10: (1,5) vs (4,7) | Rest: 0,2,3,6
  [1, 6, 3, 4], // Round 11: (1,6) vs (3,4) | Rest: 0,2,5,7
  [2, 4, 3, 7], // Round 12: (2,4) vs (3,7) | Rest: 0,1,5,6
  [2, 5, 4, 6], // Round 13: (2,5) vs (4,6) | Rest: 0,1,3,7
  [2, 7, 3, 6], // Round 14: (2,7) vs (3,6) | Rest: 0,1,4,5
];*/

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

  const matches: Match[] = [];

  // Create the first match with user-specified teams
  const firstMatch: Match = {
    id: generateId(),
    teamA: [...teamA],
    teamB: [...teamB],
    scoreA: 0,
    scoreB: 0,
    isCompleted: false,
  };
  matches.push(firstMatch);

  // Generate remaining matches using the Whist matrix starting from round 2
  for (let i = 1; i < numRounds; i++) {
    const matrixIndex = i % WHIST_MATRIX_8_PLAYERS.length;
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

  const matches: Match[] = [];

  // Create the first match with user-specified teams
  const firstMatch: Match = {
    id: generateId(),
    teamA: [...teamA],
    teamB: [...teamB],
    scoreA: 0,
    scoreB: 0,
    isCompleted: false,
  };
  matches.push(firstMatch);

  // Generate remaining matches using the Whist matrix starting from round 2
  for (let i = 1; i < numRounds; i++) {
    const matrixIndex = i % WHIST_MATRIX_6_PLAYERS.length;
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
  // 6 players: partner=2, versus=4
  // 8 players: partner=1, versus=2
  const expectedPartner = players.length === 6 ? 2 : 1;
  const expectedVersus = players.length === 6 ? 4 : 2;

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

// Generate matches using balanced rotation with cross-pairing
function generateRotationMatches(
  players: string[],
  numRounds: number,
  state: RoundRobinState,
  startRoundIndex: number = 0
): Match[] {
  const matches: Match[] = [];

  for (let round = 0; round < numRounds; round++) {
    const roundIndex = startRoundIndex + round;
    const previousMatch = getPreviousMatch(matches);

    // Check if play counts are balanced
    const balanced = isPlayCountBalanced(state, players);

    let selectedPlayers: string[];

    if (balanced && previousMatch) {
      // Play counts balanced: apply cross-pairing with same or rotated players
      // First, try to use players who haven't partnered/opposed each other yet
      const allSelections = generatePlayerSelections(players);

      // Score each selection
      let bestSelection = allSelections[0];
      let bestSelectionScore = Infinity;

      for (const selection of allSelections) {
        // Calculate how many new partnerships/opponents this selection enables
        let selectionScore = 0;

        // Prefer selections that maximize new partnership opportunities
        for (let i = 0; i < selection.length; i++) {
          for (let j = i + 1; j < selection.length; j++) {
            const key = getPairKey(selection[i], selection[j]);
            // Lower partner + opponent count = better
            selectionScore += state.partnerCount[key] * 100;
            selectionScore += state.opponentCount[key] * 10;
          }
        }

        // Balance play counts (slight penalty for high play count players)
        for (const player of selection) {
          selectionScore += state.playCount[player] * 1000;
        }

        if (selectionScore < bestSelectionScore) {
          bestSelectionScore = selectionScore;
          bestSelection = selection;
        }
      }

      selectedPlayers = bestSelection;
    } else {
      // Play counts NOT balanced: prioritize lowest play count players
      const playersByPlayCount = [...players].sort((a, b) => {
        const playDiff = state.playCount[a] - state.playCount[b];
        if (playDiff !== 0) return playDiff;

        // Tiebreaker: longest rest time
        const restA = roundIndex - state.lastPlayedRound[a];
        const restB = roundIndex - state.lastPlayedRound[b];
        return restB - restA;
      });

      selectedPlayers = playersByPlayCount.slice(0, 4);
    }

    // Generate all 3 possible pairings for selected 4 players
    const [p1, p2, p3, p4] = selectedPlayers;
    const possiblePairings: MatchTemplate[] = [
      { teamA: [p1, p2], teamB: [p3, p4] },
      { teamA: [p1, p3], teamB: [p2, p4] },
      { teamA: [p1, p4], teamB: [p2, p3] },
    ];

    // Score each pairing and pick the best
    let bestPairing = possiblePairings[0];
    let bestScore = Infinity;

    for (const pairing of possiblePairings) {
      const score = scorePairing(pairing, state, previousMatch);

      if (score < bestScore) {
        bestScore = score;
        bestPairing = pairing;
      }
    }

    // Create the match
    const match: Match = {
      id: generateId(),
      teamA: [...bestPairing.teamA],
      teamB: [...bestPairing.teamB],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    matches.push(match);

    // Update state
    updateState(state, bestPairing, roundIndex);
  }

  return matches;
}

// Generate tournament rounds with balanced pairing using Round Robin Rotation
export function generateTournamentRounds(players: string[]): Round[] {
  const totalRounds = calculateRounds(players.length);

  if (totalRounds === 0 || players.length < 4) {
    return [];
  }

  // Shuffle players for randomized initial order
  const shuffledPlayers = shuffleArray(players);

  let selectedMatches: Match[];

  // Use Perfect Whist Tournament Matrix for 6 and 8 players (perfectly balanced)
  if (players.length === 6) {
    selectedMatches = generateWhistMatches6Players(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(selectedMatches, shuffledPlayers);
  } else if (players.length === 8) {
    selectedMatches = generateWhistMatches8Players(shuffledPlayers, totalRounds, 0);
    // Validate the balance (will log to console)
    validateWhistMatrixBalance(selectedMatches, shuffledPlayers);
  } else {
    // Use rotation algorithm for other player counts
    const state = initializeState(shuffledPlayers);
    selectedMatches = generateRotationMatches(
      shuffledPlayers,
      totalRounds,
      state,
      0
    );
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

  // Use Perfect Whist Tournament Matrix for 6 and 8 players (perfectly balanced)
  if (players.length === 6) {
    allMatches = generateWhistMatches6PlayersWithFirstMatch(
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
    // Use rotation algorithm for other player counts
    const state = initializeState(orderedPlayers);

    // Create the first match with the user-specified teams (exact pairing)
    const firstMatch: Match = {
      id: generateId(),
      teamA: [...teamA],
      teamB: [...teamB],
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    };

    // Update state for first match
    const firstMatchTemplate: MatchTemplate = { teamA, teamB };
    updateState(state, firstMatchTemplate, 0);

    // Generate remaining matches using Rotation algorithm with ordered players
    // Starting from round index 1 since first match is already created
    const remainingMatches = generateRotationMatches(
      orderedPlayers,
      totalRounds - 1,
      state,
      1
    );

    // Combine first match with remaining matches
    allMatches = [firstMatch, ...remainingMatches];
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
  // Do NOT shuffle players when extending tournament
  // The existing rounds already established the pairing history
  // Shuffling would break the balance tracking
  const orderedPlayers = [...players];

  const startingRoundIndex = existingRounds.length;
  let selectedMatches: Match[];

  // Use Perfect Whist Tournament Matrix for 6 and 8 players (perfectly balanced)
  if (players.length === 6) {
    selectedMatches = generateWhistMatches6Players(
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
    // Initialize state from existing rounds with ordered players
    const state = initializeState(orderedPlayers);

    // Rebuild state from existing rounds
    existingRounds.forEach((round, roundIndex) => {
      round.matches.forEach(match => {
        const template: MatchTemplate = {
          teamA: match.teamA as [string, string],
          teamB: match.teamB as [string, string],
        };
        updateState(state, template, roundIndex);
      });
    });

    // Generate additional matches using Rotation algorithm with ordered players
    selectedMatches = generateRotationMatches(
      orderedPlayers,
      additionalRoundsCount,
      state,
      startingRoundIndex
    );
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
