import { prisma } from "../../server/src/lib/prisma";

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

    const plan = await prisma.training_plan.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

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
