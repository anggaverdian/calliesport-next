import { z } from "zod";

export const createTournamentSchema = z.object({
  tournamentName: z
    .string()
    .min(4, "Tournament name must be 1 to 64 characters")
    .max(64, "Tournament name must be 1 to 64 characters"),
  teamType: z.string(),
  pointType: z.string(),
  players: z
    .array(z.string())
    .min(4, "Add at least 4 players")
    .max(12, "Maximum 12 players allowed"),
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

const TournamentSchema = z.object({
  id: z.string(),
  name: z.string(),
  teamType: z.enum(["standard", "mix", "team", "mexicano"]),
  pointType: z.string(),
  players: z.array(z.string()),
  rounds: z.array(RoundSchema),
  createdAt: z.string(),
  hasExtended: z.boolean().optional(),
  isEnded: z.boolean().optional(),
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
