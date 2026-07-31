import { z } from "zod";

// Player with gender for Mix Americano
export const MixPlayerSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  gender: z.enum(["male", "female"]),
});

export type MixPlayerFormData = z.infer<typeof MixPlayerSchema>;

export const createTournamentSchema = z.object({
  tournamentName: z
    .string()
    .min(4, "Tournament name must be 3 to 64 characters")
    .max(64, "Tournament name must be 3 to 64 characters"),
  teamType: z.string(),
  pointType: z.string(),
  // 1 court = 4-8 players, 2 courts = 10 or 12 players.
  // The exact player count rule depends on court count and team type, so it is
  // validated on submit in the create form (see validatePlayers there).
  courtCount: z.union([z.literal(1), z.literal(2)]),
  players: z.array(z.string()),
  // Mix Americano specific: player genders
  mixPlayers: z
    .array(MixPlayerSchema)
    .optional(),
});

export type CreateTournamentFormData = z.infer<typeof createTournamentSchema>;

// ============================================================================
// LOCALSTORAGE VALIDATION SCHEMAS
// Used to validate data integrity when reading from localStorage
// ============================================================================

const MatchSchema = z.object({
  id: z.string(),
  teamA: z.array(z.string()),
  teamB: z.array(z.string()),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  isCompleted: z.boolean(),
});

const RoundSchema = z.object({
  roundNumber: z.number(),
  matches: z.array(MatchSchema),
  restingPlayers: z.array(z.string()),
});

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string(),
  teamType: z.enum(["standard", "mix", "team", "mexicano"]),
  pointType: z.string(),
  players: z.array(z.string()),
  playerGenders: z.record(z.string(), z.enum(["male", "female"])).optional(), // For Mix Americano
  courtCount: z.union([z.literal(1), z.literal(2)]).optional(), // Undefined = 1 court (legacy)
  rounds: z.array(RoundSchema),
  createdAt: z.string(),
  hasExtended: z.boolean().optional(),
  isEnded: z.boolean().optional(),
  completedAt: z.string().optional(),
  shareId: z.string().optional(),
});

export const TournamentsArraySchema = z.array(TournamentSchema);

export type ValidatedTournament = z.infer<typeof TournamentSchema>;

// ============================================================================
// INPUT SANITIZATION
// Prevents XSS by removing potentially dangerous characters from user input
// ============================================================================

/**
 * Sanitizes a string by removing HTML tags and dangerous characters.
 * Used to clean user input before storing or rendering.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets (prevents HTML injection)
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers like onclick=, onerror=
    .trim();
}

/**
 * Sanitizes an array of strings (e.g., player names).
 */
export function sanitizeStringArray(inputs: string[]): string[] {
  return inputs.map(sanitizeString);
}
