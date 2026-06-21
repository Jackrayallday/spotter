import { pool } from "../lib/db.js";

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
      `SELECT id, user_id, plan_json, plan_text, version, created_at
       FROM training_plan
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );

    const plan = result.rows[0];

    if (!plan) {
      return json({ error: "No plan found" }, { status: 404 });
    }

    return json({
      id: plan.id,
      userId: plan.user_id,
      planJson: plan.plan_json,
      planText: plan.plan_text,
      version: plan.version,
      createdAt: plan.created_at,
    });
  } catch (error) {
    console.log("Error fetching current plan:", error);
    return json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
