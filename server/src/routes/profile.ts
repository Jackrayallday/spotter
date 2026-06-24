import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { calculateNutritionPlan, deriveNutritionGoal, validateNutritionInputs, type NutritionInputs } from "../lib/nutrition";

export const profileRouter = Router();

profileRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
    const profile = await prisma.user_profiles.findUnique({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json({
      goal: profile.goal, experience: profile.experience, daysPerWeek: profile.days_per_week,
      sessionLength: profile.session_length, equipment: profile.equipment, injuries: profile.injuries,
      preferredSplit: profile.preferred_split, age: profile.age, calculationSex: profile.calculation_sex,
      heightFeet: profile.height_feet, heightInches: profile.height_inches,
      weightPounds: profile.weight_pounds ? Number(profile.weight_pounds) : null, activityLevel: profile.activity_level,
      nutritionGoal: profile.nutrition_goal, desiredPace: profile.desired_pace, bmrKcal: profile.bmr_kcal,
      tdeeKcal: profile.tdee_kcal, dailyAdjustmentKcal: profile.daily_adjustment_kcal, targetKcal: profile.target_kcal,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

profileRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, ...profileData } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
    const { goal, experience, daysPerWeek, sessionLength, equipment, injuries, preferredSplit, age,
      calculationSex, heightFeet, heightInches, weightPounds, activityLevel, desiredPace } = profileData;
    if (!goal || !experience || !daysPerWeek || !sessionLength || !equipment || !preferredSplit) {
      return res.status(400).json({ error: "Missing required profile fields" });
    }
    const nutritionGoal = deriveNutritionGoal(goal);
    const nutritionInputs: NutritionInputs = {
      age: Number(age), calculationSex, heightFeet: Number(heightFeet), heightInches: Number(heightInches),
      weightPounds: Number(weightPounds), activityLevel, nutritionGoal,
      desiredPace: nutritionGoal === "maintenance" ? null : desiredPace,
    };
    const nutritionErrors = validateNutritionInputs(nutritionInputs);
    if (Object.keys(nutritionErrors).length > 0) return res.status(400).json({ error: "Invalid nutrition profile", fields: nutritionErrors });
    const nutritionPlan = calculateNutritionPlan(nutritionInputs);
    await prisma.user_profiles.upsert({
      where: { user_id: userId },
      update: {
        goal, experience, days_per_week: Number(daysPerWeek), session_length: Number(sessionLength), equipment,
        injuries: injuries || null, preferred_split: preferredSplit, age: nutritionInputs.age,
        calculation_sex: nutritionInputs.calculationSex, height_feet: nutritionInputs.heightFeet,
        height_inches: nutritionInputs.heightInches, weight_pounds: nutritionInputs.weightPounds,
        activity_level: nutritionInputs.activityLevel, nutrition_goal: nutritionInputs.nutritionGoal,
        desired_pace: nutritionInputs.desiredPace, bmr_kcal: nutritionPlan.bmrKcal, tdee_kcal: nutritionPlan.tdeeKcal,
        daily_adjustment_kcal: nutritionPlan.dailyAdjustmentKcal, target_kcal: nutritionPlan.targetKcal, update_at: new Date(),
      },
      create: {
        user_id: userId, goal, experience, days_per_week: Number(daysPerWeek), session_length: Number(sessionLength), equipment,
        injuries: injuries || null, preferred_split: preferredSplit, age: nutritionInputs.age,
        calculation_sex: nutritionInputs.calculationSex, height_feet: nutritionInputs.heightFeet,
        height_inches: nutritionInputs.heightInches, weight_pounds: nutritionInputs.weightPounds,
        activity_level: nutritionInputs.activityLevel, nutrition_goal: nutritionInputs.nutritionGoal,
        desired_pace: nutritionInputs.desiredPace, bmr_kcal: nutritionPlan.bmrKcal, tdee_kcal: nutritionPlan.tdeeKcal,
        daily_adjustment_kcal: nutritionPlan.dailyAdjustmentKcal, target_kcal: nutritionPlan.targetKcal, update_at: new Date(),
      },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("Error in profile route:", error);
    return res.status(500).json({ error: "Failed to save profile" });
  }
});
