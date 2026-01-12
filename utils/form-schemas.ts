import { z } from "zod";

export const createTournamentSchema = z.object({
  tournamentName: z
    .string()
    .min(4, "Tournament name must be 1 to 61 characters")
    .max(64, "Tournament name must be 1 to 61 characters"),
  teamType: z.string(),
  pointType: z.string(),
  players: z
    .array(z.string())
    .min(4, "Add at least 4 players")
    .max(12, "Maximum 12 players allowed"),
});

export type CreateTournamentFormData = z.infer<typeof createTournamentSchema>;
