import { prisma } from "../server/src/lib/prisma";

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

    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

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

    await prisma.user_profiles.upsert({
      where: { user_id: userId },
      update: {
        goal,
        experience,
        days_per_week: daysPerWeek,
        session_length: sessionLength,
        equipment,
        injuries: injuries || null,
        preferred_split: preferredSplit,
        update_at: new Date(),
      },
      create: {
        user_id: userId,
        goal,
        experience,
        days_per_week: daysPerWeek,
        session_length: sessionLength,
        equipment,
        injuries: injuries || null,
        preferred_split: preferredSplit,
        update_at: new Date(),
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error in profile route:", error);
    return json({ error: "Failed to save profile" }, { status: 500 });
  }
}
