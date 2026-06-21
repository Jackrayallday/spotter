import { generateTrainingPlan } from "../lib/ai.js";
import { prisma } from "../lib/prisma.js";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      return json(
        { error: "User profile not found. Complete onboarding first" },
        { status: 400 },
      );
    }

    const latestPlan = await prisma.training_plan.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: { version: true },
    });

    const nextVersion = latestPlan ? latestPlan.version + 1 : 1;
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
    const newPlan = await prisma.training_plan.create({
      data: {
        user_id: userId,
        plan_json: planJson,
        plan_text: planText,
        version: nextVersion,
      },
    });

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
