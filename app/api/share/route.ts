import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { generateShareId } from "@/utils/share";

// Tournament validation schema (matches localStorage schema)
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
  playerGenders: z.record(z.string(), z.enum(["male", "female"])).optional(),
  rounds: z.array(RoundSchema),
  createdAt: z.string(),
  hasExtended: z.boolean().optional(),
  isEnded: z.boolean().optional(),
  completedAt: z.string().optional(),
  shareId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate tournament data
    const validationResult = TournamentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid tournament data",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const tournamentData = validationResult.data;

    // If tournament already has a shareId, upsert the record
    if (tournamentData.shareId) {
      const { error } = await getSupabase()
        .from("shared_tournaments")
        .upsert(
          {
            share_id: tournamentData.shareId,
            tournament_data: tournamentData,
          },
          { onConflict: "share_id" }
        );

      if (error) {
        console.log("[share/POST] Upsert error:", error.message, error.code);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to update share link",
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        shareId: tournamentData.shareId,
      });
    }

    // Generate new share ID for first-time sharing
    const shareId = generateShareId();

    // Insert into Supabase
    const { error } = await getSupabase().from("shared_tournaments").insert({
      share_id: shareId,
      tournament_data: tournamentData,
    });

    if (error) {
      // Handle unique constraint violation (retry with new ID)
      if (error.code === "23505") {
        const retryShareId = generateShareId();
        const { error: retryError } = await getSupabase()
          .from("shared_tournaments")
          .insert({
            share_id: retryShareId,
            tournament_data: tournamentData,
          });

        if (retryError) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create share link",
              details: retryError.message,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          shareId: retryShareId,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create share link",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shareId,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
