import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Test 1: Check if we can connect to Supabase
    const { data, error } = await getSupabase()
      .from("shared_tournaments")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Connection failed",
          error: error.message,
          hint: error.hint || "Make sure you created the shared_tournaments table in Supabase",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful!",
      tableExists: true,
      rowCount: data?.length || 0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
