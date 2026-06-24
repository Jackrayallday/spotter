import { pool } from "./lib/db.js";
import { calculateNutritionPlan, deriveNutritionGoal, validateNutritionInputs, type NutritionInputs } from "./lib/nutrition.js";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return json({ error: "User ID is required" }, { status: 400 });

    const result = await pool.query(
      `SELECT goal, experience, days_per_week, session_length, equipment, injuries, preferred_split,
              age, calculation_sex, height_feet, height_inches, weight_pounds, activity_level,
              nutrition_goal, desired_pace, bmr_kcal, tdee_kcal, daily_adjustment_kcal, target_kcal
       FROM user_profiles WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    const profile = result.rows[0];
    if (!profile) return json({ error: "Profile not found" }, { status: 404 });

    return json({
      goal: profile.goal, experience: profile.experience, daysPerWeek: profile.days_per_week,
      sessionLength: profile.session_length, equipment: profile.equipment, injuries: profile.injuries,
      preferredSplit: profile.preferred_split, age: profile.age, calculationSex: profile.calculation_sex,
      heightFeet: profile.height_feet, heightInches: profile.height_inches,
      weightPounds: profile.weight_pounds === null ? null : Number(profile.weight_pounds),
      activityLevel: profile.activity_level, nutritionGoal: profile.nutrition_goal, desiredPace: profile.desired_pace,
      bmrKcal: profile.bmr_kcal, tdeeKcal: profile.tdee_kcal,
      dailyAdjustmentKcal: profile.daily_adjustment_kcal, targetKcal: profile.target_kcal,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, ...profileData } = await request.json();
    if (!userId) return json({ error: "User ID is required" }, { status: 400 });

    const { goal, experience, daysPerWeek, sessionLength, equipment, injuries, preferredSplit, age,
      calculationSex, heightFeet, heightInches, weightPounds, activityLevel, desiredPace } = profileData;
    if (!goal || !experience || !daysPerWeek || !sessionLength || !equipment || !preferredSplit) {
      return json({ error: "Missing required profile fields" }, { status: 400 });
    }

    const nutritionGoal = deriveNutritionGoal(goal);
    const nutritionInputs: NutritionInputs = {
      age: Number(age), calculationSex, heightFeet: Number(heightFeet), heightInches: Number(heightInches),
      weightPounds: Number(weightPounds), activityLevel, nutritionGoal,
      desiredPace: nutritionGoal === "maintenance" ? null : desiredPace,
    };
    const nutritionErrors = validateNutritionInputs(nutritionInputs);
    if (Object.keys(nutritionErrors).length > 0) return json({ error: "Invalid nutrition profile", fields: nutritionErrors }, { status: 400 });
    const nutritionPlan = calculateNutritionPlan(nutritionInputs);

    await pool.query(
      `INSERT INTO user_profiles (
        user_id, goal, experience, days_per_week, session_length, equipment, injuries, preferred_split,
        age, calculation_sex, height_feet, height_inches, weight_pounds, activity_level, nutrition_goal,
        desired_pace, bmr_kcal, tdee_kcal, daily_adjustment_kcal, target_kcal, update_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        goal = EXCLUDED.goal, experience = EXCLUDED.experience, days_per_week = EXCLUDED.days_per_week,
        session_length = EXCLUDED.session_length, equipment = EXCLUDED.equipment, injuries = EXCLUDED.injuries,
        preferred_split = EXCLUDED.preferred_split, age = EXCLUDED.age, calculation_sex = EXCLUDED.calculation_sex,
        height_feet = EXCLUDED.height_feet, height_inches = EXCLUDED.height_inches, weight_pounds = EXCLUDED.weight_pounds,
        activity_level = EXCLUDED.activity_level, nutrition_goal = EXCLUDED.nutrition_goal,
        desired_pace = EXCLUDED.desired_pace, bmr_kcal = EXCLUDED.bmr_kcal, tdee_kcal = EXCLUDED.tdee_kcal,
        daily_adjustment_kcal = EXCLUDED.daily_adjustment_kcal, target_kcal = EXCLUDED.target_kcal, update_at = NOW()`,
      [userId, goal, experience, Number(daysPerWeek), Number(sessionLength), equipment, injuries || null, preferredSplit,
        nutritionInputs.age, nutritionInputs.calculationSex, nutritionInputs.heightFeet, nutritionInputs.heightInches,
        nutritionInputs.weightPounds, nutritionInputs.activityLevel, nutritionInputs.nutritionGoal, nutritionInputs.desiredPace,
        nutritionPlan.bmrKcal, nutritionPlan.tdeeKcal, nutritionPlan.dailyAdjustmentKcal, nutritionPlan.targetKcal],
    );
    return json({ success: true });
  } catch (error) {
    console.error("Error in profile route:", error);
    return json({ error: "Failed to save profile" }, { status: 500 });
  }
}
