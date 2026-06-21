import { generateTrainingPlan } from "../lib/ai.js";
import { pool } from "../lib/db.js";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    const profileResult = await pool.query(
      `SELECT goal, experience, days_per_week, session_length, equipment, injuries, preferred_split
       FROM user_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );

    const profile = profileResult.rows[0];

    if (!profile) {
      return json(
        { error: "User profile not found. Complete onboarding first" },
        { status: 400 },
      );
    }

    const latestPlanResult = await pool.query(
      `SELECT version
       FROM training_plan
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );

    const latestPlan = latestPlanResult.rows[0];
    const nextVersion = latestPlan ? Number(latestPlan.version) + 1 : 1;
    let planJson;

    try {
      planJson = await generateTrainingPlan(profile);
    } catch (error) {
      console.error("AI gen failed", error);
      return json(
        {
          error: "Failed to generate training plan. Please try again",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }

    const planText = JSON.stringify(planJson, null, 2);
    const newPlanResult = await pool.query(
      `INSERT INTO training_plan (user_id, plan_json, plan_text, version)
       VALUES ($1, $2::jsonb, $3, $4)
       RETURNING id, version, created_at`,
      [userId, JSON.stringify(planJson), planText, nextVersion],
    );

    const newPlan = newPlanResult.rows[0];

    return json({
      id: newPlan.id,
      version: newPlan.version,
      createdAt: newPlan.created_at,
    });
  } catch (error) {
    console.log("Error generating plan:", error);
    return json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
