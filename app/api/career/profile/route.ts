import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: server client (NOT browser client)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

// GET handler - fetches the current user's profile
export async function GET(req: Request) {
  try {
    console.log("=== GET /api/career/profile START ===");
    
    // Get user_id from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    
    console.log("UserId from query:", userId);
    
    if (!userId) {
      console.error("No user_id provided");
      return NextResponse.json(
        { error: "Missing user_id parameter" },
        { status: 400 }
      );
    }

    // First, let's test if we can connect to Supabase at all
    console.log("Attempting to query career_profiles table...");
    
    const { data, error } = await supabase
      .from("career_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 500 }
      );
    }

    console.log("Query successful. Profile found:", !!data);
    
    return NextResponse.json({ profile: data });
    
  } catch (err: any) {
    console.error("Server crash:", err);
    console.error("Stack:", err.stack);
    return NextResponse.json(
      { error: "Internal server error: " + err.message },
      { status: 500 }
    );
  }
}

// POST handler - saves/updates the user's profile
export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Incoming profile:", body);

    const {
      user_id,
      full_name,
      current_level,
      field_of_study,
      institution,
      graduation_year,
      target_career,
      target_industry,
      career_goals,
      location,
      work_experience,
      skills,
      certifications,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 },
      );
    }

    // First check if profile already exists
    // Check if profile already exists (get the first one)
    const { data: existingProfile } = await supabase
     .from("career_profiles")
     .select("id")
     .eq("user_id", user_id)
     .maybeSingle();  // This now works because we only have 1 profile

  let result;

if (existingProfile) {
  // Update existing profile
  result = await supabase
    .from("career_profiles")
    .update({
      full_name,
      current_level,
      field_of_study,
      institution,
      graduation_year,
      target_career,
      target_industry,
      career_goals,
      location,
      work_experience,
      skills,
      certifications,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingProfile.id)
    .select()
    .single();
} else {
  // Insert new profile
  result = await supabase
    .from("career_profiles")
    .insert({
      user_id,
      full_name,
      current_level,
      field_of_study,
      institution,
      graduation_year,
      target_career,
      target_industry,
      career_goals,
      location,
      work_experience,
      skills,
      certifications,
    })
    .select()
    .single();
}

    const { data, error } = result;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("Server crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}