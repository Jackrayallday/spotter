import { pool } from "./lib/db.js";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT goal, experience, days_per_week, session_length, equipment, injuries, preferred_split
       FROM user_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );

    const profile = result.rows[0];

    if (!profile) {
      return json({ error: "Profile not found" }, { status: 404 });
    }

    return json({
      goal: profile.goal,
      experience: profile.experience,
      daysPerWeek: profile.days_per_week,
      sessionLength: profile.session_length,
      equipment: profile.equipment,
      injuries: profile.injuries,
      preferredSplit: profile.preferred_split,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, ...profileData } = await request.json();

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    const {
      goal,
      experience,
      daysPerWeek,
      sessionLength,
      equipment,
      injuries,
      preferredSplit,
    } = profileData;

    if (!goal || !experience || !daysPerWeek || !sessionLength || !equipment || !preferredSplit) {
      return json({ error: "Missing required profile fields" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO user_profiles (
        user_id,
        goal,
        experience,
        days_per_week,
        session_length,
        equipment,
        injuries,
        preferred_split,
        update_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        goal = EXCLUDED.goal,
        experience = EXCLUDED.experience,
        days_per_week = EXCLUDED.days_per_week,
        session_length = EXCLUDED.session_length,
        equipment = EXCLUDED.equipment,
        injuries = EXCLUDED.injuries,
        preferred_split = EXCLUDED.preferred_split,
        update_at = NOW()`,
      [
        userId,
        goal,
        experience,
        daysPerWeek,
        sessionLength,
        equipment,
        injuries || null,
        preferredSplit,
      ],
    );

    return json({ success: true });
  } catch (error) {
    console.error("Error in profile route:", error);
    return json({ error: "Failed to save profile" }, { status: 500 });
  }
}
