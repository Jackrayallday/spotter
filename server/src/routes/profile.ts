import {Router, type Request, type Response} from "express";
import { prisma } from "../lib/prisma";

export const profileRouter = Router();

profileRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({
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
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

profileRouter.post("/", async (req: Request, res: Response) => {
  try {
    const {userId, ...profileData} = req.body;

    if(!userId) {
      return res.status(400).json({ error: "User ID is required" });
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
      return res.status(400).json({ error: "Missing required profile fields" });
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
      }      
    });

    res.json({success : true});

    

  }catch (error) {
    console.error("Error in profile route:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
})
