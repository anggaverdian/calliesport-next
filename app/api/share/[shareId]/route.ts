import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isValidShareId } from "@/utils/share";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    console.log("[share/GET] Fetching shareId:", shareId);

    // Validate share ID format
    if (!isValidShareId(shareId)) {
      console.log("[share/GET] Invalid share ID format:", shareId);
      return NextResponse.json(
        { success: false, error: "Invalid share ID format" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shared_tournaments")
      .select("tournament_data")
      .eq("share_id", shareId)
      .single();

    if (error) {
      console.log("[share/GET] Supabase error:", error.message, error.code);
      return NextResponse.json(
        { success: false, error: "Tournament not found", details: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      console.log("[share/GET] No data found for shareId:", shareId);
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      );
    }

    console.log("[share/GET] Successfully fetched tournament");
    return NextResponse.json({
      success: true,
      tournament: data.tournament_data,
    });
  } catch (err) {
    console.error("[share/GET] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tournament",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
